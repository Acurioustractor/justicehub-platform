#!/usr/bin/env node
/**
 * Board & Leadership Enrichment Scraper
 *
 * Discovers real people (board members, CEOs, leadership) at top ally organizations
 * by scraping their websites via Jina and extracting structured data via LLM.
 *
 * Usage:
 *   node scripts/enrich-org-boards.mjs              # Top 200 allies (dry-run)
 *   node scripts/enrich-org-boards.mjs --apply       # Write to DB
 *   node scripts/enrich-org-boards.mjs --limit 50    # Top 50 only
 *   node scripts/enrich-org-boards.mjs --apply --limit 10
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const limit = parseInt(args.find((_, i) => args[i - 1] === '--limit') || '200');
const fromFile = args.find((_, i) => args[i - 1] === '--from-file');
const skipExisting = args.includes('--skip-existing');

let callLLM, parseJSON, scrapeViaJina;

async function loadModules() {
  const { LLMClient } = await import('../src/lib/ai/model-router.ts');
  const parseJsonModule = await import('../src/lib/ai/parse-json.ts');
  const jinaModule = await import('../src/lib/scraping/jina-reader.ts');
  callLLM = (prompt, options) => LLMClient.getInstance().call(prompt, options);
  parseJSON = parseJsonModule.parseJSON;
  scrapeViaJina = jinaModule.scrapeViaJina;
}

// Keywords that indicate a page about people/leadership
const PEOPLE_LINK_KEYWORDS = /\b(board|our-board|our-people|our-team|leadership|governance|directors|executive-team|staff|who-we-are.*board|who-we-are.*team|who-we-are.*people)\b/i;

// Hardcoded paths as fallback — but dynamic discovery from nav is preferred
const SUBPAGE_PATHS = [
  '/our-people', '/our-team', '/board', '/our-board',
  '/governance', '/leadership', '/team', '/staff',
  '/about/our-people', '/about/our-team', '/about/board',
  '/about/governance', '/about/leadership',
  '/about-us/our-team', '/about-us/our-people',
  '/about-us/leadership', '/about-us/board',
  '/who-we-are/our-people', '/who-we-are/board',
  '/who-we-are/our-board', '/who-we-are/our-team',
  '/who-we-are/leadership', '/who-we-are/governance',
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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeUrl(website) {
  let url = website.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  // Remove trailing slash
  return url.replace(/\/+$/, '');
}

/**
 * Strip nav chrome and footer from Jina markdown.
 * Jina embeds the full site navigation menu as dense blocks of markdown links.
 * These can be 20-30K chars on government sites, pushing actual content beyond the 15K cap.
 * Strategy: remove blocks of 3+ consecutive nav-link lines, then cut footer.
 */
function stripNavChrome(markdown) {
  // Phase 1: Remove dense nav link blocks (3+ consecutive "* [text](url)" lines)
  const lines = markdown.split('\n');
  const result = [];
  let navBlockStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const isNavLink = /^\s*\*\s+\[.*\]\(https?:\/\//.test(lines[i]);

    if (isNavLink) {
      if (navBlockStart === -1) navBlockStart = i;
    } else {
      if (navBlockStart !== -1) {
        const blockLen = i - navBlockStart;
        if (blockLen < 3) {
          // Short block — keep it (likely inline content links, not site nav)
          for (let j = navBlockStart; j < i; j++) result.push(lines[j]);
        }
        // 3+ consecutive nav links = site menu — strip
        navBlockStart = -1;
      }
      result.push(lines[i]);
    }
  }
  if (navBlockStart !== -1 && lines.length - navBlockStart < 3) {
    for (let j = navBlockStart; j < lines.length; j++) result.push(lines[j]);
  }

  let cleaned = result.join('\n');

  // Phase 2: Cut footer
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
    if (match && match.index < cutPoint) {
      cutPoint = match.index;
    }
  }

  return cleaned.substring(0, cutPoint).trim();
}

/**
 * Extract internal links from Jina markdown that look like people/board pages.
 * Jina renders links as [text](url) in markdown.
 */
// Higher score = more likely to be the actual board/people page
function scorePeopleLink(text, href) {
  let score = 0;
  const t = text.toLowerCase();
  const h = href.toLowerCase();
  // Direct board/people mentions get highest priority
  if (t.match(/\b(board\s*members?|our\s*board)\b/) || h.match(/board-members|our-board/)) score += 10;
  if (t.match(/\b(our\s*people|our\s*team|executive\s*team)\b/) || h.match(/our-people|our-team|executive/)) score += 8;
  if (t.match(/\b(leadership|directors)\b/) || h.match(/leadership|directors/)) score += 7;
  if (t.match(/\b(governance)\b/) || h.match(/governance/)) score += 4;
  // Penalize non-people governance pages (privacy, terms, whistleblowing)
  if (h.match(/privacy|terms|whistleblow|child-protect|cookie|policy/)) score -= 10;
  if (h.match(/\.pdf$/i)) score -= 10;
  if (h.match(/login|help-cent|system-page/i)) score -= 10;
  return score;
}

