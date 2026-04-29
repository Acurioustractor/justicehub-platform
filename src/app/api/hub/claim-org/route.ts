import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';

const ALLOWED_ROLES = ['founder', 'ceo', 'manager', 'staff', 'board', 'volunteer', 'member'];
const ABN_REGEX = /^\d{11}$/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'organization';
}

async function uniqueOrgSlug(service: any, name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (suffix < 100) {
    const { data } = await service
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

/**
 * POST /api/hub/claim-org
 *
 * Claim an organization. Creates or links a JusticeHub organization from
 * CivicGraph identity data, then submits a pending organization_claims record.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    organization_id,
    gs_entity_id,
    abn,
    name,
    contact_name,
    contact_email,
    role_at_org,
    message,
  } = body;

  if (!organization_id && !gs_entity_id && !abn) {
    return NextResponse.json(
      { error: 'organization_id, gs_entity_id, or abn is required' },
      { status: 400 }
    );
  }

  const service = createServiceClient() as any;
  const sanitizedAbn = abn ? String(abn).replace(/\s/g, '') : null;
  if (sanitizedAbn && !ABN_REGEX.test(sanitizedAbn)) {
    return NextResponse.json({ error: 'ABN must be 11 digits' }, { status: 400 });
  }

  const { data: profile } = await service
    .from('public_profiles')
    .select('full_name, preferred_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const fallbackName = profile?.preferred_name || profile?.full_name || user.email || 'JusticeHub member';
  const claimName = sanitizeInput(String(contact_name || fallbackName), {
    maxLength: 200,
    allowNewlines: false,
  });
  const claimEmail = sanitizeEmail(String(contact_email || user.email || ''));
  if (!claimEmail) {
    return NextResponse.json({ error: 'Valid contact email is required' }, { status: 400 });
  }

  const sanitizedRole = String(role_at_org || 'member').toLowerCase();
  if (!ALLOWED_ROLES.includes(sanitizedRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const sanitizedMessage = message
    ? sanitizeInput(String(message), { maxLength: 2000, allowNewlines: true })
    : null;

  let org: { id: string; name: string; slug: string | null; abn?: string | null; gs_entity_id?: string | null } | null = null;

  if (organization_id) {
    const { data } = await service
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id')
      .eq('id', organization_id)
      .single();
    org = data;
  }

  if (!org && gs_entity_id) {
    const { data } = await service
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id')
      .eq('gs_entity_id', gs_entity_id)
      .maybeSingle();
    org = data;
  }

  if (!org && sanitizedAbn) {
    const { data } = await service
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id')
      .eq('abn', sanitizedAbn)
      .maybeSingle();
    org = data;
  }

  if (!org && (gs_entity_id || sanitizedAbn)) {
    let entityQuery = service
      .from('gs_entities')
      .select('id, canonical_name, abn, entity_type, state, lga_name, website, description, tags, is_community_controlled')
      .limit(1);

    entityQuery = gs_entity_id
      ? entityQuery.eq('id', gs_entity_id)
      : entityQuery.eq('abn', sanitizedAbn);

    const { data: entities, error: entityError } = await entityQuery;
    if (entityError) {
      return NextResponse.json({ error: entityError.message }, { status: 500 });
    }

    const entity = entities?.[0];
    if (entity) {
      const orgName = sanitizeInput(String(entity.canonical_name || name || 'CivicGraph organisation'), {
        maxLength: 240,
        allowNewlines: false,
      });
      const slug = await uniqueOrgSlug(service, orgName);
      const { data: createdOrg, error: createError } = await service
        .from('organizations')
        .insert({
          name: orgName,
          slug,
          abn: entity.abn || sanitizedAbn,
          gs_entity_id: entity.id,
          type: entity.is_community_controlled ? 'community-controlled' : entity.entity_type || 'community',
          description: entity.description,
          website: entity.website,
          state: entity.state,
          city: entity.lga_name,
          tags: Array.isArray(entity.tags) ? entity.tags : ['civicgraph'],
          verification_status: 'pending',
          is_active: true,
        })
        .select('id, name, slug, abn, gs_entity_id')
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      org = createdOrg;
    }
  }

  if (!org) {
    return NextResponse.json({ error: 'Organization not found in JusticeHub or CivicGraph' }, { status: 404 });
  }

  // Keep the local org bridged to CivicGraph when the claim supplied better identity data.
  const orgUpdate: Record<string, unknown> = {};
  if (!org.abn && sanitizedAbn) orgUpdate.abn = sanitizedAbn;
  if (!org.gs_entity_id && gs_entity_id) orgUpdate.gs_entity_id = gs_entity_id;
  if (Object.keys(orgUpdate).length > 0) {
    await service.from('organizations').update(orgUpdate).eq('id', org.id);
  }

  // Active membership means the claim has already been approved.
  const { data: existingMember } = await service
    .from('organization_members')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (existingMember?.status === 'active') {
    return NextResponse.json({
      error: 'Already a member',
      status: 'active',
      organization: { id: org.id, name: org.name, slug: org.slug },
    }, { status: 409 });
  }

  const { data: existingClaim } = await service
    .from('organization_claims')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (existingClaim) {
    return NextResponse.json({
      success: true,
      claim: existingClaim,
      organization: { id: org.id, name: org.name, slug: org.slug },
      status: existingClaim.status,
    });
  }

  const { data: claim, error: insertError } = await service
    .from('organization_claims')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      contact_name: claimName,
      contact_email: claimEmail,
      role_at_org: sanitizedRole,
      message: sanitizedMessage,
      abn: sanitizedAbn || org.abn || null,
      status: 'pending',
    })
    .select('id, status')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await service
    .from('profiles')
    .update({ primary_organization_id: org.id })
    .eq('id', user.id);

  await service.from('member_actions').insert({
    user_id: user.id,
    action_type: 'org_claim',
    metadata: {
      organization_id: org.id,
      organization_name: org.name,
      gs_entity_id: gs_entity_id || org.gs_entity_id || null,
      abn: sanitizedAbn || org.abn || null,
      source: gs_entity_id ? 'civicgraph' : 'justicehub',
    },
  });

  return NextResponse.json({
    success: true,
    organization: { id: org.id, name: org.name, slug: org.slug },
    claim,
    status: claim.status,
  });
}
