import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';

const ALLOWED_STATUS = ['pending', 'active', 'closed', 'archived', 'verified'];
const ALLOWED_SENSITIVITY = ['public', 'restricted'];

interface CasePayload {
  source: {
    system: string;
    record_id?: string;
    url?: string;
    submitted_by?: string;
  };
  case: {
    title: string;
    jurisdiction?: string;
    court?: string;
    matter_type?: string;
    issue_tags?: string[];
    status?: string;
    stage?: string;
    summary?: string;
    outcome?: string;
    orders?: string;
    sensitivity?: string;
  };
}

async function isAuthorized(request: NextRequest) {
  const apiKey = process.env.CLEARINGHOUSE_API_KEY;
  const incomingKey = request.headers.get('x-api-key');
  if (!apiKey || (incomingKey && apiKey && incomingKey === apiKey)) {
    return true;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();
  return userData?.user_role === 'admin';
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: CasePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { source, case: caseData } = payload;

  if (!source?.system || !caseData?.title) {
    return NextResponse.json({ error: 'Missing required fields: source.system, case.title' }, { status: 400 });
  }

  if (caseData.status && !ALLOWED_STATUS.includes(caseData.status)) {
    return NextResponse.json({ error: `Unsupported status. Allowed: ${ALLOWED_STATUS.join(', ')}` }, { status: 400 });
  }

  if (caseData.sensitivity && !ALLOWED_SENSITIVITY.includes(caseData.sensitivity)) {
    return NextResponse.json({ error: `Unsupported sensitivity. Allowed: ${ALLOWED_SENSITIVITY.join(', ')}` }, { status: 400 });
  }

  const supabase = await createAdminClient();
  let existingId: string | null = null;

  // Dedup order: source_record_id -> source_url
  if (source.record_id) {
    const { data } = await supabase
      .from('clearinghouse_cases')
      .select('id')
      .eq('source_system', source.system)
      .eq('source_record_id', source.record_id)
      .maybeSingle();
    existingId = data?.id || null;
  }

  if (!existingId && source.url) {
    const { data } = await supabase
      .from('clearinghouse_cases')
      .select('id')
      .eq('source_system', source.system)
      .eq('source_url', source.url)
      .maybeSingle();
    existingId = data?.id || null;
  }

  const record = {
    title: caseData.title,
    slug: generateSlug(caseData.title),
    jurisdiction: caseData.jurisdiction,
    court: caseData.court,
    matter_type: caseData.matter_type,
    issue_tags: caseData.issue_tags || [],
    status: caseData.status || 'pending',
    stage: caseData.stage,
    summary: caseData.summary,
    outcome: caseData.outcome,
    orders: caseData.orders,
    sensitivity: caseData.sensitivity || 'public',
    source_system: source.system,
    source_record_id: source.record_id,
    source_url: source.url,
    submitted_by: source.submitted_by,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { error } = await supabase
      .from('clearinghouse_cases')
      .update(record)
      .eq('id', existingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, case_id: existingId, created: false, source: source.system });
  }

  const { data: inserted, error } = await supabase
    .from('clearinghouse_cases')
    .insert({ ...record, created_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error || !inserted?.id) {
    return NextResponse.json({ error: error?.message || 'Failed to create case' }, { status: 500 });
  }

  return NextResponse.json({ success: true, case_id: inserted.id, created: true, source: source.system });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const status = searchParams.get('status');
  const jurisdiction = searchParams.get('jurisdiction');
  const issue = searchParams.get('issue');
  const sensitivity = searchParams.get('sensitivity');
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '100', 10)), 1000);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const authorized = await isAuthorized(request);
  const supabase = await createAdminClient();

  let query = supabase
    .from('clearinghouse_cases')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (source) query = query.eq('source_system', source);
  if (status) query = query.eq('status', status);
  if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
  if (issue) query = query.contains('issue_tags', [issue]);

  // Non-authorized users see only public + verified
  if (!authorized) {
    query = query.eq('sensitivity', 'public').eq('status', 'verified');
  } else if (sensitivity) {
    query = query.eq('sensitivity', sensitivity);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'csv') {
    const header = [
      'case_id',
      'title',
      'jurisdiction',
      'court',
      'matter_type',
      'status',
      'stage',
      'sensitivity',
      'issue_tags',
      'source_system',
      'source_record_id',
      'source_url',
      'created_at',
      'updated_at'
    ];
    const rows = (data || []).map(item => ([
      item.id,
      item.title,
      item.jurisdiction,
      item.court,
      item.matter_type,
      item.status,
      item.stage,
      item.sensitivity,
      (item.issue_tags || []).join('|'),
      item.source_system,
      item.source_record_id,
      item.source_url,
      item.created_at,
      item.updated_at
    ].map(v => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')));
    const csv = [header.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clearinghouse-cases${source ? '-' + source : ''}.csv"`
      }
    });
  }

  return NextResponse.json({
    success: true,
    data: data || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
