import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EvidenceItem {
  id: string;
  title: string;
  evidence_type: string;
  findings: string;
  effect_size?: string;
  organization?: string;
  publication_date?: string;
  source_url?: string;
  metadata?: {
    jurisdictions?: string[];
    topics?: string[];
    evidence_quality?: string;
  };
}

// Keyword-based topic extraction
const TOPIC_KEYWORDS: Record<string, string[]> = {
  youth_justice: ['youth justice', 'juvenile justice', 'young offender', 'youth detention', 'youth crime'],
  detention: ['detention', 'incarceration', 'custody', 'prison', 'remand', 'locked up'],
  diversion: ['diversion', 'divert', 'alternative', 'restorative', 'community-based'],
  indigenous: ['indigenous', 'aboriginal', 'torres strait', 'first nations', 'koori', 'murri'],
  recidivism: ['recidivism', 'reoffend', 're-offend', 'reincarceration', 'return to custody'],
  mental_health: ['mental health', 'psychological', 'psychiatric', 'trauma', 'anxiety', 'depression', 'wellbeing'],
  family: ['family', 'parent', 'carer', 'kinship', 'household', 'sibling'],
  education: ['education', 'school', 'learning', 'literacy', 'training', 'vocational'],
  employment: ['employment', 'job', 'work', 'career', 'workforce'],
  child_protection: ['child protection', 'out-of-home care', 'foster', 'welfare', 'child safety'],
};

// Jurisdiction extraction
const JURISDICTION_KEYWORDS: Record<string, string[]> = {
  National: ['australia', 'australian', 'national', 'federal', 'commonwealth'],
  NSW: ['new south wales', 'nsw', 'sydney'],
  VIC: ['victoria', 'vic', 'melbourne'],
  QLD: ['queensland', 'qld', 'brisbane'],
  WA: ['western australia', 'wa', 'perth'],
  SA: ['south australia', 'sa', 'adelaide'],
  TAS: ['tasmania', 'tas', 'hobart'],
  NT: ['northern territory', 'nt', 'darwin', 'alice springs'],
  ACT: ['australian capital territory', 'act', 'canberra'],
};

function extractTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics;
}

function extractJurisdictions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const jurisdictions: string[] = [];

  for (const [jurisdiction, keywords] of Object.entries(JURISDICTION_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      jurisdictions.push(jurisdiction);
    }
  }

  // Default to National if no specific jurisdiction found
  if (jurisdictions.length === 0 && (lowerText.includes('australia') || lowerText.includes('australian'))) {
    jurisdictions.push('National');
  }

  return jurisdictions;
}

interface DigestSection {
  title: string;
  items: Array<{
    id: string;
    title: string;
    summary: string;
    type: string;
    quality: string;
    source_url?: string;
  }>;
}

interface ResearchDigest {
  period: {
    start: string;
    end: string;
  };
  summary: string;
  total_new_items: number;
  sections: DigestSection[];
  topic_coverage: Record<string, number>;
  jurisdiction_coverage: Record<string, number>;
  recommendations: string[];
  generated_at: string;
}

