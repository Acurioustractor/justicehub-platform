import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FundingApplication {
  id: string;
  opportunity_id: string;
  organization_id?: string;
  status: string;
  amount_requested?: number;
  amount_awarded?: number;
  submitted_at?: string;
  outcome_at?: string;
  notes?: string;
  internal_match_score?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  opportunity?: {
    name: string;
    funder_name: string;
    deadline: string;
    max_grant_amount: number;
  };
  organization?: {
    name: string;
    slug: string;
  };
}

// GET - List applications with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const organization_id = searchParams.get('organization_id');
    const opportunity_id = searchParams.get('opportunity_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('alma_funding_applications')
      .select(
        `
        *,
        opportunity:alma_funding_opportunities(id, name, funder_name, deadline, max_grant_amount, status),
        organization:organizations(id, name, slug)
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    if (opportunity_id) {
      query = query.eq('opportunity_id', opportunity_id);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in applications GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST - Create a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.opportunity_id) {
      return NextResponse.json(
        { error: 'opportunity_id is required' },
        { status: 400 }
      );
    }

    // Check if application already exists for this org/opportunity combo
    if (body.organization_id) {
      const { data: existing } = await supabase
        .from('alma_funding_applications')
        .select('id')
        .eq('opportunity_id', body.opportunity_id)
        .eq('organization_id', body.organization_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Application already exists for this opportunity and organization' },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('alma_funding_applications')
      .insert([body])
      .select(
        `
        *,
        opportunity:alma_funding_opportunities(id, name, funder_name, deadline),
        organization:organizations(id, name, slug)
      `
      )
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in applications POST:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

// PUT - Update an application
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Auto-set timestamps based on status changes
    if (updates.status === 'submitted' && !updates.submitted_at) {
      updates.submitted_at = new Date().toISOString();
    }
    if (['successful', 'unsuccessful'].includes(updates.status) && !updates.outcome_at) {
      updates.outcome_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('alma_funding_applications')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        opportunity:alma_funding_opportunities(id, name, funder_name, deadline),
        organization:organizations(id, name, slug)
      `
      )
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in applications PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an application
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('alma_funding_applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in applications DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
