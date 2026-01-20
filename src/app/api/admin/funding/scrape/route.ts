import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Funding source configurations
const FUNDING_SOURCES = {
  // Government Grants
  'grants.gov.au': {
    name: 'GrantConnect',
    type: 'government',
    url: 'https://www.grants.gov.au/Go/Show?GoUuid=Search',
    selectors: {
      list: '.grant-listing',
      title: '.grant-title',
      deadline: '.closing-date',
      amount: '.funding-amount',
    },
    schedule: 'daily',
  },
  'business.gov.au': {
    name: 'Business.gov.au',
    type: 'government',
    url: 'https://business.gov.au/grants-and-programs',
    schedule: 'daily',
  },

  // Philanthropy
  'paulramsayfoundation': {
    name: 'Paul Ramsay Foundation',
    type: 'philanthropy',
    url: 'https://paulramsayfoundation.org.au/grants/',
    schedule: 'weekly',
  },
  'minderoo': {
    name: 'Minderoo Foundation',
    type: 'philanthropy',
    url: 'https://www.minderoo.org/funding-opportunities/',
    schedule: 'weekly',
  },
  'ianpotter': {
    name: 'Ian Potter Foundation',
    type: 'philanthropy',
    url: 'https://www.ianpotter.org.au/what-we-support/',
    schedule: 'weekly',
  },
  'reichstein': {
    name: 'Reichstein Foundation',
    type: 'philanthropy',
    url: 'https://www.reichstein.org.au/',
    schedule: 'weekly',
  },
  'sidneymyer': {
    name: 'Sidney Myer Fund',
    type: 'philanthropy',
    url: 'https://myerfoundation.org.au/',
    schedule: 'weekly',
  },

  // State Government Portals
  'qld.gov.au': {
    name: 'Queensland Government Grants',
    type: 'government',
    url: 'https://www.qld.gov.au/community/getting-support-health-social-issue/funding-grants',
    jurisdictions: ['QLD'],
    schedule: 'weekly',
  },
  'nsw.gov.au': {
    name: 'NSW Government Grants',
    type: 'government',
    url: 'https://www.nsw.gov.au/grants-and-funding',
    jurisdictions: ['NSW'],
    schedule: 'weekly',
  },
  'nt.gov.au': {
    name: 'NT Government Grants',
    type: 'government',
    url: 'https://nt.gov.au/industry/start-run-and-grow-a-business/grants-and-funding',
    jurisdictions: ['NT'],
    schedule: 'weekly',
  },
} as const;

// Keywords to identify youth justice relevant grants
const RELEVANCE_KEYWORDS = [
  'youth',
  'young people',
  'juvenile',
  'justice',
  'rehabilitation',
  'indigenous',
  'first nations',
  'aboriginal',
  'torres strait',
  'community',
  'diversion',
  'early intervention',
  'crime prevention',
  'recidivism',
  'mental health',
  'family services',
  'child protection',
  'education',
  'employment',
  'housing',
  'disadvantaged',
];

// POST - Trigger a funding scrape
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources, mode = 'incremental' } = body;

    // Determine which sources to scrape
    const sourcesToScrape = sources
      ? sources.filter((s: string) => s in FUNDING_SOURCES)
      : Object.keys(FUNDING_SOURCES);

    if (sourcesToScrape.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources specified' },
        { status: 400 }
      );
    }

    // Create a job record for tracking
    const { data: job, error: jobError } = await supabase
      .from('alma_ingestion_jobs')
      .insert([
        {
          job_type: 'funding_scrape',
          status: 'pending',
          config: {
            sources: sourcesToScrape,
            mode,
            relevance_keywords: RELEVANCE_KEYWORDS,
          },
        },
      ])
      .select()
      .single();

    if (jobError) {
      console.error('Error creating scrape job:', jobError);
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    // In a production environment, this would trigger an async worker
    // For now, we'll return the job ID for status checking
    // The actual scraping would be done by a background worker or GitHub Action

    return NextResponse.json({
      message: 'Funding scrape job queued',
      job_id: job.id,
      sources: sourcesToScrape,
      mode,
      estimated_time: `${sourcesToScrape.length * 2} minutes`,
    });
  } catch (error) {
    console.error('Error triggering funding scrape:', error);
    return NextResponse.json(
      { error: 'Failed to trigger funding scrape' },
      { status: 500 }
    );
  }
}

// GET - Get scrape status and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const job_id = searchParams.get('job_id');

    if (job_id) {
      // Get specific job status
      const { data: job, error } = await supabase
        .from('alma_ingestion_jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json(job);
    }

    // Get overall scrape stats
    const [
      { count: totalOpportunities },
      { count: activeOpportunities },
      { data: recentJobs },
      { data: bySource },
    ] = await Promise.all([
      supabase.from('alma_funding_opportunities').select('*', { count: 'exact', head: true }),
      supabase
        .from('alma_funding_opportunities')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'closing_soon']),
      supabase
        .from('alma_ingestion_jobs')
        .select('*')
        .eq('job_type', 'funding_scrape')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('alma_funding_opportunities')
        .select('scrape_source'),
    ]);

    // Count by source
    const sourceCounts: Record<string, number> = {};
    bySource?.forEach((item) => {
      const source = item.scrape_source || 'manual';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    return NextResponse.json({
      stats: {
        total_opportunities: totalOpportunities || 0,
        active_opportunities: activeOpportunities || 0,
        by_source: sourceCounts,
      },
      available_sources: Object.entries(FUNDING_SOURCES).map(([key, source]) => ({
        id: key,
        name: source.name,
        type: source.type,
        schedule: source.schedule,
      })),
      recent_jobs: recentJobs || [],
    });
  } catch (error) {
    console.error('Error fetching scrape status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrape status' },
      { status: 500 }
    );
  }
}