function discoverPeopleLinks(markdown, baseUrl) {
  const links = [];
  // Match markdown links: [text](url)
  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const text = match[1];
    const href = match[2];

    const score = scorePeopleLink(text, href);
    if (score <= 0) continue;

    // Clean href — Jina sometimes appends link text as %20"text" at end of URL
    let cleanHref = href.replace(/%20"[^"]*"$/g, '').replace(/\s+"[^"]*"$/g, '').trim();
    // Also strip any trailing quotes or encoded quotes
    cleanHref = cleanHref.replace(/%22[^%]*$/g, '').replace(/%20%22.*$/g, '');

    // Resolve relative URLs
    let fullUrl;
    try {
      if (cleanHref.startsWith('http')) {
        fullUrl = cleanHref;
      } else if (cleanHref.startsWith('/')) {
        const base = new URL(baseUrl);
        fullUrl = `${base.protocol}//${base.host}${cleanHref}`;
      } else {
        fullUrl = `${baseUrl}/${cleanHref}`;
      }
      // Only keep same-domain links
      const baseHost = new URL(baseUrl).host;
      const linkHost = new URL(fullUrl).host;
      if (linkHost === baseHost) {
        const normalized = fullUrl.replace(/\/+$/, '');
        links.push({ url: normalized, score });
      }
    } catch { /* skip malformed URLs */ }
  }
  // Deduplicate by URL, keeping highest score, then sort descending
  const seen = new Map();
  for (const l of links) {
    if (!seen.has(l.url) || seen.get(l.url) < l.score) {
      seen.set(l.url, l.score);
    }
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([url, score]) => ({ url, score }));
}

async function scrapeOrgPages(website) {
  const baseUrl = normalizeUrl(website);
  const allContent = [];
  const triedUrls = new Set();
  let consecutiveTimeouts = 0;

  const PEOPLE_REGEX = /\b(director|ceo|chair(man|woman|person)?|board\s*(member|chair)?|member|executive|manager|founder|patron|chief|secretary|president|commissioner|head\s+of|trustee|ambassador|councillor|officer|general\s*manager)\b/i;

  async function tryUrl(url) {
    if (triedUrls.has(url)) return null;
    triedUrls.add(url);

    const content = await scrapeViaJina(url);
    if (!content || content.length < 200) {
      if (content === null) consecutiveTimeouts++;
      return null;
    }
    consecutiveTimeouts = 0;
    return content;
  }

  // Phase 1: Scrape /about or /about-us to discover nav links
  console.log('  🔍 Phase 1: Discovering nav links...');
  for (const aboutPath of ['/about', '/about-us', '/who-we-are']) {
    if (consecutiveTimeouts >= 3) break;
    const aboutUrl = baseUrl + aboutPath;
    const content = await tryUrl(aboutUrl);
    if (content) {
      // Discover people-related links from this page's navigation
      const discoveredLinks = discoverPeopleLinks(content, baseUrl);
      if (discoveredLinks.length > 0) {
        console.log(`  🔗 Discovered ${discoveredLinks.length} people links: ${discoveredLinks.map(l => `${new URL(l.url).pathname}(${l.score})`).join(', ')}`);
        // Try each discovered link (already sorted by score desc)
        for (const { url: link, score: linkScore } of discoveredLinks.slice(0, 5)) {
          if (consecutiveTimeouts >= 3 || allContent.length >= 2) break;
          const pageContent = await tryUrl(link);
          if (pageContent) {
            const stripped = stripNavChrome(pageContent);
            // High-scoring links (>=7) are trusted as people pages even without regex match
            if (linkScore >= 7 || stripped.match(PEOPLE_REGEX)) {
              allContent.push({ url: link, content: stripped.substring(0, 15000) });
              console.log(`  ✅ Found people page: ${new URL(link).pathname} (${stripped.length} chars, score=${linkScore})`);
            }
          }
          await sleep(1500);
        }
      }

      // Also check if the about page itself has people content
      if (allContent.length === 0) {
        const stripped = stripNavChrome(content);
        if (stripped.match(PEOPLE_REGEX)) {
          allContent.push({ url: aboutUrl, content: stripped.substring(0, 15000) });
        }
      }
    }
    if (allContent.length > 0) break;
    await sleep(1500);
  }

  // Phase 2: If discovery found nothing, try hardcoded paths
  if (allContent.length === 0) {
    console.log('  🔍 Phase 2: Trying hardcoded paths...');
    for (const path of SUBPAGE_PATHS) {
      if (consecutiveTimeouts >= 4 || allContent.length >= 2) break;
      const url = baseUrl + path;
      const content = await tryUrl(url);
      if (content) {
        const stripped = stripNavChrome(content);
        if (stripped.match(PEOPLE_REGEX)) {
          allContent.push({ url, content: stripped.substring(0, 15000) });
          console.log(`  ✅ Found people page: ${path} (${stripped.length} chars stripped)`);
        }
      }
      await sleep(1500);
    }
  }

  // Phase 3: Homepage as last resort
  if (allContent.length === 0) {
    console.log('  🔍 Phase 3: Trying homepage...');
    const content = await tryUrl(baseUrl);
    if (content) {
      const stripped = stripNavChrome(content);
      allContent.push({ url: baseUrl, content: stripped.substring(0, 15000) });
    }
  }

  return allContent;
}

