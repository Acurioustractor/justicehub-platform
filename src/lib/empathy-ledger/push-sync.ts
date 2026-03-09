import crypto from 'crypto';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger';
import { createServiceClient } from '@/lib/supabase/service';

const DEFAULT_TENANT_ID = '8891e1a9-92ae-423f-928b-cec602660011';

// EL Syndication API — used as a profile data source (bio, image, etc.)
const EL_SYNDICATION_URL = process.env.EMPATHY_LEDGER_SYNDICATION_URL || 'http://localhost:3030';
const EL_SYNDICATION_KEY = process.env.EMPATHY_LEDGER_SYNDICATION_KEY || '';

export interface SyncPersonResult {
  name: string;
  action: 'linked' | 'created' | 'updated' | 'skipped';
  elProfileId?: string;
  elStorytellerId?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  org: {
    action: 'linked' | 'created' | 'updated' | 'already_linked';
    elOrgId: string;
  };
  people: SyncPersonResult[];
  summary: string;
}

interface ELSyndicationProfile {
  id: string;          // storyteller ID
  profile_id: string;  // EL profile UUID
  slug: string;
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Fetch ALL profiles from syndication API as a lookup table.
 * NOTE: The organizationId filter on this API is unreliable,
 * so we fetch all and use service client for org membership.
 */
async function fetchELProfileLookup(): Promise<Map<string, ELSyndicationProfile>> {
  const map = new Map<string, ELSyndicationProfile>();
  try {
    const res = await fetch(
      `${EL_SYNDICATION_URL}/api/syndication/justicehub/profiles?limit=500`,
      { headers: { 'X-API-Key': EL_SYNDICATION_KEY }, cache: 'no-store' },
    );
    if (!res.ok) return map;
    const data = await res.json();
    for (const p of data.profiles || []) {
      map.set(p.profile_id, p);
      map.set(p.id, p); // also index by storyteller ID
    }
  } catch {
    // Syndication API unavailable — proceed without enrichment
  }
  return map;
}

/**
 * Get storyteller/profile IDs that are in the 'justicehub' syndication channel.
 * Returns null if channel not found (no filter applied).
 */
async function getJusticeHubChannelMembers(): Promise<{
  storytellerIds: Set<string>;
  profileIds: Set<string>;
} | null> {
  const elService = empathyLedgerServiceClient!;

  const { data: channel } = await elService
    .from('syndication_channels')
    .select('id')
    .eq('slug', 'justicehub')
    .maybeSingle();

  if (!channel) return null;

  const { data: members } = await (elService as any)
    .from('storyteller_channels')
    .select('storyteller_id')
    .eq('channel_id', channel.id);

  const storytellerIds = new Set<string>(
    ((members || []) as any[]).map((m: any) => m.storyteller_id)
  );

  const profileIds = new Set<string>();
  if (storytellerIds.size > 0) {
    const { data: storytellers } = await elService
      .from('storytellers')
      .select('id, profile_id')
      .in('id', [...storytellerIds]);
    for (const st of (storytellers || []) as any[]) {
      profileIds.add(st.profile_id || st.id);
      profileIds.add(st.id);
    }
  }

  return { storytellerIds, profileIds };
}

interface OrgMember {
  profileId: string;       // EL profiles.id
  storytellerId?: string;  // EL storytellers.id (if they have one)
  displayName: string;
  bio?: string | null;
}

/**
 * Get all people that belong to an EL org.
 * Sources: stories, storyteller_organizations, AND project_storytellers.
 * project_storytellers.storyteller_id references profiles.id (not storytellers.id).
 */
async function getOrgMembers(elOrgId: string): Promise<OrgMember[]> {
  const elService = empathyLedgerServiceClient!;

  // Source 1+2: stories + storyteller_organizations → storyteller IDs
  const [storiesRes, junctionRes] = await Promise.all([
    elService.from('stories').select('storyteller_id').eq('organization_id', elOrgId),
    elService.from('storyteller_organizations').select('storyteller_id').eq('organization_id', elOrgId),
  ]);
  const storytellerIdSet = new Set<string>();
  for (const row of (storiesRes.data || []) as any[]) if (row.storyteller_id) storytellerIdSet.add(row.storyteller_id);
  for (const row of (junctionRes.data || []) as any[]) if (row.storyteller_id) storytellerIdSet.add(row.storyteller_id);

  // Source 3: projects → project_storytellers → profile IDs
  const { data: projects } = await elService.from('projects').select('id').eq('organization_id', elOrgId);
  const projectProfileIdSet = new Set<string>();
  if (projects && projects.length > 0) {
    const { data: ps } = await (elService as any).from('project_storytellers')
      .select('storyteller_id').in('project_id', projects.map((p: any) => p.id));
    for (const row of (ps || []) as any[]) if (row.storyteller_id) projectProfileIdSet.add(row.storyteller_id);
  }

  const members = new Map<string, OrgMember>(); // keyed by profileId

  // Resolve storytellers → profiles
  if (storytellerIdSet.size > 0) {
    const { data: storytellers } = await elService.from('storytellers')
      .select('id, display_name, profile_id, bio').in('id', [...storytellerIdSet]);
    for (const st of (storytellers || []) as any[]) {
      const profileId = st.profile_id || st.id;
      members.set(profileId, {
        profileId,
        storytellerId: st.id,
        displayName: st.display_name || 'Unknown',
        bio: st.bio,
      });
    }
  }

  // Resolve project profile IDs → profiles (some may already be in members from storytellers)
  const missingProfileIds = [...projectProfileIdSet].filter(id => !members.has(id));
  if (missingProfileIds.length > 0) {
    const { data: profiles } = await elService.from('profiles')
      .select('id, full_name, display_name, bio, avatar_url').in('id', missingProfileIds);
    for (const p of (profiles || []) as any[]) {
      if (!members.has(p.id)) {
        // Check if there's a storyteller record for this profile
        const { data: st } = await elService.from('storytellers')
          .select('id').eq('profile_id', p.id).maybeSingle();
        members.set(p.id, {
          profileId: p.id,
          storytellerId: (st as any)?.id,
          displayName: p.display_name || p.full_name || 'Unknown',
          bio: p.bio,
        });
      }
    }
  }

  // Also add project profile IDs that were already in members (from storytellers)
  // but ensure they're included (they already are via the Map)

  return [...members.values()];
}

/**
 * Ensure the JH organization exists in Empathy Ledger.
 */
async function ensureELOrganization(
  jhOrg: {
    id: string;
    name: string;
    empathy_ledger_org_id?: string | null;
    description?: string | null;
    website?: string | null;
    location?: string | null;
  },
  jhService: ReturnType<typeof createServiceClient>,
): Promise<{ action: 'linked' | 'created' | 'updated' | 'already_linked'; elOrgId: string }> {
  const elService = empathyLedgerServiceClient!;

  if (jhOrg.empathy_ledger_org_id) {
    const { data: existing } = await elService
      .from('organizations').select('id').eq('id', jhOrg.empathy_ledger_org_id).single();
    if (existing) return { action: 'already_linked', elOrgId: existing.id };
  }

  const { data: matches } = await elService
    .from('organizations').select('id, name').ilike('name', jhOrg.name);

  if (matches && matches.length > 0) {
    const match = matches[0];
    await jhService.from('organizations').update({ empathy_ledger_org_id: match.id }).eq('id', jhOrg.id);
    await jhService.from('organization_sync_log').insert({
      organization_id: jhOrg.id, empathy_ledger_org_id: match.id,
      sync_action: 'linked', sync_status: 'success',
      sync_details: { matched_by: 'name', el_name: match.name },
    });
    return { action: 'linked', elOrgId: match.id };
  }

  const newOrgId = crypto.randomUUID();
  const { data: newOrg, error: createError } = await elService
    .from('organizations')
    .insert({
      id: newOrgId, tenant_id: DEFAULT_TENANT_ID, name: jhOrg.name,
      slug: generateSlug(jhOrg.name),
      description: jhOrg.description || `${jhOrg.name} — synced from JusticeHub`,
      type: 'community_organization', location: jhOrg.location || '',
      website_url: jhOrg.website || null, empathy_ledger_enabled: true,
    })
    .select('id').single();

  if (createError) throw new Error(`Failed to create EL org: ${createError.message}`);

  await jhService.from('organizations').update({ empathy_ledger_org_id: newOrg.id }).eq('id', jhOrg.id);
  await jhService.from('organization_sync_log').insert({
    organization_id: jhOrg.id, empathy_ledger_org_id: newOrg.id,
    sync_action: 'created', sync_status: 'success',
    sync_details: { created_name: jhOrg.name },
  });
  return { action: 'created', elOrgId: newOrg.id };
}

/**
 * Ensure a storyteller→org link in EL.
 */
async function ensureStorytellerOrgLink(storytellerId: string, elOrgId: string, tenantId: string) {
  const elService = empathyLedgerServiceClient!;
  const { data: existing } = await elService
    .from('storyteller_organizations').select('id')
    .eq('storyteller_id', storytellerId).eq('organization_id', elOrgId).maybeSingle();
  if (existing) return;

  await elService.from('storyteller_organizations').insert({
    id: crypto.randomUUID(), storyteller_id: storytellerId,
    organization_id: elOrgId, tenant_id: tenantId, role: 'storyteller', is_active: true,
  });
}

/**
 * Push a JH person to EL — create profile + storyteller if needed.
 */
async function ensureELProfileAndStoryteller(
  person: {
    id: string;
    full_name: string;
    bio?: string | null;
    photo_url?: string | null;
    empathy_ledger_profile_id?: string | null;
  },
  elOrgId: string,
  tenantId: string,
  profileLookup: Map<string, ELSyndicationProfile>,
  jhService: ReturnType<typeof createServiceClient>,
): Promise<SyncPersonResult> {
  const elService = empathyLedgerServiceClient!;
  const displayName = person.full_name || 'Unknown';

  try {
    // Already linked — verify it exists
    if (person.empathy_ledger_profile_id) {
      const synProfile = profileLookup.get(person.empathy_ledger_profile_id);
      if (synProfile) {
        await ensureStorytellerOrgLink(synProfile.id, elOrgId, tenantId);
        return { name: displayName, action: 'updated', elProfileId: synProfile.profile_id, elStorytellerId: synProfile.id };
      }

      // Check via service client
      const { data: existing } = await elService.from('profiles').select('id').eq('id', person.empathy_ledger_profile_id).single();
      if (existing) {
        const { data: st } = await elService.from('storytellers').select('id').eq('profile_id', existing.id).maybeSingle();
        if (st) {
          await ensureStorytellerOrgLink(st.id, elOrgId, tenantId);
          return { name: displayName, action: 'updated', elProfileId: existing.id, elStorytellerId: st.id };
        }
        // Create storyteller
        const stId = crypto.randomUUID();
        const { error } = await elService.from('storytellers').insert({
          id: stId, profile_id: existing.id, display_name: displayName,
          author_role: 'community_storyteller', is_active: true,
        });
        if (error) return { name: displayName, action: 'skipped', error: error.message };
        await ensureStorytellerOrgLink(stId, elOrgId, tenantId);
        return { name: displayName, action: 'updated', elProfileId: existing.id, elStorytellerId: stId };
      }
    }

    // Search by name in syndication lookup
    const nameMatch = [...profileLookup.values()].find(p =>
      p.display_name.trim().toLowerCase() === displayName.trim().toLowerCase()
    );
    if (nameMatch) {
      await jhService.from('public_profiles').update({ empathy_ledger_profile_id: nameMatch.profile_id }).eq('id', person.id);
      await ensureStorytellerOrgLink(nameMatch.id, elOrgId, tenantId);
      await jhService.from('profile_sync_log').insert({
        public_profile_id: person.id, empathy_ledger_profile_id: nameMatch.profile_id,
        sync_action: 'linked', sync_status: 'success',
        sync_details: { matched_by: 'syndication_name', el_name: nameMatch.display_name },
      });
      return { name: displayName, action: 'linked', elProfileId: nameMatch.profile_id, elStorytellerId: nameMatch.id };
    }

    // Create new profile + storyteller in EL
    const newProfileId = crypto.randomUUID();
    const { error: pErr } = await elService.from('profiles').insert({
      id: newProfileId, tenant_id: tenantId, display_name: displayName,
      bio: person.bio || null, avatar_url: person.photo_url || null,
      primary_organization_id: elOrgId, justicehub_enabled: true,
    });
    if (pErr) return { name: displayName, action: 'skipped', error: pErr.message };

    const newStId = crypto.randomUUID();
    const { error: sErr } = await elService.from('storytellers').insert({
      id: newStId, profile_id: newProfileId, display_name: displayName,
      author_role: 'community_storyteller', is_active: true,
    });
    if (sErr) return { name: displayName, action: 'skipped', error: sErr.message };

    await ensureStorytellerOrgLink(newStId, elOrgId, tenantId);
    await jhService.from('public_profiles').update({ empathy_ledger_profile_id: newProfileId }).eq('id', person.id);
    await jhService.from('profile_sync_log').insert({
      public_profile_id: person.id, empathy_ledger_profile_id: newProfileId,
      sync_action: 'created', sync_status: 'success',
      sync_details: { el_profile_id: newProfileId, el_storyteller_id: newStId },
    });
    return { name: displayName, action: 'created', elProfileId: newProfileId, elStorytellerId: newStId };
  } catch (err: any) {
    await jhService.from('profile_sync_log').insert({
      public_profile_id: person.id, empathy_ledger_profile_id: person.empathy_ledger_profile_id || null,
      sync_action: 'sync', sync_status: 'failed', error_message: err.message,
    });
    return { name: displayName, action: 'skipped', error: err.message };
  }
}

/**
 * Sync a JusticeHub organization and its people to the Empathy Ledger.
 *
 * Bi-directional:
 * - Push: JH people → EL (create profiles + storytellers)
 * - Pull: EL storytellers → JH (only those verified to belong to this org)
 *
 * Org membership is determined by stories + storyteller_organizations (service client),
 * NOT by the syndication API's organizationId filter (which is unreliable).
 */
export async function syncOrgToEL(orgId: string): Promise<SyncResult> {
  if (!isEmpathyLedgerWriteConfigured) {
    throw new Error('Empathy Ledger write access not configured. Set EMPATHY_LEDGER_SERVICE_KEY.');
  }

  const elService = empathyLedgerServiceClient!;
  const jhService = createServiceClient();

  // Fetch JH org
  const { data: jhOrg, error: orgError } = await jhService
    .from('organizations')
    .select('id, name, slug, description, website, location, empathy_ledger_org_id')
    .eq('id', orgId)
    .single();
  if (orgError || !jhOrg) throw new Error(`Organization not found: ${orgError?.message || orgId}`);

  // Step 1: Ensure org in EL
  const orgResult = await ensureELOrganization(jhOrg, jhService);

  // Get tenant_id
  const { data: elOrg } = await elService.from('organizations').select('tenant_id').eq('id', orgResult.elOrgId).single();
  const tenantId = elOrg?.tenant_id || DEFAULT_TENANT_ID;

  // Step 2: Fetch syndication profiles as a lookup (for enrichment data)
  const profileLookup = await fetchELProfileLookup();

  // Step 3: Get JH people
  const sb = jhService as any;
  const [orgProfilesRes, communityProfilesRes] = await Promise.all([
    jhService.from('organizations_profiles').select('public_profile_id').eq('organization_id', orgId),
    sb.from('community_programs_profiles').select('public_profile_id').eq('organization_id', orgId),
  ]);
  const profileIdSet = new Set<string>();
  for (const row of (orgProfilesRes.data || []) as any[]) if (row.public_profile_id) profileIdSet.add(row.public_profile_id);
  for (const row of (communityProfilesRes.data || []) as any[]) if (row.public_profile_id) profileIdSet.add(row.public_profile_id);

  const peopleResults: SyncPersonResult[] = [];

  // Step 4: Push — JH people → EL
  if (profileIdSet.size > 0) {
    const { data: people } = await jhService
      .from('public_profiles')
      .select('id, full_name, bio, photo_url, empathy_ledger_profile_id')
      .in('id', [...profileIdSet]);

    for (const person of people || []) {
      const result = await ensureELProfileAndStoryteller(person, orgResult.elOrgId, tenantId, profileLookup, jhService);
      peopleResults.push(result);
    }
  }

  // Step 5: Pull — EL people → JH
  // Uses stories + storyteller_organizations + project_storytellers for org membership
  const allOrgMembers = await getOrgMembers(orgResult.elOrgId);

  // Filter by justicehub channel — only pull storytellers tagged for JusticeHub
  const channelMembers = await getJusticeHubChannelMembers();
  let orgMembers = allOrgMembers;
  if (channelMembers) {
    orgMembers = allOrgMembers.filter(m =>
      channelMembers.profileIds.has(m.profileId) ||
      (m.storytellerId && channelMembers.storytellerIds.has(m.storytellerId))
    );
  }

  const processedProfileIds = new Set(peopleResults.map(p => p.elProfileId).filter(Boolean));

  for (const member of orgMembers) {
    if (processedProfileIds.has(member.profileId)) continue;

    // Check if already in JH by EL profile link
    const { data: existingJH } = await jhService
      .from('public_profiles').select('id')
      .eq('empathy_ledger_profile_id', member.profileId).maybeSingle();

    if (existingJH) {
      // Ensure org link in JH
      const { data: ol } = await jhService.from('organizations_profiles').select('id')
        .eq('organization_id', orgId).eq('public_profile_id', existingJH.id).maybeSingle();
      if (!ol) await jhService.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: existingJH.id });
      peopleResults.push({ name: member.displayName, action: 'updated', elProfileId: member.profileId, elStorytellerId: member.storytellerId });
      processedProfileIds.add(member.profileId);
      continue;
    }

