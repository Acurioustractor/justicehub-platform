import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch Stats from ALMA tables in parallel
        const [
            { count: totalInterventions },
            { count: scrapedLinks },
            { count: pendingLinks },
            { data: recentScrapes },
        ] = await Promise.all([
            // Total interventions discovered
            supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),

            // Scraped links (completed)
            supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'scraped'),

            // Pending links (queue depth)
            supabase.from('alma_discovered_links').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

            // Recent scrape activity (last 24h) for source list
            supabase
                .from('alma_discovered_links')
                .select('id, url, status, scraped_at, predicted_type, priority')
                .eq('status', 'scraped')
                .order('scraped_at', { ascending: false })
                .limit(50),
        ]);

        // Calculate success rate from recent scrapes
        const { count: errorCount } = await supabase
            .from('alma_discovered_links')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'error');

        const totalProcessed = (scrapedLinks || 0) + (errorCount || 0);
        const successRate = totalProcessed > 0 ? Math.round(((scrapedLinks || 0) / totalProcessed) * 100) : 0;

        // Format sources from recent scrapes
        const sources = (recentScrapes || []).map((scrape) => {
            // Extract domain from URL
            let domain = 'Unknown';
            try {
                domain = new URL(scrape.url).hostname.replace('www.', '');
            } catch {}

            return {
                id: scrape.id,
                name: domain,
                type: scrape.predicted_type || 'website',
                reliability_score: scrape.priority ? scrape.priority / 15 : 0.5, // Normalize priority to 0-1
                last_successful_scrape: scrape.scraped_at,
                active: true,
            };
        });

        // Dedupe sources by domain
        const uniqueSources = sources.reduce((acc: any[], source: any) => {
            if (!acc.find((s) => s.name === source.name)) {
                acc.push(source);
            }
            return acc;
        }, []);

        return NextResponse.json({
            stats: {
                totalServices: totalInterventions || 0,
                activeSources: scrapedLinks || 0,
                avgConfidence: successRate,
                pendingJobs: pendingLinks || 0,
            },
            sources: uniqueSources.slice(0, 30), // Top 30 unique sources
        });
    } catch (error) {
        console.error('Error fetching system status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
