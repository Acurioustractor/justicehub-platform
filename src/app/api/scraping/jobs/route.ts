/**
 * AI Scraping Jobs API
 * 
 * Manages scraping job creation, monitoring, and control
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { validateAPIKeys } from '@/lib/api/config';
import { GovernmentScraper } from '@/modules/ai-scraper/sources/GovernmentScraper';
import type { DataSource, ProcessingJob, JobPriority, JobType } from '@/modules/ai-scraper/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('processing_jobs')
      .select(`
        *,
        data_sources (
          id,
          name,
          type,
          base_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    
    if (type) {
      query = query.eq('type', type);
    }

    const { data: jobs, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error.message },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const { data: stats } = await supabase
      .from('processing_jobs')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const summary = stats?.reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      jobs,
      summary,
      pagination: {
        limit,
        offset,
        total: jobs?.length || 0
      }
    });

  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    
    // Validate request body
    const {
      type = 'extraction',
      priority = 'medium',
      data_source_id,
      configuration = {},
      source_urls = []
    } = body;

    if (!data_source_id) {
      return NextResponse.json(
        { error: 'data_source_id is required' },
        { status: 400 }
      );
    }

    // Validate API configuration
    const validation = validateAPIKeys();
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'API configuration incomplete',
          missing: validation.missing,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Get data source configuration
    const { data: dataSource, error: sourceError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', data_source_id)
      .eq('active', true)
      .single();

    if (sourceError || !dataSource) {
      return NextResponse.json(
        { error: 'Data source not found or inactive' },
        { status: 404 }
      );
    }

    // Create processing job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        type: type as JobType,
        status: 'queued',
        priority: priority as JobPriority,
        data_source_id,
        source_urls,
        configuration: {
          ...configuration,
          ai_models: ['gpt-4', 'claude-3'],
          quality_thresholds: {
            minimum_confidence_score: 0.6,
            require_contact_info: true,
            minimum_service_descriptions: 1
          }
        },
        created_by: 'api_user' // In production, get from auth
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError.message },
        { status: 500 }
      );
    }

    // Start job processing asynchronously
    processJobAsync(job, dataSource);

    return NextResponse.json({
      message: 'Job created successfully',
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        created_at: job.created_at,
        data_source: {
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process job asynchronously without blocking the API response
 */
async function processJobAsync(job: ProcessingJob, dataSource: DataSource) {
  try {
    let scraper;
    
    // Create appropriate scraper based on data source type
    switch (dataSource.type) {
      case 'government_database':
        scraper = new GovernmentScraper(dataSource);
        break;
      default:
        console.error(`Unsupported data source type: ${dataSource.type}`);
        return;
    }

    // Execute scraping
    await scraper.scrape();
    
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    
    // Update job status to failed
    const supabase = createSupabaseClient();
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: (error as Error).message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}