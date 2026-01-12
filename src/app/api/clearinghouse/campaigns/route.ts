import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';

const ALLOWED_STATUS = ['pending', 'active', 'closed', 'verified'];
const ALLOWED_SENSITIVITY = ['public', 'restricted'];

interface CampaignPayload {
  source: {
    system: string;
    record_id?: string;
    url?: string;
    submitted_by?: string;
  };
  campaign: {
    case_id?: string;
    title: string;
    channels?: string[];
    calls_to_action?: string;
    summary?: string;
    issue_tags?: string[];
    status?: string;
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

  let payload: CampaignPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { source, campaign } = payload;

  if (!source?.system || !campaign?.title) {
    return NextResponse.json({ error: 'Missing required fields: source.system, campaign.title' }, { status: 400 });
  }

  if (campaign.status && !ALLOWED_STATUS.includes(campaign.status)) {
    return NextResponse.json({ error: `Unsupported status. Allowed: ${ALLOWED_STATUS.join(', ')}` }, { status: 400 });
  }

  if (campaign.sensitivity && !ALLOWED_SENSITIVITY.includes(campaign.sensitivity)) {
    return NextResponse.json({ error: `Unsupported sensitivity. Allowed: ${ALLOWED_SENSITIVITY.join(', ')}` }, { status: 400 });
  }

  const supabase = await createAdminClient();
  let existingId: string | null = null;

  if (source.record_id) {
    const { data } = await supabase
      .from('clearinghouse_campaigns')
      .select('id')
      .eq('source_system', source.system)
      .eq('source_record_id', source.record_id)
      .maybeSingle();
    existingId = data?.id || null;
  }

  if (!existingId && source.url) {
    const { data } = await supabase
      .from('clearinghouse_campaigns')
      .select('id')
      .eq('source_system', source.system)
      .eq('source_url', source.url)
      .maybeSingle();
    existingId = data?.id || null;
  }

  const record = {
    case_id: campaign.case_id || null,
    title: campaign.title,
    status: campaign.status || 'pending',
    channels: campaign.channels || [],
    calls_to_action: campaign.calls_to_action,
    summary: campaign.summary,
    issue_tags: campaign.issue_tags || [],
    sensitivity: campaign.sensitivity || 'public',
    source_system: source.system,
    source_record_id: source.record_id,
    source_url: source.url,
    submitted_by: source.submitted_by,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { error } = await supabase
      .from('clearinghouse_campaigns')
      .update(record)
      .eq('id', existingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, campaign_id: existingId, created: false, source: source.system });
  }

  const { data: inserted, error } = await supabase
    .from('clearinghouse_campaigns')
    .insert({ ...record, created_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error || !inserted?.id) {
    return NextResponse.json({ error: error?.message || 'Failed to create campaign' }, { status: 500 });
  }

  return NextResponse.json({ success: true, campaign_id: inserted.id, created: true, source: source.system });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const status = searchParams.get('status');
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
    .from('clearinghouse_campaigns')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (source) query = query.eq('source_system', source);
  if (status) query = query.eq('status', status);
  if (issue) query = query.contains('issue_tags', [issue]);

  if (!authorized) {
    query = query.eq('sensitivity', 'public').eq('status', 'verified');
  } else if (sensitivity) {
    query = query.eq('sensitivity', sensitivity);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === 'csv') {
    const header = [
      'campaign_id',
      'case_id',
      'title',
      'status',
      'sensitivity',
      'channels',
      'issue_tags',
      'source_system',
      'source_record_id',
      'source_url',
      'created_at',
      'updated_at'
    ];
    const rows = (data || []).map(item => ([
      item.id,
      item.case_id,
      item.title,
      item.status,
      item.sensitivity,
      (item.channels || []).join('|'),
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
        'Content-Disposition': `attachment; filename="clearinghouse-campaigns${source ? '-' + source : ''}.csv"`
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
