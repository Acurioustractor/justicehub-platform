import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FundingOpportunity {
  id: string;
  name: string;
  description?: string;
  funder_name: string;
  source_type: 'government' | 'philanthropy' | 'corporate' | 'community';
  category?: string;
  total_pool_amount?: number;
  min_grant_amount?: number;
  max_grant_amount?: number;
  funding_duration?: string;
  opens_at?: string;
  deadline?: string;
  decision_date?: string;
  status: 'upcoming' | 'open' | 'closing_soon' | 'closed' | 'recurring' | 'archived';
  jurisdictions?: string[];
  regions?: string[];
  is_national?: boolean;
  eligibility_criteria?: Record<string, unknown>;
  eligible_org_types?: string[];
  requires_deductible_gift_recipient?: boolean;
  requires_abn?: boolean;
  focus_areas?: string[];
  keywords?: string[];
  source_url?: string;
  application_url?: string;
  guidelines_url?: string;
  source_id?: string;
  scraped_at?: string;
  scrape_source?: string;
  relevance_score?: number;
  created_at: string;
  updated_at: string;
}

// GET - List funding opportunities with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get('status');
    const source_type = searchParams.get('source_type');
    const category = searchParams.get('category');
    const jurisdiction = searchParams.get('jurisdiction');
    const min_amount = searchParams.get('min_amount');
    const max_amount = searchParams.get('max_amount');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort_by = searchParams.get('sort_by') || 'deadline';
    const sort_order = searchParams.get('sort_order') || 'asc';

    let query = supabase
      .from('alma_funding_opportunities')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      if (status === 'active') {
        query = query.in('status', ['open', 'closing_soon']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (source_type) {
      query = query.eq('source_type', source_type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (jurisdiction) {
      query = query.contains('jurisdictions', [jurisdiction]);
    }

    if (min_amount) {
      query = query.gte('max_grant_amount', parseInt(min_amount, 10));
    }

    if (max_amount) {
      query = query.lte('min_grant_amount', parseInt(max_amount, 10));
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,funder_name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Apply sorting
    const ascending = sort_order === 'asc';
    query = query.order(sort_by, { ascending, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching funding opportunities:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate days until deadline for each opportunity
    const enrichedData = data?.map((opp) => ({
      ...opp,
      days_until_deadline: opp.deadline
        ? Math.ceil(
            (new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    return NextResponse.json({
      data: enrichedData,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in funding opportunities GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding opportunities' },
      { status: 500 }
    );
  }
}

// POST - Create a new funding opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.funder_name || !body.source_type) {
      return NextResponse.json(
        { error: 'name, funder_name, and source_type are required' },
        { status: 400 }
      );
    }

    // Insert the opportunity
    const { data, error } = await supabase
      .from('alma_funding_opportunities')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating funding opportunity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate relevance score
    await supabase.rpc('calculate_funding_relevance', { opportunity_id: data.id });

    // Refetch with updated score
    const { data: updated } = await supabase
      .from('alma_funding_opportunities')
      .select('*')
      .eq('id', data.id)
      .single();

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error('Error in funding opportunities POST:', error);
    return NextResponse.json(
      { error: 'Failed to create funding opportunity' },
      { status: 500 }
    );
  }
}

// PUT - Update a funding opportunity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('alma_funding_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating funding opportunity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in funding opportunities PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update funding opportunity' },
      { status: 500 }
    );
  }
}

// DELETE - Archive a funding opportunity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Soft delete by setting status to archived
    const { error } = await supabase
      .from('alma_funding_opportunities')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      console.error('Error archiving funding opportunity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in funding opportunities DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to archive funding opportunity' },
      { status: 500 }
    );
  }
}
