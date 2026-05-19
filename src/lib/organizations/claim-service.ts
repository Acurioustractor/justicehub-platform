import { sanitizeEmail, sanitizeInput } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';
import { createServiceClient } from '@/lib/supabase/service-lite';

const ALLOWED_ROLES = ['founder', 'ceo', 'manager', 'staff', 'board', 'volunteer', 'member'];
const ABN_REGEX = /^\d{11}$/;

export const CONSENT_LEVELS = [
  'Strictly Private',
  'Public Knowledge Commons',
  'Community Controlled',
] as const;
export type ConsentLevel = (typeof CONSENT_LEVELS)[number];

export const PERMITTED_USES = [
  'display_on_map',
  'link_to_website',
  'link_to_stories',
  'included_in_funder_packs',
  'contactable_by_judges',
  'contactable_by_other_orgs',
] as const;
export type PermittedUse = (typeof PERMITTED_USES)[number];

export const STORY_INTERESTS = ['yes', 'maybe', 'no'] as const;
export type StoryInterest = (typeof STORY_INTERESTS)[number];

const REVERSIBILITY_WINDOW_DAYS = 14;

export class OrganizationClaimError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'OrganizationClaimError';
    this.status = status;
  }
}

export type OrganizationClaimInput = {
  organization_id?: string | null;
  gs_entity_id?: string | null;
  abn?: string | null;
  name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  role_at_org?: string | null;
  message?: string | null;
  consent_level?: ConsentLevel | null;
  permitted_uses?: PermittedUse[] | null;
  story_interest?: StoryInterest | null;
};

export type OrganizationClaimUser = {
  id: string;
  email?: string | null;
};

type ClaimedOrganization = {
  id: string;
  name: string;
  slug: string | null;
  abn?: string | null;
  gs_entity_id?: string | null;
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://justicehub.com.au'
  ).replace(/\/$/, '');
}

function buildClaimConfirmationEmail({
  claimName,
  organization,
  claimId,
}: {
  claimName: string;
  organization: ClaimedOrganization;
  claimId: string;
}) {
  const firstName = claimName.split(/\s+/)[0] || claimName;
  const siteUrl = getSiteUrl();
  const orgProfileUrl = organization.slug
    ? `${siteUrl}/organizations/${organization.slug}`
    : `${siteUrl}/organizations`;
  const hubUrl = `${siteUrl}/hub`;

  return {
    subject: `We received your JusticeHub claim for ${organization.name}`,
    preheader: 'Your organization claim is pending review. Here is what happens next.',
    body: `Hi ${firstName},

We received your claim for ${organization.name}. The claim is now pending review.

What happens next:

1. JusticeHub checks the claim details against the organization record, ABN/CivicGraph identity where available, and your role or connection to the organization.

2. If we need anything else, we will reply to this email. Useful evidence can include a work email, website/team listing, ABN/ACNC details, or a short note from an existing organization contact.

3. Once approved, your organization workspace opens. That gives you a place to update the public profile, manage programs and services, add people and stories, review funding readiness, and use GrantScope to find grants, funders, government pathways, and likely partners.

You can check your claim status from your hub:
${hubUrl}

You can keep reviewing the public organization record here:
${orgProfileUrl}

Claim reference: ${claimId}

JusticeHub`,
  };
}

async function sendClaimConfirmationEmail({
  claimEmail,
  claimName,
  organization,
  claimId,
}: {
  claimEmail: string;
  claimName: string;
  organization: ClaimedOrganization;
  claimId: string;
}) {
  const email = buildClaimConfirmationEmail({ claimName, organization, claimId });
  const result = await sendEmail({
    to: claimEmail,
    name: claimName,
    subject: email.subject,
    body: email.body,
    preheader: email.preheader,
    tags: ['justicehub_org_claim', 'org_claim_pending'],
    source: 'JusticeHub organization claim',
  });

  return Boolean(result);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'organization'
  );
}

