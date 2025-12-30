import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';

interface ClearinghousePayload {
  source: {
    system: string;             // e.g. "alternativefirstresponders.com.au"
    record_id?: string;         // external ID for deduplication
    url?: string;               // deep link to source record
    submitted_by?: string;      // human contact or email for follow-up
  };
  organization: {
    name: string;
    website?: string;
    email?: string;
    phone?: string;
    description?: string;
    state?: string;
    city?: string;
  };
  service: {
    name: string;
    description?: string;
    category?: string;
    website?: string;
    contact_email?: string;
    contact_phone?: string;
    state?: string;
    city?: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const status = searchParams.get('status'); // e.g. pending|verified|unverified
  const format = (searchParams.get('format') || 'json').toLowerCase(); // json | csv
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
    // Allow authenticated admins without API key
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

  if (!source) {
    return NextResponse.json({ error: 'source query param is required' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  let query = supabase
    .from('services')
    .select(`
      id,
      name,
      description,
      slug,
      organization_id,
      website_url,
      contact_email,
      contact_phone,
      location_state,
      location_city,
      verification_status,
      data_source,
      data_source_url,
      metadata,
      created_at,
      updated_at
    `, { count: 'exact' })
    .eq('data_source', source)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('verification_status', status);
  }

  const { data: services, error, count } = await query;

  if (error) {
    console.error('Clearinghouse GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orgIds = Array.from(new Set((services || []).map(s => s.organization_id).filter(Boolean)));
  let orgMap: Record<string, { name: string }> = {};

  if (orgIds.length > 0) {
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    if (orgError) {
      console.error('Clearinghouse org fetch error:', orgError);
    } else {
      orgMap = (orgs || []).reduce((acc, org) => {
        acc[org.id as string] = { name: org.name };
        return acc;
      }, {} as Record<string, { name: string }>);
    }
  }

  const enriched = (services || []).map(service => ({
    ...service,
    organization_name: service.organization_id ? orgMap[service.organization_id]?.name || null : null,
  }));

  if (format === 'csv') {
    const header = [
      'service_id',
      'service_name',
      'organization_id',
      'organization_name',
      'verification_status',
      'data_source',
      'data_source_url',
      'website_url',
      'contact_email',
      'contact_phone',
      'state',
      'city',
      'created_at',
      'updated_at'
    ];

    const rows = enriched.map(item => ([
      item.id,
      item.name,
      item.organization_id,
      item.organization_name,
      item.verification_status,
      item.data_source,
      item.data_source_url,
      item.website_url,
      item.contact_email,
      item.contact_phone,
      item.location_state,
      item.location_city,
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
        'Content-Disposition': `attachment; filename="clearinghouse-${source}.csv"`
      }
    });
  }

  return NextResponse.json({
    success: true,
    data: enriched,
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.CLEARINGHOUSE_API_KEY;
  const incomingKey = request.headers.get('x-api-key');

  // Simple guard so only invited partners can post during the pilot week
  if (apiKey && incomingKey !== apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: ClearinghousePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { source, organization, service } = payload;

  if (!organization?.name || !service?.name || !source?.system) {
    return NextResponse.json({
      error: 'Missing required fields: source.system, organization.name, service.name'
    }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // --- Dedup / upsert Organization ---
  const orgSlug = generateSlug(organization.name);
  let orgId: string | null = null;
  let organization_created = false;

  // 1) Check by slug
  const { data: orgBySlug } = await supabase
    .from('organizations')
    .select('id, slug, website')
    .eq('slug', orgSlug)
    .maybeSingle();

  if (orgBySlug?.id) {
    orgId = orgBySlug.id;
  } else if (organization.website) {
    // 2) Check by website if slug not found
    const { data: orgByWebsite } = await supabase
      .from('organizations')
      .select('id, slug, website')
      .eq('website', organization.website)
      .maybeSingle();

    if (orgByWebsite?.id) {
      orgId = orgByWebsite.id;
    }
  }

  if (!orgId) {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization.name,
        slug: orgSlug,
        description: organization.description,
        website: organization.website,
        email: organization.email,
        phone: organization.phone,
        state: organization.state,
        city: organization.city,
        verification_status: 'pending',
        is_active: true,
        tags: ['clearinghouse'],
        settings: {
          sources: [
            {
              system: source.system,
              record_id: source.record_id || null,
              url: source.url || null,
              submitted_by: source.submitted_by || null,
            },
          ],
        },
      })
      .select('id')
      .single();

    if (orgError || !newOrg?.id) {
      return NextResponse.json({
        error: orgError?.message || 'Failed to create organization',
      }, { status: 500 });
    }

    organization_created = true;
    orgId = newOrg.id;
  }

  // --- Dedup / upsert Service ---
  const serviceSlug = generateSlug(service.name);
  let serviceId: string | null = null;
  let service_created = false;

  // 1) Check by slug scoped to organization
  const { data: serviceBySlug } = await supabase
    .from('services')
    .select('id, slug, organization_id, data_source_url')
    .eq('organization_id', orgId)
    .eq('slug', serviceSlug)
    .maybeSingle();

  if (serviceBySlug?.id) {
    serviceId = serviceBySlug.id;
  } else if (service.website) {
    // 2) Check by website
    const { data: serviceByWebsite } = await supabase
      .from('services')
      .select('id, slug, organization_id, data_source_url')
      .eq('organization_id', orgId)
      .eq('website_url', service.website)
      .maybeSingle();

    if (serviceByWebsite?.id) {
      serviceId = serviceByWebsite.id;
    }
  } else if (source.url) {
    // 3) Check by source URL
    const { data: serviceBySourceUrl } = await supabase
      .from('services')
      .select('id, slug, organization_id, data_source_url')
      .eq('organization_id', orgId)
      .eq('data_source_url', source.url)
      .maybeSingle();

    if (serviceBySourceUrl?.id) {
      serviceId = serviceBySourceUrl.id;
    }
  }

  if (!serviceId) {
    const { data: newService, error: serviceError } = await supabase
      .from('services')
      .insert({
        organization_id: orgId,
        name: service.name,
        slug: serviceSlug,
        description: service.description,
        categories: service.category ? [service.category] : [],
        website_url: service.website,
        contact_email: service.contact_email,
        contact_phone: service.contact_phone,
        location_state: service.state,
        location_city: service.city,
        data_source: source.system,
        data_source_url: source.url || service.website,
        verification_status: 'pending',
        is_active: true,
        project: 'clearinghouse',
        metadata: {
          source_system: source.system,
          source_record_id: source.record_id || null,
          submitted_by: source.submitted_by || null,
        },
      })
      .select('id')
      .single();

    if (serviceError || !newService?.id) {
      return NextResponse.json({
        error: serviceError?.message || 'Failed to create service',
      }, { status: 500 });
    }

    service_created = true;
    serviceId = newService.id;
  }

  return NextResponse.json({
    success: true,
    organization_id: orgId,
    service_id: serviceId,
    organization_created,
    service_created,
    source: source.system,
  });
}
