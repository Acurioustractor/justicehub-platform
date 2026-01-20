
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Parallelize all data fetching
        const [
            // 1. Core Entity Counts
            { count: interventionCount },
            { count: evidenceCount },
            { count: outcomeCount },
            { count: contextCount },

            // 2. Scraper Stats
            { count: activeSources },
            { count: totalScrapedServices },

            // 3. Quality / Governance Metrics (Aggregate queries)
            // We use raw queries or simplified selects for distribution
            { data: evidenceLevels },
            { data: consentLevels },

            // 4. Gap Analysis
            // Find interventions with NO evidence linked
            // This is tricky in Supabase basic client. We might need a raw query or a "not.in" approach.
            // For now, let's just get totals of the relationship table to approximate "coverage".
            { count: linkedEvidenceCount }
        ] = await Promise.all([
            supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
            supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
            supabase.from('alma_outcomes').select('*', { count: 'exact', head: true }),
            supabase.from('alma_community_contexts').select('*', { count: 'exact', head: true }),

            // Use ALMA source registry for active sources
            supabase.from('alma_source_registry').select('*', { count: 'exact', head: true }).eq('active', true),
            // Use ALMA discovered links (scraped status) for services count
            supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'scraped'),

            // Get distribution of evidence levels (limit to 1000 for perfs if needed, but grouping is better done in SQL or RPC. 
            // Here we fetch minimal data to calc distributions in JS for simplicity without new RPCs)
            supabase.from('alma_interventions').select('evidence_level'),
            supabase.from('alma_interventions').select('consent_level'),

            supabase.from('alma_intervention_evidence').select('*', { count: 'exact', head: true })
        ]);

        // Process Distributions
        const getDistrib = (data: any[], key: string) => {
            const counts: Record<string, number> = {};
            data?.forEach(item => {
                const val = item[key] || 'Unknown';
                counts[val] = (counts[val] || 0) + 1;
            });
            return counts;
        };

        const evidenceDistrib = getDistrib(evidenceLevels || [], 'evidence_level');
        const consentDistrib = getDistrib(consentLevels || [], 'consent_level');

        // Gap Analysis Calculation
        // Crude approximation: Interventions - Unique Linked Interventions. 
        // Accurate way requires specific query. Let's send the "Ratio" for now.
        const coverageRatio = interventionCount && interventionCount > 0
            ? Math.round((linkedEvidenceCount || 0) / interventionCount * 100)
            : 0;

        return NextResponse.json({
            cortex: {
                interventions: interventionCount || 0,
                evidence: evidenceCount || 0,
                outcomes: outcomeCount || 0,
                contexts: contextCount || 0,
                evidenceDistribution: evidenceDistrib
            },
            senses: {
                activeSources: activeSources || 0,
                scrapedServices: totalScrapedServices || 0,
            },
            conscience: {
                consentDistribution: consentDistrib
            },
            health: {
                coverageRatio: coverageRatio // % of avg evidence linkages per intervention (heuristic)
            }
        });

    } catch (error) {
        console.error('Error fetching global stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
