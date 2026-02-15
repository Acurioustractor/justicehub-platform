import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type CoverageData = {
  state: string;
  services_count: number;
  interventions_count: number;
  funding_opportunities: number;
  coverage_score: number;
};

type InterventionRow = {
  id: string;
  name: string;
  type: string | null;
  cost_per_young_person: number | null;
  evidence_level: string | null;
  evidence_strength_signal: number | null;
  geography: string[] | null;
  operating_organization: string | null;
  portfolio_score: number | null;
  service_area_km: number | null;
  years_operating: number | null;
  target_cohort: string[] | null;
};

type EvidenceMatrixCell = {
  topic: string;
  jurisdiction: string;
  count: number;
  quality_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
};

const STATE_CODES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'] as const;

const JURISDICTION_MAP: Record<string, string> = {
  nsw: 'NSW',
  'new south wales': 'NSW',
  vic: 'VIC',
  victoria: 'VIC',
  qld: 'QLD',
  queensland: 'QLD',
  wa: 'WA',
  'western australia': 'WA',
  sa: 'SA',
  'south australia': 'SA',
  tas: 'TAS',
  tasmania: 'TAS',
  nt: 'NT',
  'northern territory': 'NT',
  act: 'ACT',
  'australian capital territory': 'ACT',
  national: 'National',
  australia: 'National',
};

const TOPIC_MAP: Record<string, string> = {
  'youth justice': 'youth_justice',
  youth_justice: 'youth_justice',
  'juvenile justice': 'youth_justice',
  detention: 'detention',
  custody: 'detention',
  diversion: 'diversion',
  indigenous: 'indigenous',
  'first nations': 'indigenous',
  aboriginal: 'indigenous',
  recidivism: 'recidivism',
  'mental health': 'mental_health',
  mental_health: 'mental_health',
  family: 'family',
  education: 'education',
  employment: 'employment',
  'child protection': 'child_protection',
  child_protection: 'child_protection',
  housing: 'housing',
  policy: 'policy',
};

const DEFAULT_COST_BY_TYPE: Record<string, number> = {
  Prevention: 8000,
  'Early Intervention': 14000,
  Diversion: 21000,
  Therapeutic: 32000,
  'Wraparound Support': 26000,
  'Family Strengthening': 18000,
  'Cultural Connection': 15000,
  'Education/Employment': 17000,
  'Justice Reinvestment': 28000,
  'Community-Led': 12000,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  return [];
}

function normalizeJurisdiction(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return JURISDICTION_MAP[normalized] || null;
}

function normalizeTopic(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (TOPIC_MAP[normalized]) return TOPIC_MAP[normalized];
  return normalized.replace(/\s+/g, '_').replace(/-/g, '_');
}

function getEvidenceBaseScore(level: string | null): number {
  if (!level) return 55;
  const normalized = level.toLowerCase();
  if (normalized.includes('proven')) return 85;
  if (normalized.includes('effective')) return 75;
  if (normalized.includes('indigenous-led')) return 80;
  if (normalized.includes('promising')) return 65;
  if (normalized.includes('untested')) return 40;
  return 55;
}

function getDefaultCost(type: string | null): number {
  if (!type) return DEFAULT_COST_BY_TYPE['Community-Led'];
  return DEFAULT_COST_BY_TYPE[type] || DEFAULT_COST_BY_TYPE['Community-Led'];
}

function getReachScore(intervention: InterventionRow): number {
  let reach = 50;
  if (typeof intervention.service_area_km === 'number') {
    reach += Math.min(350, Math.round(intervention.service_area_km / 5));
  }
  if (typeof intervention.years_operating === 'number') {
    reach += Math.min(120, intervention.years_operating * 8);
  }
  if (Array.isArray(intervention.geography)) {
    reach += intervention.geography.length * 20;
  }
  if (Array.isArray(intervention.target_cohort)) {
    reach += intervention.target_cohort.length * 15;
  }
  return clamp(Math.round(reach), 30, 800);
}

