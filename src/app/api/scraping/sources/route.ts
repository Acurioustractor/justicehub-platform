/**
 * Data Sources Management API
 * 
 * CRUD operations for managing scraping data sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { DataSource, SourceType, UpdateFrequency } from '@/modules/ai-scraper/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    let query = supabase
      .from('data_sources')
      .select('*')
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }
    
    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data: sources, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch data sources', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sources });

  } catch (error) {
    console.error('Data sources API error:', error);
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
    
    // Validate required fields
    const {
      name,
      type,
      base_url,
      api_endpoint,
      scraping_config = {},
      discovery_patterns = [],
      update_frequency = 'weekly'
    } = body;

    if (!name || !type || !base_url) {
      return NextResponse.json(
        { error: 'name, type, and base_url are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(base_url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid base_url format' },
        { status: 400 }
      );
    }

    // Set default scraping configuration
    const defaultConfig = {
      rate_limit_ms: 1000,
      max_concurrent_requests: 1,
      retry_attempts: 3,
      timeout_ms: 30000,
      respect_robots_txt: true,
      user_agent: 'JusticeHub-Bot/1.0',
      ...scraping_config
    };

    // Create data source
    const { data: source, error } = await supabase
      .from('data_sources')
      .insert({
        name,
        type: type as SourceType,
        base_url,
        api_endpoint,
        scraping_config: defaultConfig,
        discovery_patterns,
        update_frequency: update_frequency as UpdateFrequency,
        reliability_score: 0.5,
        active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create data source', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Data source created successfully',
      source
    }, { status: 201 });

  } catch (error) {
    console.error('Create data source error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}