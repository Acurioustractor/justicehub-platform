import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Evidence {
  id: string;
  title: string;
  evidence_type: string;
  methodology?: string;
  sample_size?: number;
  timeframe?: string;
  findings: string;
  effect_size?: string;
  limitations?: string;
  cultural_safety?: string;
  author?: string;
  organization?: string;
  publication_date?: string;
  doi?: string;
  source_url?: string;
  source_document_url?: string;
  consent_level: string;
  contributors?: string[];
  evidence_quality?: string;
  jurisdictions?: string[];
  topics?: string[];
  created_at: string;
  updated_at: string;
}

// GET - List evidence with filters and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const evidence_type = searchParams.get('evidence_type');
    const effect_size = searchParams.get('effect_size');
    const jurisdiction = searchParams.get('jurisdiction');
    const topic = searchParams.get('topic');
    const quality = searchParams.get('quality');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';

    let query = supabase
      .from('alma_evidence')
      .select('*', { count: 'exact' });

    // Apply filters
    if (evidence_type) {
      query = query.eq('evidence_type', evidence_type);
    }

    if (effect_size) {
      query = query.eq('effect_size', effect_size);
    }

    if (jurisdiction) {
      query = query.contains('metadata->>jurisdictions', [jurisdiction]);
    }

    if (topic) {
      query = query.contains('metadata->>topics', [topic]);
    }

    if (quality) {
      query = query.eq('metadata->>evidence_quality', quality);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,findings.ilike.%${search}%,author.ilike.%${search}%,organization.ilike.%${search}%`
      );
    }

    // Apply sorting
    const ascending = sort_order === 'asc';
    query = query.order(sort_by, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching evidence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in evidence GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}

// POST - Create new evidence record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.evidence_type || !body.findings) {
      return NextResponse.json(
        { error: 'title, evidence_type, and findings are required' },
        { status: 400 }
      );
    }

    // Set default consent level
    if (!body.consent_level) {
      body.consent_level = 'Public Knowledge Commons';
    }

    // Extract additional metadata
    const metadata = body.metadata || {};
    if (body.jurisdictions) {
      metadata.jurisdictions = body.jurisdictions;
      delete body.jurisdictions;
    }
    if (body.topics) {
      metadata.topics = body.topics;
      delete body.topics;
    }
    if (body.evidence_quality) {
      metadata.evidence_quality = body.evidence_quality;
      delete body.evidence_quality;
    }
    if (body.scrape_source) {
      metadata.scrape_source = body.scrape_source;
      delete body.scrape_source;
    }
    if (body.scraped_at) {
      metadata.scraped_at = body.scraped_at;
      delete body.scraped_at;
    }
    body.metadata = metadata;

    const { data, error } = await supabase
      .from('alma_evidence')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating evidence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in evidence POST:', error);
    return NextResponse.json(
      { error: 'Failed to create evidence' },
      { status: 500 }
    );
  }
}

// PUT - Update evidence record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('alma_evidence')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating evidence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in evidence PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update evidence' },
      { status: 500 }
    );
  }
}

// DELETE - Remove evidence record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from('alma_evidence').delete().eq('id', id);

    if (error) {
      console.error('Error deleting evidence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in evidence DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to delete evidence' },
      { status: 500 }
    );
  }
}