function getEffectivenessScore(intervention: InterventionRow): number {
  let score = getEvidenceBaseScore(intervention.evidence_level);

  if (typeof intervention.evidence_strength_signal === 'number') {
    if (intervention.evidence_strength_signal >= 0 && intervention.evidence_strength_signal <= 1) {
      score += intervention.evidence_strength_signal * 20;
    } else {
      score += Math.min(intervention.evidence_strength_signal, 20);
    }
  }

  if (typeof intervention.portfolio_score === 'number') {
    if (intervention.portfolio_score >= 0 && intervention.portfolio_score <= 1) {
      score += intervention.portfolio_score * 10;
    } else {
      score += (intervention.portfolio_score - 50) / 5;
    }
  }

  return Math.round(clamp(score, 5, 99));
}

function getQualityBucket(value: unknown): 'high' | 'medium' | 'low' {
  if (typeof value !== 'string') return 'low';
  const normalized = value.toLowerCase();
  if (normalized.includes('high') || normalized.includes('strong')) return 'high';
  if (normalized.includes('medium') || normalized.includes('moderate')) return 'medium';
  return 'low';
}

function collectErrors(results: Array<{ error: { message?: string } | null }>): string[] {
  return results
    .map((result) => result.error?.message)
    .filter((message): message is string => Boolean(message));
}

