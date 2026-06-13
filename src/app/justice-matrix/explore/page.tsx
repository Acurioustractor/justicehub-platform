import { createServiceClient } from '@/lib/supabase/service-lite';
import { SURFACES, asSurfaceKey } from '@/lib/justice-matrix/surfaces';
import { ExploreClient, type FacetSeed } from './ExploreClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Explore · Justice Matrix',
  description:
    'Search every strategic case, advocacy campaign, and Australian youth-justice evidence study in the Justice Matrix. Keyword or semantic. Cross-jurisdiction.',
};

type SP = Record<string, string | string[] | undefined>;

function sp(value: SP[string], def = ''): string {
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? def : def;
}

async function loadFacetSeed(): Promise<FacetSeed> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const [casesCount, campaignsCount, evidenceCount, allCats] = await Promise.all([
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
    supabase
      .from('alma_evidence')
      .select('*', { count: 'exact', head: true })
      .in('consent_level', ['Public Knowledge Commons', 'Community Controlled']),
    supabase.from('justice_matrix_cases').select('categories'),
  ]);

  const counts = new Map<string, number>();
  for (const row of (allCats.data ?? []) as { categories: string[] | null }[]) {
    for (const c of row.categories ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const topCategories = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18);

  return {
    topCategories,
    totals: {
      cases: casesCount.count ?? 0,
      campaigns: campaignsCount.count ?? 0,
      evidence: evidenceCount.count ?? 0,
    },
  };
}

