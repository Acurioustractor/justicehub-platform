import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  australianFrameworks as fallbackFrameworks,
  basecampLocations as fallbackBasecamps,
  internationalModels as fallbackInternationalModels,
  researchSources as fallbackResearchSources,
  type ExcellenceLocation,
} from '@/content/excellence-map-locations';

export const dynamic = 'force-dynamic';

const BASECAMP_SLUGS = ['oonchiumpa', 'bg-fit', 'mounty-yarns', 'picc-townsville'];

type CoeMapLocation = ExcellenceLocation;

function normalize(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function labelFromEnum(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => !!value && value.trim().length > 0))];
}

function extractOutcomeStats(outcomes: unknown): string[] {
  if (!Array.isArray(outcomes)) {
    return [];
  }

  return outcomes
    .map((outcome) => {
      if (!outcome || typeof outcome !== 'object') {
        return null;
      }
      const metric = typeof (outcome as { metric?: unknown }).metric === 'string'
        ? (outcome as { metric: string }).metric
        : null;
      const value = typeof (outcome as { value?: unknown }).value === 'string'
        ? (outcome as { value: string }).value
        : null;
      if (metric && value) {
        return `${metric}: ${value}`;
      }
      if (metric) {
        return metric;
      }
      if (value) {
        return value;
      }
      return null;
    })
    .filter((value): value is string => !!value)
    .slice(0, 3);
}