function buildProvenance() {
  return {
    mode: 'computed' as const,
    summary:
      'Counts are authoritative DB reads; coverage score, effectiveness score, and evidence matrix rollups are computed in API runtime.',
    sources: [
      { table: 'services', role: 'primary', classification: 'canonical' },
      { table: 'alma_interventions', role: 'primary', classification: 'canonical' },
      { table: 'alma_evidence', role: 'primary', classification: 'canonical' },
      { table: 'organizations', role: 'supporting', classification: 'canonical' },
      { table: 'alma_funding_opportunities', role: 'supporting', classification: 'canonical' },
    ],
    computed_fields: ['coverageData.coverage_score', 'interventionData.effectiveness_score', 'evidenceMatrix'],
    generated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [
      servicesCountResult,
      interventionsCountResult,
      evidenceCountResult,
      organizationsCountResult,
      fundingCountResult,
      servicesByStateResult,
      interventionsByStateResult,
      fundingByStateResult,
      interventionsResult,
      evidenceResult,
    ] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
      supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase
        .from('alma_funding_opportunities')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'closing_soon']),
      supabase
        .from('services')
        .select('location_state')
        .not('location_state', 'is', null),
      supabase.from('alma_interventions').select('geography').range(0, 4999),
      supabase
        .from('alma_funding_opportunities')
        .select('jurisdictions')
        .in('status', ['open', 'closing_soon'])
        .range(0, 4999),
      supabase
        .from('alma_interventions')
        .select(
          'id, name, type, cost_per_young_person, evidence_level, evidence_strength_signal, geography, operating_organization, portfolio_score, service_area_km, years_operating, target_cohort'
        )
        .order('updated_at', { ascending: false })
        .limit(120),
      supabase.from('alma_evidence').select('metadata').range(0, 1999),
    ]);

    const errors = collectErrors([
      servicesCountResult,
      interventionsCountResult,
      evidenceCountResult,
      organizationsCountResult,
      fundingCountResult,
      servicesByStateResult,
      interventionsByStateResult,
      fundingByStateResult,
      interventionsResult,
      evidenceResult,
    ]);

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    const serviceStateCounts: Record<string, number> = {};
    for (const row of servicesByStateResult.data || []) {
      const state = normalizeJurisdiction(row.location_state);
      if (!state || state === 'National') continue;
      serviceStateCounts[state] = (serviceStateCounts[state] || 0) + 1;
    }

    const interventionStateCounts: Record<string, number> = {};
    for (const row of interventionsByStateResult.data || []) {
      const jurisdictions = toStringArray(row.geography);
      const uniqueStates = new Set<string>();
      for (const jurisdiction of jurisdictions) {
        const state = normalizeJurisdiction(jurisdiction);
        if (!state || state === 'National') continue;
        uniqueStates.add(state);
      }
      for (const state of uniqueStates) {
        interventionStateCounts[state] = (interventionStateCounts[state] || 0) + 1;
      }
    }

    const fundingStateCounts: Record<string, number> = {};
    for (const row of fundingByStateResult.data || []) {
      const jurisdictions = toStringArray(row.jurisdictions);
      const uniqueStates = new Set<string>();
      for (const jurisdiction of jurisdictions) {
        const state = normalizeJurisdiction(jurisdiction);
        if (!state || state === 'National') continue;
        uniqueStates.add(state);
      }
      for (const state of uniqueStates) {
        fundingStateCounts[state] = (fundingStateCounts[state] || 0) + 1;
      }
    }

    let coverageData: CoverageData[] = STATE_CODES.map((state) => ({
      state,
      services_count: serviceStateCounts[state] || 0,
      interventions_count: interventionStateCounts[state] || 0,
      funding_opportunities: fundingStateCounts[state] || 0,
      coverage_score: 0,
    }));

    const servicesMax = Math.max(...coverageData.map((item) => item.services_count), 1);
    const interventionsMax = Math.max(...coverageData.map((item) => item.interventions_count), 1);
    const fundingMax = Math.max(...coverageData.map((item) => item.funding_opportunities), 1);

    coverageData = coverageData.map((item) => {
      const weightedScore =
        (item.services_count / servicesMax) * 0.5 +
        (item.interventions_count / interventionsMax) * 0.35 +
        (item.funding_opportunities / fundingMax) * 0.15;

      return {
        ...item,
        coverage_score: Math.round(clamp(weightedScore * 100, 0, 100)),
      };
    });

    const interventionData = ((interventionsResult.data || []) as InterventionRow[]).map((intervention) => {
      const jurisdictions = toStringArray(intervention.geography);
      const normalizedState = jurisdictions
        .map((jurisdiction) => normalizeJurisdiction(jurisdiction))
        .find((state): state is string => Boolean(state) && state !== 'National');

      return {
        id: intervention.id,
        name: intervention.name,
        type: intervention.type || 'Community-Led',
        cost_per_participant:
          typeof intervention.cost_per_young_person === 'number'
            ? Math.round(intervention.cost_per_young_person)
            : getDefaultCost(intervention.type),
        effectiveness_score: getEffectivenessScore(intervention),
        reach: getReachScore(intervention),
        evidence_level: intervention.evidence_level || 'Promising',
        state: normalizedState || 'National',
        organization: intervention.operating_organization || '',
      };
    });

    const evidenceMatrixMap = new Map<string, EvidenceMatrixCell>();
    for (const row of evidenceResult.data || []) {
      const metadata =
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};

      const topicsRaw = toStringArray(metadata.topics);
      const jurisdictionsRaw = toStringArray(metadata.jurisdictions);
      const topics =
        topicsRaw.length > 0 ? [...new Set(topicsRaw.map(normalizeTopic))] : ['youth_justice'];

      const jurisdictions = jurisdictionsRaw
        .map((jurisdiction) => normalizeJurisdiction(jurisdiction))
        .filter((value): value is string => Boolean(value));

      const jurisdictionsForRow =
        jurisdictions.length > 0 ? [...new Set(jurisdictions)] : ['National'];
      const qualityBucket = getQualityBucket(metadata.evidence_quality);

      for (const topic of topics) {
        for (const jurisdiction of jurisdictionsForRow) {
          const key = `${topic}::${jurisdiction}`;
          if (!evidenceMatrixMap.has(key)) {
            evidenceMatrixMap.set(key, {
              topic,
              jurisdiction,
              count: 0,
              quality_breakdown: {
                high: 0,
                medium: 0,
                low: 0,
              },
            });
          }
          const cell = evidenceMatrixMap.get(key)!;
          cell.count += 1;
          cell.quality_breakdown[qualityBucket] += 1;
        }
      }
    }

    const evidenceMatrix = Array.from(evidenceMatrixMap.values()).sort((a, b) =>
      a.topic === b.topic ? a.jurisdiction.localeCompare(b.jurisdiction) : a.topic.localeCompare(b.topic)
    );

    return NextResponse.json({
      success: true,
      stats: {
        services: servicesCountResult.count || 0,
        interventions: interventionsCountResult.count || 0,
        evidence: evidenceCountResult.count || 0,
        funding_opportunities: fundingCountResult.count || 0,
        organizations: organizationsCountResult.count || 0,
        coverage_by_state: serviceStateCounts,
      },
      coverageData,
      interventionData,
      evidenceMatrix,
      lastUpdated: new Date().toISOString(),
      provenance: buildProvenance(),
    });
  } catch (error) {
    console.error('Error fetching intelligence overview summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch overview summary',
      },
      { status: 500 }
    );
  }
}