async function loadInitial(params: {
  q: string;
  type: 'all' | 'case' | 'campaign' | 'evidence';
  scope: 'all' | 'au' | 'global';
  cats: string[];
  outcome: string;
  strength: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const limit = 24;

  // ALMA evidence is Australia-only with no categories/outcome/strength, so it
  // only seeds when none of those incompatible filters are active, and never
  // under the 'global' lens. Mirrors the gate in /api/justice-matrix/search.
  const includeEvidence =
    (params.type === 'all' || params.type === 'evidence') &&
    params.scope !== 'global' &&
    params.cats.length === 0 &&
    !params.outcome &&
    !params.strength;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caseTask: any =
    params.type === 'campaign'
      ? Promise.resolve({ data: [] })
      : (() => {
          let cq = supabase
            .from('justice_matrix_cases')
            .select(
              'id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,region,country_code,categories,outcome,precedent_strength,case_type,authoritative_link,verified,human_confirmed',
            )
            .order('year', { ascending: false, nullsFirst: false })
            .limit(limit);
          if (params.q) {
            const s = params.q;
            cq = cq.or(
              `case_citation.ilike.%${s}%,jurisdiction.ilike.%${s}%,strategic_issue.ilike.%${s}%,key_holding.ilike.%${s}%`,
            );
          }
          if (params.cats.length) cq = cq.overlaps('categories', params.cats);
          if (params.outcome) cq = cq.eq('outcome', params.outcome);
          if (params.strength) cq = cq.eq('precedent_strength', params.strength);
          if (params.scope === 'au') cq = cq.ilike('jurisdiction', '%australia%');
          else if (params.scope === 'global') cq = cq.not('jurisdiction', 'ilike', '%australia%');
          return cq;
        })();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaignTask: any =
    params.type === 'case'
      ? Promise.resolve({ data: [] })
      : (() => {
          let mq = supabase
            .from('justice_matrix_campaigns')
            .select(
              'id,campaign_name,country_region,start_year,is_ongoing,goals,notable_tactics,country_code,categories,lead_organizations,campaign_link',
            )
            .order('start_year', { ascending: false, nullsFirst: false })
            .limit(limit);
          if (params.q) {
            const s = params.q;
            mq = mq.or(
              `campaign_name.ilike.%${s}%,country_region.ilike.%${s}%,goals.ilike.%${s}%,notable_tactics.ilike.%${s}%,lead_organizations.ilike.%${s}%`,
            );
          }
          if (params.cats.length) mq = mq.overlaps('categories', params.cats);
          if (params.scope === 'au') mq = mq.ilike('country_region', '%australia%');
          else if (params.scope === 'global') mq = mq.not('country_region', 'ilike', '%australia%');
          return mq;
        })();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evidenceTask: any = !includeEvidence
    ? Promise.resolve({ data: [] })
    : (() => {
        let eq = supabase
          .from('alma_evidence')
          .select(
            'id,title,evidence_type,findings,methodology,organization,author,publication_date,source_url,source_document_url,consent_level,cultural_safety',
          )
          // Consent gate: exclude 'Strictly Private' (and NULL/unknown).
          .in('consent_level', ['Public Knowledge Commons', 'Community Controlled'])
          .order('publication_date', { ascending: false, nullsFirst: false })
          .limit(limit);
        if (params.q) {
          const s = params.q;
          eq = eq.or(
            `title.ilike.%${s}%,findings.ilike.%${s}%,methodology.ilike.%${s}%,organization.ilike.%${s}%,author.ilike.%${s}%`,
          );
        }
        return eq;
      })();

  const [caseRes, campaignRes, evidenceRes] = await Promise.all([
    caseTask,
    campaignTask,
    evidenceTask,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cases = (caseRes.data ?? []).map((r: any) => ({
    kind: 'case' as const,
    id: r.id,
    title: r.case_citation,
    jurisdiction: r.jurisdiction,
    year: r.year ?? null,
    court: r.court ?? null,
    excerpt: r.strategic_issue ?? r.key_holding ?? null,
    region: r.region ?? null,
    country_code: r.country_code ?? null,
    categories: r.categories ?? null,
    outcome: r.outcome ?? null,
    precedent_strength: r.precedent_strength ?? null,
    case_type: r.case_type ?? null,
    authoritative_link: r.authoritative_link ?? null,
    verified: r.verified ?? null,
    human_confirmed: typeof r.human_confirmed === 'boolean' ? r.human_confirmed : null,
    distance: null,
    rrf_score: null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaigns = (campaignRes.data ?? []).map((r: any) => ({
    kind: 'campaign' as const,
    id: r.id,
    title: r.campaign_name,
    region: r.country_region ?? null,
    start_year: r.start_year ?? null,
    is_ongoing: r.is_ongoing ?? null,
    excerpt: r.goals ?? r.notable_tactics ?? null,
    country_code: r.country_code ?? null,
    categories: r.categories ?? null,
    lead_organizations: r.lead_organizations ?? null,
    campaign_link: r.campaign_link ?? null,
    distance: null,
    rrf_score: null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evidence = (evidenceRes.data ?? []).map((r: any) => {
    const restricted = r.consent_level === 'Community Controlled';
    return {
      kind: 'evidence' as const,
      id: r.id,
      title: r.title,
      jurisdiction: 'Australia' as const,
      country_code: 'AU' as const,
      region: null,
      year: r.publication_date ? new Date(r.publication_date).getUTCFullYear() : null,
      evidence_type: r.evidence_type ?? null,
      // 'Community Controlled' → title + provenance only.
      excerpt: restricted ? null : r.findings ?? r.methodology ?? null,
      organization: r.organization ?? null,
      author: r.author ?? null,
      source_url: restricted ? null : r.source_url ?? r.source_document_url ?? null,
      consent_level: r.consent_level ?? null,
      cultural_safety: r.cultural_safety ?? null,
      restricted,
      distance: null,
    };
  });

  return {
    mode: 'keyword' as const,
    q: params.q,
    type: params.type,
    cases,
    campaigns,
    evidence,
    // Seed counts = loaded row lengths; the client refetches true per-type
    // counts from /api/justice-matrix/search on mount and corrects within ~220ms.
    counts: { case: cases.length, campaign: campaigns.length, evidence: evidence.length },
    total: cases.length + campaigns.length + evidence.length,
  };
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const q = sp(raw.q).replace(/[,()*%]/g, ' ').trim().slice(0, 120);
  const modeParam = sp(raw.mode);
  // Hybrid (RRF) is the default retrieval path; 'keyword' is the opt-out. A
  // legacy ?mode=semantic link resolves to hybrid (the API treats it as an alias).
  const mode: 'keyword' | 'hybrid' = modeParam === 'keyword' ? 'keyword' : 'hybrid';
  const typeParam = sp(raw.type);
  const type: 'all' | 'case' | 'campaign' | 'evidence' =
    typeParam === 'case' || typeParam === 'campaign' || typeParam === 'evidence'
      ? typeParam
      : 'all';
  const scopeParam = sp(raw.scope);
  const scope: 'all' | 'au' | 'global' =
    scopeParam === 'au' || scopeParam === 'global' ? scopeParam : 'all';
  const sortParam = sp(raw.sort);
  const sort: 'relevance' | 'newest' | 'oldest' | 'az' | 'jurisdiction' =
    (['relevance', 'newest', 'oldest', 'az', 'jurisdiction'] as const).includes(
      sortParam as 'relevance' | 'newest' | 'oldest' | 'az' | 'jurisdiction',
    )
      ? (sortParam as 'relevance' | 'newest' | 'oldest' | 'az' | 'jurisdiction')
      : 'newest';
  const viewParam = sp(raw.view);
  const view: 'list' | 'cards' | 'grouped' | 'jurisdiction' =
    viewParam === 'cards' || viewParam === 'grouped' || viewParam === 'jurisdiction'
      ? viewParam
      : 'list';
  const urlCats = sp(raw.cat)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const outcome = sp(raw.outcome);
  const strength = sp(raw.strength);

  // A surface is a lens: a preset of cat + scope plus framing. The preset is
  // only a DEFAULT, never a lock. If the URL carries an explicit cat or scope,
  // that wins. Absent any surface, every value below is byte-identical to the
  // neutral cross-search behaviour, so the existing explore cannot break.
  const surfaceKey = asSurfaceKey(sp(raw.surface));
  const hasUrlCat = typeof raw.cat === 'string' ? raw.cat.length > 0 : Array.isArray(raw.cat);
  const hasUrlScope = scopeParam === 'au' || scopeParam === 'global' || scopeParam === 'all';

  const cats = surfaceKey && !hasUrlCat ? SURFACES[surfaceKey].defaultCats : urlCats;
  const seededScope = surfaceKey && !hasUrlScope ? SURFACES[surfaceKey].defaultScope : scope;

  const [facetSeed, initialBase] = await Promise.all([
    loadFacetSeed(),
    loadInitial({ q, type, scope: seededScope, cats, outcome, strength }),
  ]);

  // When no filter is active the unfiltered facet totals are the true per-type
  // counts — better first paint than the loaded row lengths (client still
  // refetches accurate counts on mount for the filtered case).
  const unfiltered = !q && !cats.length && !outcome && !strength && seededScope === 'all';
  const initial = unfiltered
    ? {
        ...initialBase,
        counts: {
          case: facetSeed.totals.cases,
          campaign: facetSeed.totals.campaigns,
          evidence: facetSeed.totals.evidence,
        },
      }
    : initialBase;

  return (
    <ExploreClient
      facetSeed={facetSeed}
      initial={initial}
      initialState={{
        q,
        mode,
        type,
        scope: seededScope,
        sort,
        view,
        cats,
        outcome,
        strength,
        surface: surfaceKey,
      }}
    />
  );
}