async function extractPeople(orgName, scrapedPages) {
  if (scrapedPages.length === 0) return [];

  const combinedContent = scrapedPages
    .map((p) => `--- Page: ${p.url} ---\n${p.content}`)
    .join('\n\n')
    .substring(0, 20000); // Cap total content (nav chrome already stripped)

  const prompt = `Organization: ${orgName}\n\nWebpage content:\n${combinedContent}`;

  const verbose = process.argv.includes('--verbose');
  if (verbose) {
    console.log(`  [DEBUG] Content length: ${combinedContent.length} chars`);
    console.log(`  [DEBUG] First 500 chars:\n${combinedContent.substring(0, 500)}`);
  }

  try {
    const response = await callLLM(prompt, {
      systemPrompt: EXTRACTION_PROMPT,
      maxTokens: 2000,
      temperature: 0.1,
    });

    if (verbose) {
      console.log(`  [DEBUG] LLM response (first 500 chars):\n${response.substring(0, 500)}`);
    }

    const parsed = parseJSON(response);
    if (!Array.isArray(parsed)) {
      if (verbose) console.log(`  [DEBUG] parseJSON returned non-array:`, typeof parsed);
      return [];
    }

    // Filter: must have both name and position
    return parsed.filter(
      (p) =>
        p &&
        typeof p.name === 'string' &&
        p.name.trim().length > 2 &&
        typeof p.position === 'string' &&
        p.position.trim().length > 1
    );
  } catch (err) {
    console.warn(`  [LLM] Extraction failed for ${orgName}: ${err.message}`);
    return [];
  }
}

async function upsertPerson(person, orgName, sourceUrl) {
  const now = new Date().toISOString();

  // Check for existing person by name + company (case-insensitive)
  const { data: existing } = await supabase
    .from('person_identity_map')
    .select('person_id, data_sources')
    .ilike('full_name', person.name.trim())
    .ilike('current_company', orgName.trim())
    .limit(1);

  if (existing && existing.length > 0) {
    // Update existing
    const existingSources = existing[0].data_sources || [];
    const sources = [...new Set([...existingSources, 'website_scrape'])];
    const { error } = await supabase
      .from('person_identity_map')
      .update({
        current_position: person.position.trim(),
        data_sources: sources,
        discovered_via: existing[0].discovered_via || 'board_scrape',
        contact_data: {
          source_url: sourceUrl,
          scraped_at: now,
          ...(person.email ? { email: person.email } : {}),
          ...(person.linkedin ? { linkedin: person.linkedin } : {}),
          ...(person.bio ? { bio: person.bio.substring(0, 500) } : {}),
        },
        updated_at: now,
      })
      .eq('person_id', existing[0].person_id);

    if (error) console.warn(`  [DB] Update failed for ${person.name}: ${error.message}`);
    return 'updated';
  }

  // Insert new
  const { error } = await supabase.from('person_identity_map').insert({
    full_name: person.name.trim(),
    current_position: person.position.trim(),
    current_company: orgName.trim(),
    email: person.email || null,
    discovered_via: 'board_scrape',
    data_sources: ['website_scrape'],
    data_source: 'website_scrape',
    contact_data: {
      source_url: sourceUrl,
      scraped_at: now,
      ...(person.bio ? { bio: person.bio.substring(0, 500) } : {}),
      ...(person.linkedin ? { linkedin: person.linkedin } : {}),
    },
    tags: ['board_leadership'],
  });

  if (error) {
    console.warn(`  [DB] Insert failed for ${person.name}: ${error.message}`);
    return 'failed';
  }
  return 'created';
}

