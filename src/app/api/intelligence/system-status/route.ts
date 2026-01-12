
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Fetch Stats in parallel
        const [
            { count: totalServices, error: servicesError },
            { count: activeSources, error: sourcesError },
            { data: confidenceData, error: confidenceError },
            { count: pendingJobs, error: jobsError },
        ] = await Promise.all([
            // Total Services
            supabase.from('scraped_services').select('*', { count: 'exact', head: true }),

            // Active Sources
            supabase.from('data_sources').select('*', { count: 'exact', head: true }).eq('active', true),

            // Average AI Confidence (getting raw data to average manually for now, or use RPC if exists)
            // For simplicity/performance on small dataset, selecting just the score column
            supabase.from('scraped_services').select('confidence_score').not('confidence_score', 'is', null).limit(100),

            // Pending/Running Jobs
            supabase.from('processing_jobs').select('*', { count: 'exact', head: true }).in('status', ['queued', 'running']),
        ]);

        // 2. Fetch Data Sources List
        const { data: sources, error: listError } = await supabase
            .from('data_sources')
            .select('*')
            .order('last_successful_scrape', { ascending: false });

        if (servicesError || sourcesError || listError) {
            console.error('Database Error:', servicesError || sourcesError || listError);
            throw new Error('Failed to fetch system stats');
        }

        // Calculate Average Confidence
        let avgConfidence = 0;
        if (confidenceData && confidenceData.length > 0) {
            const sum = confidenceData.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0);
            avgConfidence = (sum / confidenceData.length) * 100; // as percentage
        }

        return NextResponse.json({
            stats: {
                totalServices: totalServices || 0,
                activeSources: activeSources || 0,
                avgConfidence: Math.round(avgConfidence),
                pendingJobs: pendingJobs || 0
            },
            sources: sources || []
        });

    } catch (error) {
        console.error('Error fetching system status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
