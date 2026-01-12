
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch top Alpha opportunities
        // Since we cannot run the migration in this enviroment to create the VIEW, 
        // we will simulate the "View" logic with a Raw Query or standard Join for now 
        // to ensure the app works without the view being physically present in the mock DB.

        // However, assuming the User runs the migration, we would do:
        // const { data, error } = await supabase.from('view_intervention_alpha').select('*').order('alpha_score', { ascending: false }).limit(20);

        // FALLBACK FOR DEMO: Manual Join Logic in Typescript level to guarantee it works now.

        const { data: interventions, error } = await supabase
            .from('alma_interventions')
            .select(`
                id, name, type, evidence_level, current_funding, consent_level, cultural_authority,
                alma_intervention_evidence (count),
                linked_community_program_id
            `)
            .limit(50);

        if (error) throw error;

        // Mock signal calculation (replicating the SQL View logic)
        const detailedSignals = interventions.map((i: any) => {
            // Evidence Score
            let evScore = 3;
            if (i.evidence_level?.includes('Proven')) evScore = 10;
            if (i.evidence_level?.includes('Effective')) evScore = 8;
            if (i.evidence_level?.includes('Indigenous-led')) evScore = 8;
            if (i.evidence_level?.includes('Promising')) evScore = 6;
            if (i.evidence_level?.includes('Untested')) evScore = 2;

            // Authority Score
            let authScore = 4;
            if (i.consent_level === 'Community Controlled') authScore = 10;
            if (i.cultural_authority) authScore = 8;
            if (i.consent_level === 'Public Knowledge Commons') authScore = 6;

            // Narrative Score (Mocked as 0 for now as we don't have story links in seed yet)
            let narrScore = 0;

            // Alpha
            const alpha = ((evScore * 0.4) + (narrScore * 0.3) + (authScore * 0.3)).toFixed(1);

            // Market Status
            let status = 'Neutral';
            if (parseFloat(alpha) > 6 && (i.current_funding === 'Unfunded' || i.current_funding === 'Pilot/seed')) status = 'Undervalued';
            if (i.current_funding === 'Established') status = 'Fair Value';
            if (i.current_funding === 'At-risk') status = 'Distressed';

            return {
                id: i.id,
                name: i.name,
                type: i.type,
                evidence_level: i.evidence_level,
                current_funding: i.current_funding,
                signal_evidence: evScore,
                signal_narrative_score: narrScore,
                signal_authority: authScore,
                alpha_score: parseFloat(alpha),
                market_status: status
            };
        });

        // Sort by Alpha
        detailedSignals.sort((a, b) => b.alpha_score - a.alpha_score);

        return NextResponse.json({
            opportunities: detailedSignals.slice(0, 20)
        });

    } catch (error) {
        console.error('Error fetching alpha signals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
