import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface DocumentPayload {
  source: {
    system: string;
    record_id?: string;
    url?: string;
    submitted_by?: string;
  };
  document: {
    title: string;
    description?: string;
    url?: string;          // PDF or canonical link
    content?: string;      // Raw markdown / text (preferred for summaries)
    tags?: string[];
    format?: string;       // e.g., markdown | pdf | docx | html
    summary?: string;
  };
}

const ALLOWED_FORMATS = ['markdown', 'md', 'pdf', 'docx', 'html', 'txt'];
const MAX_CONTENT_BYTES = 200 * 1024; // 200KB cap for raw content

export async function POST(request: NextRequest) {
  const apiKey = process.env.CLEARINGHOUSE_API_KEY;
  const incomingKey = request.headers.get('x-api-key');

  if (apiKey && incomingKey !== apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: DocumentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { source, document } = payload;

  if (!source?.system || !document?.title) {
    return NextResponse.json({
      error: 'Missing required fields: source.system, document.title'
    }, { status: 400 });
  }

  if (!document.url && !document.content) {
    return NextResponse.json({
      error: 'Provide either document.url (for PDF) or document.content (for markdown/text)'
    }, { status: 400 });
  }

  if (document.content) {
    const size = Buffer.byteLength(document.content, 'utf8');
    if (size > MAX_CONTENT_BYTES) {
      return NextResponse.json({
        error: `document.content too large (${size} bytes). Limit ${MAX_CONTENT_BYTES} bytes.`
      }, { status: 400 });
    }
  }

  if (document.format && !ALLOWED_FORMATS.includes(document.format.toLowerCase())) {
    return NextResponse.json({
      error: `Unsupported format. Allowed: ${ALLOWED_FORMATS.join(', ')}`
    }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Dedup: first by document.url, then by (source_system + source_record_id), then by source_url
  let existingId: string | null = null;

  if (document.url) {
    const { data: existingByUrl } = await supabase
      .from('clearinghouse_documents')
      .select('id')
      .eq('url', document.url)
      .maybeSingle();
    existingId = existingByUrl?.id || null;
  }

  if (!existingId && source.record_id) {
    const { data: existingBySourceId } = await supabase
      .from('clearinghouse_documents')
      .select('id')
      .eq('source_system', source.system)
      .eq('source_record_id', source.record_id)
      .maybeSingle();
    existingId = existingBySourceId?.id || null;
  }

  if (!existingId && source.url) {
    const { data: existingBySourceUrl } = await supabase
      .from('clearinghouse_documents')
      .select('id')
      .eq('source_system', source.system)
      .eq('source_url', source.url)
      .maybeSingle();
    existingId = existingBySourceUrl?.id || null;
  }

  if (existingId) {
    const { error: updateError } = await supabase
      .from('clearinghouse_documents')
      .update({
        title: document.title,
        description: document.description,
        url: document.url,
        content: document.content,
        tags: document.tags || [],
        format: document.format || 'markdown',
        summary: document.summary,
        submitted_by: source.submitted_by,
        source_system: source.system,
        source_record_id: source.record_id,
        source_url: source.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document_id: existingId,
      created: false,
      source: source.system
    });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('clearinghouse_documents')
    .insert({
      title: document.title,
      description: document.description,
      url: document.url,
      content: document.content,
      tags: document.tags || [],
      format: document.format || (document.url ? 'pdf' : 'markdown'),
      summary: document.summary,
      source_system: source.system,
      source_record_id: source.record_id,
      source_url: source.url || document.url,
      submitted_by: source.submitted_by,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    return NextResponse.json({ error: insertError?.message || 'Failed to create document' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    document_id: inserted.id,
    created: true,
    source: source.system
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const status = searchParams.get('status');
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '100', 10)), 1000);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const apiKey = process.env.CLEARINGHOUSE_API_KEY;
  const incomingKey = request.headers.get('x-api-key');

  let authorized = false;
  if (!apiKey || (incomingKey && apiKey && incomingKey === apiKey)) {
    authorized = true;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_role')
        .eq('id', user.id)
        .single();
      if (userData?.user_role === 'admin') {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  let query = supabase
    .from('clearinghouse_documents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (source) query = query.eq('source_system', source);
  if (status) query = query.eq('status', status);
  if (tag) query = query.contains('tags', [tag]);
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Clearinghouse documents GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'csv') {
    const header = [
      'document_id',
      'title',
      'description',
      'summary',
      'source_system',
      'source_record_id',
      'source_url',
      'url',
      'format',
      'tags',
      'status',
      'submitted_by',
      'created_at',
      'updated_at'
    ];

    const rows = (data || []).map(item => ([
      item.id,
      item.title,
      item.description,
      item.summary,
      item.source_system,
      item.source_record_id,
      item.source_url,
      item.url,
      item.format,
      (item.tags || []).join('|'),
      item.status,
      item.submitted_by,
      item.created_at,
      item.updated_at
    ].map(value => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')));

    const csv = [header.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clearinghouse-documents${source ? '-' + source : ''}.csv"`
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