async function uniqueOrgSlug(service: any, name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (suffix < 100) {
    const { data } = await service.from('organizations').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

async function resolveOrCreateOrganization(
  service: any,
  input: OrganizationClaimInput,
  sanitizedAbn: string | null,
): Promise<ClaimedOrganization | null> {
  let org: ClaimedOrganization | null = null;

  if (input.organization_id) {
    const { data } = await service
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id')
      .eq('id', input.organization_id)
      .maybeSingle();
    org = data;
  }

  if (!org && input.gs_entity_id) {
    const { data } = await service
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id')
      .eq('gs_entity_id', input.gs_entity_id)
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

  if (!org && (input.gs_entity_id || sanitizedAbn)) {
    let entityQuery = service
      .from('gs_entities')
      .select(
        'id, canonical_name, abn, entity_type, state, lga_name, website, description, tags, is_community_controlled',
      )
      .limit(1);

    entityQuery = input.gs_entity_id
      ? entityQuery.eq('id', input.gs_entity_id)
      : entityQuery.eq('abn', sanitizedAbn);

    const { data: entities, error } = await entityQuery;
    if (error) throw new OrganizationClaimError(error.message, 500);

    const entity = entities?.[0];
    if (entity) {
      const orgName = sanitizeInput(String(entity.canonical_name || input.name || 'CivicGraph organisation'), {
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

      if (createError) throw new OrganizationClaimError(createError.message, 500);
      org = createdOrg;
    }
  }

  return org;
}

export async function submitOrganizationClaim({
  user,
  input,
}: {
  user: OrganizationClaimUser;
  input: OrganizationClaimInput;
}) {
  if (!input.organization_id && !input.gs_entity_id && !input.abn) {
    throw new OrganizationClaimError('organization_id, gs_entity_id, or abn is required', 400);
  }

  const sanitizedAbn = input.abn ? String(input.abn).replace(/\s/g, '') : null;
  if (sanitizedAbn && !ABN_REGEX.test(sanitizedAbn)) {
    throw new OrganizationClaimError('ABN must be 11 digits', 400);
  }

  const service = createServiceClient() as any;

  const { data: profile } = await service
    .from('public_profiles')
    .select('full_name, preferred_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const fallbackName = profile?.preferred_name || profile?.full_name || user.email || 'JusticeHub member';
  const claimName = sanitizeInput(String(input.contact_name || fallbackName), {
    maxLength: 200,
    allowNewlines: false,
  });
  const claimEmail = sanitizeEmail(String(input.contact_email || user.email || ''));
  if (!claimEmail) throw new OrganizationClaimError('Valid contact email is required', 400);

  const sanitizedRole = String(input.role_at_org || 'member').toLowerCase();
  if (!ALLOWED_ROLES.includes(sanitizedRole)) {
    throw new OrganizationClaimError('Invalid role', 400);
  }

  const sanitizedMessage = input.message
    ? sanitizeInput(String(input.message), { maxLength: 2000, allowNewlines: true })
    : null;

  // Consent + permitted-uses + story-interest. All optional — orgs that
  // claim without setting them are recorded as null, and the admin can
  // follow up. When set, validate strictly: only canonical enum values.
  const consentLevel: ConsentLevel | null =
    input.consent_level && (CONSENT_LEVELS as readonly string[]).includes(input.consent_level)
      ? (input.consent_level as ConsentLevel)
      : null;
  const permittedUses: PermittedUse[] = Array.isArray(input.permitted_uses)
    ? input.permitted_uses.filter((u): u is PermittedUse =>
        (PERMITTED_USES as readonly string[]).includes(u)
      )
    : [];
  const storyInterest: StoryInterest | null =
    input.story_interest && (STORY_INTERESTS as readonly string[]).includes(input.story_interest)
      ? (input.story_interest as StoryInterest)
      : null;
  const reversibilityUntil = new Date(
    Date.now() + REVERSIBILITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const org = await resolveOrCreateOrganization(service, input, sanitizedAbn);
  if (!org) {
    throw new OrganizationClaimError('Organization not found in JusticeHub or CivicGraph', 404);
  }

  const orgUpdate: Record<string, unknown> = {};
  if (!org.abn && sanitizedAbn) orgUpdate.abn = sanitizedAbn;
  if (!org.gs_entity_id && input.gs_entity_id) orgUpdate.gs_entity_id = input.gs_entity_id;
  if (Object.keys(orgUpdate).length > 0) {
    await service.from('organizations').update(orgUpdate).eq('id', org.id);
  }

  const { data: existingMember } = await service
    .from('organization_members')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (existingMember?.status === 'active') {
    return {
      success: false,
      status: 'active',
      organization: { id: org.id, name: org.name, slug: org.slug },
      error: 'Already a member',
      httpStatus: 409,
    };
  }

  const { data: existingClaim } = await service
    .from('organization_claims')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (existingClaim) {
    return {
      success: true,
      claim: existingClaim,
      organization: { id: org.id, name: org.name, slug: org.slug },
      status: existingClaim.status,
      message: 'Claim already exists.',
      confirmationEmailSent: false,
      httpStatus: 200,
    };
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
      consent_level: consentLevel,
      permitted_uses: permittedUses,
      story_interest: storyInterest,
      reversibility_until: reversibilityUntil,
    })
    .select('id, status, created_at')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      throw new OrganizationClaimError('You have already submitted a claim for this organization.', 409);
    }
    throw new OrganizationClaimError(insertError.message, 500);
  }

  const now = new Date().toISOString();

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
      claim_id: claim.id,
      gs_entity_id: input.gs_entity_id || org.gs_entity_id || null,
      abn: sanitizedAbn || org.abn || null,
      source: input.gs_entity_id || org.gs_entity_id ? 'civicgraph' : 'justicehub',
    },
  });

  await service.from('agent_task_queue').insert({
    source: 'org_claims',
    source_id: `claim:${claim.id}`,
    task_type: 'org_claim_review',
    title: `Organization claim: ${org.name}`,
    description: `${claimName} (${sanitizedRole}) wants to claim ${org.name}`,
    status: 'pending',
    priority: 2,
    needs_review: true,
    output: {
      claim_id: claim.id,
      organization_id: org.id,
      organization_name: org.name,
      contact_name: claimName,
      contact_email: claimEmail,
      role_at_org: sanitizedRole,
      abn: sanitizedAbn || org.abn || null,
      gs_entity_id: input.gs_entity_id || org.gs_entity_id || null,
      generated_at: now,
    },
  });

  let confirmationEmailSent = false;
  try {
    confirmationEmailSent = await sendClaimConfirmationEmail({
      claimEmail,
      claimName,
      organization: org,
      claimId: claim.id,
    });

    await service.from('member_actions').insert({
      user_id: user.id,
      action_type: 'org_claim_confirmation_email',
      metadata: {
        organization_id: org.id,
        organization_name: org.name,
        claim_id: claim.id,
        contact_email: claimEmail,
        sent: confirmationEmailSent,
        generated_at: now,
      },
    });
  } catch (error) {
    console.error('Error sending organization claim confirmation email:', error);
  }

  return {
    success: true,
    organization: { id: org.id, name: org.name, slug: org.slug },
    claim,
    status: claim.status,
    message: 'Claim submitted successfully. Pending review.',
    confirmationEmailSent,
    httpStatus: 200,
  };
}