function extractResourceUrl(resources: unknown): string | undefined {
  if (!Array.isArray(resources)) {
    return undefined;
  }

  for (const resource of resources) {
    if (!resource || typeof resource !== 'object') {
      continue;
    }
    const url = (resource as { url?: unknown }).url;
    if (typeof url === 'string' && url.length > 0) {
      return url;
    }
  }

  return undefined;
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [basecampsResult, frameworksResult, internationalResult, researchResult, metricsResult] =
      await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, description, location, state, latitude, longitude, type, archived')
          .or(`type.eq.basecamp,slug.in.(${BASECAMP_SLUGS.join(',')})`)
          .eq('archived', false)
          .order('name', { ascending: true }),
        supabase
          .from('australian_frameworks')
          .select(
            'slug, name, state, overview, key_features, outcomes, resources, latitude, longitude, is_active, display_order'
          )
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('international_programs')
          .select(
            'slug, name, description, approach_summary, country, city_location, program_type, recidivism_rate, recidivism_comparison, evidence_strength, website_url, status'
          )
          .eq('status', 'published')
          .order('name', { ascending: true }),
        supabase
          .from('research_items')
          .select(
            'slug, title, organization, summary, jurisdiction, category, key_findings, external_url, is_featured, is_active, display_order'
          )
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('partner_impact_metrics')
          .select('organization_id, metric_name, metric_value, is_featured, display_order'),
      ]);

    if (basecampsResult.error) throw basecampsResult.error;
    if (frameworksResult.error) throw frameworksResult.error;
    if (internationalResult.error) throw internationalResult.error;
    if (researchResult.error) throw researchResult.error;
    if (metricsResult.error) throw metricsResult.error;

    const fallbackBasecampBySlug = new Map(fallbackBasecamps.map((item) => [item.id, item]));
    const fallbackFrameworkBySlug = new Map(fallbackFrameworks.map((item) => [item.id, item]));
    const fallbackInternationalBySlug = new Map(
      fallbackInternationalModels.map((item) => [item.id, item])
    );
    const fallbackResearchByNormalizedName = new Map(
      fallbackResearchSources.map((item) => [normalize(item.name), item])
    );

    const metricsByOrganization = new Map<
      string,
      Array<{
        metric_name: string;
        metric_value: string;
        is_featured: boolean | null;
        display_order: number | null;
      }>
    >();

    for (const metric of metricsResult.data || []) {
      const current = metricsByOrganization.get(metric.organization_id) || [];
      current.push(metric);
      metricsByOrganization.set(metric.organization_id, current);
    }

    const basecampLocations: CoeMapLocation[] = (basecampsResult.data || [])
      .map((org) => {
        const fallback = org.slug ? fallbackBasecampBySlug.get(org.slug) : undefined;
        const lat = org.latitude ?? fallback?.coordinates.lat;
        const lng = org.longitude ?? fallback?.coordinates.lng;

        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          return null;
        }

        const orgMetrics = (metricsByOrganization.get(org.id) || [])
          .sort((a, b) => {
            const featuredA = a.is_featured ? 0 : 1;
            const featuredB = b.is_featured ? 0 : 1;
            if (featuredA !== featuredB) {
              return featuredA - featuredB;
            }
            return (a.display_order || 0) - (b.display_order || 0);
          })
          .slice(0, 3)
          .map((metric) => `${metric.metric_value} ${metric.metric_name}`.trim());

        return {
          id: org.slug || org.id,
          name: org.name,
          category: 'basecamp',
          type: 'training',
          description:
            org.description ||
            fallback?.description ||
            'Community-led basecamp in the JusticeHub network.',
          coordinates: { lat, lng },
          country: 'Australia',
          city: fallback?.city,
          state: org.state || fallback?.state,
          keyStats: orgMetrics.length > 0 ? orgMetrics : fallback?.keyStats || [],
          tags: unique(['basecamp', org.type, org.state, ...(fallback?.tags || [])]),
          detailUrl: org.slug ? `/organizations/${org.slug}` : fallback?.detailUrl || '/centre-of-excellence',
          externalUrl: fallback?.externalUrl,
          featured: fallback?.featured ?? true,
        };
      })
      .filter((item): item is CoeMapLocation => !!item);

    const frameworkLocations: CoeMapLocation[] = (frameworksResult.data || [])
      .map((framework) => {
        const fallback = fallbackFrameworkBySlug.get(framework.slug);
        const lat = framework.latitude ?? fallback?.coordinates.lat;
        const lng = framework.longitude ?? fallback?.coordinates.lng;

        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          return null;
        }

        const keyStats = extractOutcomeStats(framework.outcomes);
        const externalUrl = extractResourceUrl(framework.resources) || fallback?.externalUrl;

        return {
          id: framework.slug,
          name: framework.name,
          category: 'australian-framework',
          type: 'best-practice',
          description: framework.overview || fallback?.description || 'Australian youth justice framework.',
          coordinates: { lat, lng },
          country: 'Australia',
          city: fallback?.city,
          state: framework.state || fallback?.state,
          keyStats: keyStats.length > 0 ? keyStats : fallback?.keyStats || [],
          tags: unique([...(framework.key_features || []).slice(0, 5), framework.state, ...(fallback?.tags || [])]),
          detailUrl: fallback?.detailUrl || '/centre-of-excellence/best-practice',
          externalUrl,
          featured: fallback?.featured ?? true,
        };
      })
      .filter((item): item is CoeMapLocation => !!item);

    const internationalLocations: CoeMapLocation[] = (internationalResult.data || [])
      .map((program) => {
        const fallback = fallbackInternationalBySlug.get(program.slug);
        const lat = fallback?.coordinates.lat;
        const lng = fallback?.coordinates.lng;

        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          return null;
        }

        const keyStats = unique([
          program.recidivism_rate !== null && program.recidivism_rate !== undefined
            ? `${program.recidivism_rate}% recidivism rate`
            : null,
          program.recidivism_comparison,
          program.evidence_strength ? `Evidence: ${labelFromEnum(program.evidence_strength)}` : null,
          ...(fallback?.keyStats || []),
        ]).slice(0, 3);

        const programTags = (program.program_type || []).map((value) => labelFromEnum(value));

        return {
          id: program.slug,
          name: program.name,
          category: 'international-model',
          type: 'global-insight',
          description: program.approach_summary || program.description || fallback?.description || '',
          coordinates: { lat, lng },
          country: program.country,
          city: program.city_location || fallback?.city,
          state: fallback?.state,
          keyStats,
          tags: unique([...programTags, ...(fallback?.tags || [])]),
          detailUrl: fallback?.detailUrl || '/centre-of-excellence/global-insights',
          externalUrl: program.website_url || fallback?.externalUrl,
          featured: fallback?.featured ?? true,
        };
      })
      .filter((item): item is CoeMapLocation => !!item);

    const researchLocations: CoeMapLocation[] = (researchResult.data || [])
      .map((item) => {
        const normalizedOrganization = normalize(item.organization);
        const fallback =
          fallbackResearchByNormalizedName.get(normalizedOrganization) ||
          fallbackResearchSources.find((source) => {
            const sourceName = normalize(source.name);
            return (
              sourceName.includes(normalizedOrganization) ||
              normalizedOrganization.includes(sourceName)
            );
          });

        if (!fallback) {
          return null;
        }

        return {
          id: item.slug,
          name: item.organization,
          category: 'research-source',
          type: 'research',
          description: item.summary || fallback.description,
          coordinates: fallback.coordinates,
          country: fallback.country,
          city: fallback.city,
          state: fallback.state,
          keyStats:
            item.key_findings && item.key_findings.length > 0
              ? item.key_findings.slice(0, 3)
              : fallback.keyStats,
          tags: unique([item.category, item.jurisdiction, ...(fallback.tags || [])]),
          detailUrl:
            fallback.detailUrl ||
            `/centre-of-excellence/research?jurisdiction=${encodeURIComponent(item.jurisdiction)}`,
          externalUrl: item.external_url || fallback.externalUrl,
          featured: fallback.featured ?? true,
        };
      })
      .filter((location): location is CoeMapLocation => !!location);

    const locations = [
      ...basecampLocations,
      ...internationalLocations,
      ...frameworkLocations,
      ...researchLocations,
    ];

    const stats = {
      total: locations.length,
      byCategory: {
        basecamp: basecampLocations.length,
        internationalModel: internationalLocations.length,
        australianFramework: frameworkLocations.length,
        researchSource: researchLocations.length,
      },
    };

    return NextResponse.json({
      success: true,
      locations,
      stats,
      meta: {
        source: 'database',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('CoE map locations API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch Centre of Excellence map locations';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