    // Check by slug
    const baseSlug = generateSlug(member.displayName || 'storyteller');
    const { data: bySlug } = await jhService.from('public_profiles').select('id').eq('slug', baseSlug).maybeSingle();

    // Get enrichment data from syndication lookup
    const synData = profileLookup.get(member.profileId) || (member.storytellerId ? profileLookup.get(member.storytellerId) : undefined);

    let jhProfileId: string;

    if (bySlug) {
      await jhService.from('public_profiles').update({
        empathy_ledger_profile_id: member.profileId,
        synced_from_empathy_ledger: true,
        last_synced_at: new Date().toISOString(),
      }).eq('id', bySlug.id);
      jhProfileId = bySlug.id;
    } else {
      const { data: created, error: insertErr } = await jhService
        .from('public_profiles')
        .insert({
          empathy_ledger_profile_id: member.profileId,
          full_name: member.displayName.trim(),
          slug: baseSlug,
          bio: synData?.bio || member.bio || null,
          photo_url: synData?.profile_image_url || null,
          is_public: true, synced_from_empathy_ledger: true,
          sync_type: 'full', last_synced_at: new Date().toISOString(),
        })
        .select('id').single();

      if (insertErr) {
        if (insertErr.message.includes('slug')) {
          const { data: retry, error: retryErr } = await jhService.from('public_profiles').insert({
            empathy_ledger_profile_id: member.profileId,
            full_name: member.displayName.trim(),
            slug: `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`,
            bio: synData?.bio || member.bio || null, photo_url: synData?.profile_image_url || null,
            is_public: true, synced_from_empathy_ledger: true,
            sync_type: 'full', last_synced_at: new Date().toISOString(),
          }).select('id').single();
          if (retryErr) { peopleResults.push({ name: member.displayName, action: 'skipped', error: retryErr.message }); continue; }
          jhProfileId = retry.id;
        } else {
          peopleResults.push({ name: member.displayName, action: 'skipped', error: insertErr.message });
          continue;
        }
      } else {
        jhProfileId = created.id;
      }
    }