// POST - Generate a research digest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      period_days = 7,
      organization_id,
      topics,
      jurisdictions,
    } = body;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period_days);

    // Fetch new evidence from the period
    let query = supabase
      .from('alma_evidence')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    const { data: evidence, error } = await query;

    if (error) {
      console.error('Error fetching evidence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (evidence || []) as EvidenceItem[];

    // Filter by topics/jurisdictions if specified
    let filteredItems = items;
    if (topics && topics.length > 0) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.metadata?.topics?.some((t: string) => topics.includes(t)) ?? false
      );
    }
    if (jurisdictions && jurisdictions.length > 0) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.metadata?.jurisdictions?.some((j: string) =>
            jurisdictions.includes(j)
          ) ?? false
      );
    }

    // Group by evidence type
    const byType: Record<string, EvidenceItem[]> = {};
    for (const item of filteredItems) {
      const type = item.evidence_type || 'Other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(item);
    }

    // Build sections
    const sections: DigestSection[] = [];
    const sectionOrder = [
      'RCT (Randomized Control Trial)',
      'Quasi-experimental',
      'Program evaluation',
      'Longitudinal study',
      'Policy analysis',
      'Community-led research',
      'Case study',
      'Lived experience',
      'Cultural knowledge',
    ];

    for (const type of sectionOrder) {
      const typeItems = byType[type];
      if (!typeItems || typeItems.length === 0) continue;

      sections.push({
        title: type,
        items: typeItems.slice(0, 5).map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.findings?.substring(0, 200) + (item.findings?.length > 200 ? '...' : ''),
          type: item.evidence_type,
          quality: item.metadata?.evidence_quality || 'Unknown',
          source_url: item.source_url,
        })),
      });
    }

    // Calculate topic coverage (from metadata or content extraction)
    const topicCoverage: Record<string, number> = {};
    for (const item of filteredItems) {
      const content = `${item.title} ${item.findings || ''}`;
      const topics = item.metadata?.topics?.length
        ? item.metadata.topics
        : extractTopics(content);

      for (const topic of topics) {
        topicCoverage[topic] = (topicCoverage[topic] || 0) + 1;
      }
    }

    // Calculate jurisdiction coverage (from metadata or content extraction)
    const jurisdictionCoverage: Record<string, number> = {};
    for (const item of filteredItems) {
      const content = `${item.title} ${item.findings || ''} ${item.organization || ''}`;
      const jurisdictions = item.metadata?.jurisdictions?.length
        ? item.metadata.jurisdictions
        : extractJurisdictions(content);

      for (const jurisdiction of jurisdictions) {
        jurisdictionCoverage[jurisdiction] =
          (jurisdictionCoverage[jurisdiction] || 0) + 1;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    // Identify gaps
    const allTopics = [
      'youth_justice',
      'detention',
      'diversion',
      'indigenous',
      'recidivism',
      'mental_health',
    ];
    const missingTopics = allTopics.filter((t) => !topicCoverage[t]);
    if (missingTopics.length > 0) {
      recommendations.push(
        `Evidence gap: No new research on ${missingTopics.join(', ')} this period`
      );
    }

    // High-quality items to highlight
    const highQuality = filteredItems.filter(
      (item) => item.metadata?.evidence_quality === 'High'
    );
    if (highQuality.length > 0) {
      recommendations.push(
        `${highQuality.length} high-quality evidence items added - review for program development`
      );
    }

    // Effect size highlights
    const positiveEffects = filteredItems.filter((item) =>
      ['Large positive', 'Moderate positive'].includes(item.effect_size || '')
    );
    if (positiveEffects.length > 0) {
      recommendations.push(
        `${positiveEffects.length} items show positive intervention effects - consider for replication`
      );
    }

    // Generate summary
    const summary = generateSummary(filteredItems, topicCoverage, jurisdictionCoverage);

    const digest: ResearchDigest = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      summary,
      total_new_items: filteredItems.length,
      sections,
      topic_coverage: topicCoverage,
      jurisdiction_coverage: jurisdictionCoverage,
      recommendations,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(digest);
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json(
      { error: 'Failed to generate research digest' },
      { status: 500 }
    );
  }
}

function generateSummary(
  items: EvidenceItem[],
  topicCoverage: Record<string, number>,
  jurisdictionCoverage: Record<string, number>
): string {
  if (items.length === 0) {
    return 'No new research items were added during this period.';
  }

  const parts: string[] = [];

  // Count summary
  parts.push(`${items.length} new research items added to the evidence library`);

  // Top topics
  const topTopics = Object.entries(topicCoverage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic.replace('_', ' '));

  if (topTopics.length > 0) {
    parts.push(`Key topics covered: ${topTopics.join(', ')}`);
  }

  // Jurisdictions
  const jurisdictionCount = Object.keys(jurisdictionCoverage).length;
  if (jurisdictionCount > 0) {
    parts.push(`Research spans ${jurisdictionCount} jurisdiction(s)`);
  }

  // Evidence types
  const typeCount: Record<string, number> = {};
  for (const item of items) {
    const type = item.evidence_type || 'Other';
    typeCount[type] = (typeCount[type] || 0) + 1;
  }

  const topTypes = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type, count]) => `${count} ${type.toLowerCase()}`);

  if (topTypes.length > 0) {
    parts.push(`Includes ${topTypes.join(' and ')}`);
  }

  return parts.join('. ') + '.';
}

// GET - Get digest for current period (defaults to last 7 days)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Generate digest via POST internally
    const fakeRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ period_days: days }),
    });

    return POST(fakeRequest);
  } catch (error) {
    console.error('Error in digest GET:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
