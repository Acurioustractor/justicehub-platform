
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // parallelize fetches for performance
        const [
            { data: interventions },
            { data: evidence },
            { data: outcomes },
            { data: contexts },
            { data: intEvidence },
            { data: intOutcomes },
            { data: intContexts }
        ] = await Promise.all([
            supabase.from('alma_interventions').select('id, name, type, category:type, geography, evidence_level, cultural_authority').limit(500),
            supabase.from('alma_evidence').select('id, title, type:evidence_type, publication_date').limit(500),
            supabase.from('alma_outcomes').select('id, name, description, type:outcome_type').limit(500),
            supabase.from('alma_community_contexts').select('id, name, type:context_type, state').limit(200),
            supabase.from('alma_intervention_evidence').select('intervention_id, evidence_id'),
            supabase.from('alma_intervention_outcomes').select('intervention_id, outcome_id'),
            supabase.from('alma_intervention_contexts').select('intervention_id, context_id')
        ]);

        type GraphNode = { id: string; name?: string; title?: string; group: string; val: number;[key: string]: any };
        type GraphLink = { source: string; target: string; type: string };

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];

        // Helper to add node if unique
        const addedNodes = new Set<string>();
        const addNode = (n: any) => {
            if (!addedNodes.has(n.id)) {
                nodes.push(n);
                addedNodes.add(n.id);
            }
        };

        // Process nodes
        interventions?.forEach((i: any) => addNode({ ...i, group: 'intervention', val: 10 }));
        evidence?.forEach((e: any) => addNode({ ...e, name: e.title, group: 'evidence', val: 7 }));
        outcomes?.forEach((o: any) => addNode({ ...o, name: o.name, group: 'outcome', val: 5 }));
        contexts?.forEach((c: any) => addNode({ ...c, group: 'context', val: 8 }));

        // Process links
        intEvidence?.forEach(l => {
            if (addedNodes.has(l.intervention_id) && addedNodes.has(l.evidence_id)) {
                links.push({ source: l.intervention_id, target: l.evidence_id, type: 'supported_by' });
            }
        });

        intOutcomes?.forEach(l => {
            if (addedNodes.has(l.intervention_id) && addedNodes.has(l.outcome_id)) {
                links.push({ source: l.intervention_id, target: l.outcome_id, type: 'achieves' });
            }
        });

        intContexts?.forEach(l => {
            if (addedNodes.has(l.intervention_id) && addedNodes.has(l.context_id)) {
                links.push({ source: l.intervention_id, target: l.context_id, type: 'operates_in' });
            }
        });

        return NextResponse.json({ nodes, links });
    } catch (error) {
        console.error('Error fetching knowledge graph data:', error);
        return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 });
    }
}