async function main() {
  console.log(`\n🏛️  Board & Leadership Enrichment Scraper`);
  console.log(`   Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY-RUN (no writes)'}`);
  console.log(`   Limit: ${limit} orgs\n`);

  await loadModules();

  // Fetch top ally organizations with websites
  let orgs = null;
  if (fromFile) {
    // Read org list from JSON file (bypasses PostgREST schema cache issues)
    try {
      const fileData = readFileSync(fromFile, 'utf8');
      orgs = JSON.parse(fileData).slice(0, limit);
      console.log(`  📂 Loaded ${orgs.length} orgs from ${fromFile}`);
    } catch (e) {
      console.error(`Failed to read org file: ${e.message}`);
      process.exit(1);
    }
  } else {
    // Fetch via PostgREST (retry on schema cache miss)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('campaign_alignment_entities')
        .select('id, name, website, composite_score, alignment_category')
        .eq('entity_type', 'organization')
        .not('website', 'is', null)
        .gt('composite_score', 30)
        .in('alignment_category', ['ally', 'potential_ally'])
        .order('composite_score', { ascending: false })
        .limit(limit);

      if (!error) { orgs = data; break; }
      console.log(`  ⏳ DB fetch attempt ${attempt + 1}/3 failed: ${error.message}`);
      if (attempt < 2) await sleep(5000);
      else { console.error('Failed to fetch orgs after 3 attempts'); process.exit(1); }
    }
  }

  // Optionally skip orgs we already have people for
  if (skipExisting) {
    const { data: existingOrgs } = await supabase
      .from('person_identity_map')
      .select('current_company')
      .eq('discovered_via', 'board_scrape');
    if (existingOrgs) {
      const done = new Set(existingOrgs.map(r => r.current_company?.toLowerCase()));
      const before = orgs.length;
      orgs = orgs.filter(o => !done.has(o.name.toLowerCase()));
      if (before !== orgs.length) console.log(`  ⏭️  Skipped ${before - orgs.length} already-scraped orgs`);
    }
  }

  console.log(`Found ${orgs.length} orgs to scrape\n`);

  const stats = {
    orgs_scraped: 0,
    orgs_failed: 0,
    orgs_no_people: 0,
    persons_found: 0,
    persons_created: 0,
    persons_updated: 0,
    persons_failed: 0,
  };

  // Collect all results for JSON fallback output
  const allExtracted = [];

  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    console.log(`[${i + 1}/${orgs.length}] ${org.name} (score: ${org.composite_score}, ${org.alignment_category})`);
    console.log(`  Website: ${org.website}`);

    try {
      // Scrape
      const pages = await scrapeOrgPages(org.website);
      if (pages.length === 0) {
        console.log('  ⚠️  No content scraped');
        stats.orgs_failed++;
        continue;
      }
      console.log(`  📄 Scraped ${pages.length} page(s) from ${pages.map((p) => p.url).join(', ')}`);

      // Extract
      const people = await extractPeople(org.name, pages);
      if (people.length === 0) {
        console.log('  ℹ️  No people found');
        stats.orgs_no_people++;
        stats.orgs_scraped++;
        continue;
      }

      console.log(`  👥 Found ${people.length} people:`);
      for (const p of people) {
        console.log(`     - ${p.name} (${p.position})`);
      }

      stats.persons_found += people.length;
      stats.orgs_scraped++;

      // Collect for JSON fallback
      for (const p of people) {
        allExtracted.push({
          name: p.name,
          position: p.position,
          bio: p.bio || null,
          org_name: org.name,
          org_id: org.id,
          source_url: pages[0]?.url || org.website,
          scraped_at: new Date().toISOString(),
        });
      }

      // Upsert
      if (applyMode) {
        const sourceUrl = pages[0].url;
        for (const person of people) {
          const result = await upsertPerson(person, org.name, sourceUrl);
          if (result === 'created') stats.persons_created++;
          else if (result === 'updated') stats.persons_updated++;
          else stats.persons_failed++;
        }
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      stats.orgs_failed++;
    }

    // Rate limit between orgs
    if (i < orgs.length - 1) await sleep(2000);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results:');
  console.log(`   Orgs scraped:    ${stats.orgs_scraped}`);
  console.log(`   Orgs failed:     ${stats.orgs_failed}`);
  console.log(`   Orgs no people:  ${stats.orgs_no_people}`);
  console.log(`   Persons found:   ${stats.persons_found}`);
  if (applyMode) {
    console.log(`   Persons created: ${stats.persons_created}`);
    console.log(`   Persons updated: ${stats.persons_updated}`);
    console.log(`   Persons failed:  ${stats.persons_failed}`);
  } else {
    console.log('   (dry-run — no DB writes)');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Save all extracted people to JSON fallback file
  if (allExtracted.length > 0) {
    const outPath = '/tmp/enrichment-results.json';
    writeFileSync(outPath, JSON.stringify(allExtracted, null, 2));
    console.log(`💾 Saved ${allExtracted.length} people to ${outPath}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
