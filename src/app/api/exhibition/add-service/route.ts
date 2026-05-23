import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface Submission {
  name?: string;
  website_url?: string;
  state?: string;
  city?: string;
  abn?: string;
  description?: string;
  proposed_sector?: string;
  contact_email?: string;
  submitter_name?: string;
  acco_certified?: string | boolean;
  cultural_authority?: string | boolean;
}

function trim(v: any) {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function POST(request: NextRequest) {
  let body: Submission;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = trim(body.name);
  const description = trim(body.description);
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

  // Soft duplicate detection — if an ABN was provided and matches an existing org,
  // route as duplicate so the reviewer can decide whether to merge or supplement.
  const abn = trim(body.abn)?.replace(/\s+/g, '') || null;
  const supabase = createServiceClient() as any;
  let matched_organization_id: string | null = null;
  if (abn && /^\d{11}$/.test(abn)) {
    const { data: hit } = await supabase
      .from('organizations')
      .select('id')
      .eq('abn', abn)
      .limit(1)
      .maybeSingle();
    if (hit?.id) matched_organization_id = hit.id;
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

  const { error } = await supabase.from('exhibition_service_submissions').insert({
    name,
    website_url: trim(body.website_url),
    state: trim(body.state)?.toUpperCase() || null,
    city: trim(body.city),
    abn,
    description,
    proposed_sector: trim(body.proposed_sector),
    contact_email: trim(body.contact_email),
    submitter_name: trim(body.submitter_name),
    acco_certified: body.acco_certified === 'true' || body.acco_certified === true,
    cultural_authority: body.cultural_authority === 'true' || body.cultural_authority === true,
    matched_organization_id,
    status: matched_organization_id ? 'duplicate' : 'pending',
    submitted_from_ip: ip,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    ok: true,
    duplicate_of: matched_organization_id,
    message: matched_organization_id
      ? 'We already have this ABN on file — your details have been routed to the reviewer for merge.'
      : 'Submission received. A reviewer will check the details.',
  });
}
