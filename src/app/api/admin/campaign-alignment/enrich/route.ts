import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { scrapeViaJina } from '@/lib/scraping/jina-reader';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';

const SUBPAGE_PATHS = [
  '/about', '/about-us', '/our-people', '/our-team',
  '/board', '/governance', '/leadership', '/team',
  '/who-we-are', '/our-board', '/staff',
];

const EXTRACTION_PROMPT = `Extract ALL named people with leadership roles from the webpage content.

Look for: board members, directors, chairperson, CEO, executives, patrons, ambassadors, founders, secretary-general, managing director, general manager, chief officers.

People are often listed as:
- "Name — Title" or "Name, Title"
- Under headings like "Board", "Our Team", "Leadership", "Executive Team", "Governance"
- In bio paragraphs mentioning their role

Return a JSON array. Each element:
{"name": "Full Name", "position": "Their Role", "bio": "Brief bio or null", "email": null, "linkedin": null}

IMPORTANT: If you see ANY named person with a role, include them. Err on the side of including rather than excluding. Even a single CEO or Chair counts.

Return ONLY the JSON array, nothing else. If truly no people found, return [].`;

function normalizeUrl(website: string): string {
  let url = website.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  return url.replace(/\/+$/, '');
}

/**
 * Strip nav chrome and footer from Jina markdown.
 * Jina embeds the full site navigation menu as dense blocks of markdown links.
 * These can be 20-30K chars on government sites, pushing actual content beyond caps.
 */
function stripNavChrome(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let navBlockStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const isNavLink = /^\s*\*\s+\[.*\]\(https?:\/\//.test(lines[i]);
    if (isNavLink) {
      if (navBlockStart === -1) navBlockStart = i;
    } else {
      if (navBlockStart !== -1) {
        const blockLen = i - navBlockStart;
        if (blockLen < 3) {
          for (let j = navBlockStart; j < i; j++) result.push(lines[j]);
        }
        navBlockStart = -1;
      }
      result.push(lines[i]);
    }
  }
  if (navBlockStart !== -1 && lines.length - navBlockStart < 3) {
    for (let j = navBlockStart; j < lines.length; j++) result.push(lines[j]);
  }

  let cleaned = result.join('\n');

  const FOOTER_MARKERS = [
    /\n#{1,3}\s*(Acknowledgement|Acknowledgment)\s+of\s+(Country|Traditional)/i,
    /\n#{1,3}\s*(Footer|Site\s*Footer)\s*\n/i,
    /\n(#{1,3}\s*)?©\s*\d{4}/,
    /\n#{1,3}\s*(Privacy\s+Policy|Terms\s+of\s+Use|Terms\s+and\s+Conditions)\s*\n/i,
    /\n#{1,3}\s*(Follow\s+us|Connect\s+with\s+us|Stay\s+Connected)\s*\n/i,
    /\n#{1,3}\s*(Contact\s+Us|Get\s+in\s+Touch|Call\s+Us)\s*\n/i,
  ];
  let cutPoint = cleaned.length;
  for (const pattern of FOOTER_MARKERS) {
    const match = cleaned.match(pattern);
    if (match?.index !== undefined && match.index < cutPoint) cutPoint = match.index;
  }

  return cleaned.substring(0, cutPoint).trim();
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface ExtractedPerson {
  name: string;
  position: string;
  bio?: string | null;
  email?: string | null;
  linkedin?: string | null;
}

/**
 * POST /api/admin/campaign-alignment/enrich
 * Scrapes ally org websites for board/leadership info.
 * Admin-only. Accepts { limit?: number }.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 200);

    const service = createServiceClient();

    // Fetch top ally orgs with websites
    const { data: orgs, error: fetchErr } = await service
      .from('campaign_alignment_entities' as never)
      .select('id, name, website, composite_score, alignment_category')
      .eq('entity_type', 'organization')
      .not('website', 'is', null)
      .gt('composite_score', 30)
      .in('alignment_category', ['ally', 'potential_ally'])
      .order('composite_score', { ascending: false })
      .limit(limit);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const llm = LLMClient.getInstance();
    const stats = { orgs_scraped: 0, orgs_failed: 0, persons_found: 0, persons_created: 0, persons_updated: 0 };

    for (const org of (orgs || []) as Array<{ id: string; name: string; website: string; composite_score: number }>) {
      try {
        const baseUrl = normalizeUrl(org.website);
        let bestContent: { url: string; content: string } | null = null;

        // Try subpage paths
        for (const path of SUBPAGE_PATHS) {
          const url = baseUrl + path;
          const content = await scrapeViaJina(url);
          if (content && content.length > 200) {
            const stripped = stripNavChrome(content);
            bestContent = { url, content: stripped.substring(0, 15000) };
            if (stripped.match(/\b(director|ceo|chair|board|executive|manager|founder|patron)\b/i)) {
              break;
            }
          }
          await sleep(1500);
        }

        // Fallback to homepage
        if (!bestContent) {
          const content = await scrapeViaJina(baseUrl);
          if (content && content.length > 200) {
            const stripped = stripNavChrome(content);
            bestContent = { url: baseUrl, content: stripped.substring(0, 15000) };
          }
        }

        if (!bestContent) {
          stats.orgs_failed++;
          continue;
        }

        // Extract via LLM
        const prompt = `Organization: ${org.name}\n\nWebpage content:\n${bestContent.content}`;
        const response = await llm.call(prompt, {
          systemPrompt: EXTRACTION_PROMPT,
          maxTokens: 2000,
          temperature: 0.1,
        });

        const parsed = parseJSON<ExtractedPerson[]>(response);
        if (!Array.isArray(parsed)) { stats.orgs_scraped++; continue; }

        const people = parsed.filter(
          (p: ExtractedPerson) => p?.name?.trim()?.length > 2 && p?.position?.trim()?.length > 1
        );

        stats.persons_found += people.length;
        stats.orgs_scraped++;

        const now = new Date().toISOString();
        for (const person of people) {
          // Dedup check
          const { data: existing } = await service
            .from('person_identity_map')
            .select('person_id, data_sources')
            .ilike('full_name', person.name.trim())
            .ilike('current_company', org.name.trim())
            .limit(1);

          if (existing && existing.length > 0) {
            const existingSources = (existing[0].data_sources as string[]) || [];
            await service
              .from('person_identity_map')
              .update({
                current_position: person.position.trim(),
                data_sources: [...new Set([...existingSources, 'website_scrape'])],
                contact_data: {
                  source_url: bestContent.url,
                  scraped_at: now,
                  ...(person.email ? { email: person.email } : {}),
                  ...(person.linkedin ? { linkedin: person.linkedin } : {}),
                },
                updated_at: now,
              })
              .eq('person_id', existing[0].person_id);
            stats.persons_updated++;
          } else {
            const { error: insertErr } = await service.from('person_identity_map').insert({
              full_name: person.name.trim(),
              current_position: person.position.trim(),
              current_company: org.name.trim(),
              email: person.email || null,
              discovered_via: 'board_scrape',
              data_sources: ['website_scrape'],
              data_source: 'website_scrape',
              contact_data: {
                source_url: bestContent.url,
                scraped_at: now,
                ...(person.linkedin ? { linkedin: person.linkedin } : {}),
              },
              tags: ['board_leadership'],
            });
            if (!insertErr) stats.persons_created++;
          }
        }

        await sleep(2000); // Rate limit between orgs
      } catch {
        stats.orgs_failed++;
      }
    }

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Enrichment failed' },
      { status: 500 }
    );
  }
}