    // Ensure org link in JH
    const { data: ol } = await jhService.from('organizations_profiles').select('id')
      .eq('organization_id', orgId).eq('public_profile_id', jhProfileId).maybeSingle();
    if (!ol) await jhService.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: jhProfileId });

    peopleResults.push({
      name: member.displayName,
      action: bySlug ? 'linked' : 'created',
      elProfileId: member.profileId,
      elStorytellerId: member.storytellerId,
    });
    processedProfileIds.add(member.profileId);
  }

  const created = peopleResults.filter(p => p.action === 'created').length;
  const linked = peopleResults.filter(p => p.action === 'linked').length;
  const updated = peopleResults.filter(p => p.action === 'updated').length;
  const skipped = peopleResults.filter(p => p.action === 'skipped').length;

  return {
    success: true,
    org: orgResult,
    people: peopleResults,
    summary: `Org ${orgResult.action}. People: ${created} created, ${linked} linked, ${updated} already synced, ${skipped} skipped.`,
  };
}

/**
 * Get current sync status for an organization.
 */
export async function getOrgELSyncStatus(orgId: string) {
  const jhService = createServiceClient();

  const { data: org } = await jhService
    .from('organizations').select('empathy_ledger_org_id, name').eq('id', orgId).single();
  if (!org) return null;

  const { data: orgProfiles } = await jhService
    .from('organizations_profiles').select('public_profile_id').eq('organization_id', orgId);

  const profileIds = (orgProfiles || []).map((op: any) => op.public_profile_id).filter(Boolean);
  let linkedPeopleCount = 0;

  if (profileIds.length > 0) {
    const { data: linked } = await jhService
      .from('public_profiles').select('id').in('id', profileIds)
      .not('empathy_ledger_profile_id', 'is', null);
    linkedPeopleCount = linked?.length || 0;
  }

  const { data: lastLog } = await jhService
    .from('organization_sync_log').select('synced_at')
    .eq('organization_id', orgId).order('synced_at', { ascending: false })
    .limit(1).maybeSingle();

  return {
    isLinked: Boolean(org.empathy_ledger_org_id),
    elOrgId: org.empathy_ledger_org_id,
    orgName: org.name,
    totalPeople: profileIds.length,
    linkedPeopleCount,
    lastSyncedAt: lastLog?.synced_at || null,
    writeConfigured: isEmpathyLedgerWriteConfigured,
  };
}
