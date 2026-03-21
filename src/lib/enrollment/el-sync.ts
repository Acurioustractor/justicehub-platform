import crypto from 'crypto';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger';

// CONTAINED project constants
const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';
const JH_TENANT_ID = 'bf17d0a9-2b12-4e4a-982e-09a8b1952ec6';
const CONTAINED_PROJECT_ID = '9b90b47c-2a4c-409c-97d5-3718aaf8c30c';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || `visitor-${crypto.randomUUID().slice(0, 6)}`;
}

export interface ELSyncResult {
  elProfileId: string;
  elStorytellerId: string;
}

/**
 * Create an Empathy Ledger profile + storyteller for a device-enrolled visitor.
 * Links them to the CONTAINED project and JusticeHub org.
 */
export async function createVisitorELProfile(
  displayName: string,
  locationText?: string | null,
): Promise<ELSyncResult | null> {
  if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
    console.warn('EL write not configured, skipping visitor EL sync');
    return null;
  }

  const elService = empathyLedgerServiceClient;
  const profileId = crypto.randomUUID();
  const storytellerId = crypto.randomUUID();
  const slug = generateSlug(displayName);

  try {
    // Create EL profile
    const { error: profileError } = await elService.from('profiles').insert({
      id: profileId,
      tenant_id: JH_TENANT_ID,
      display_name: displayName,
      bio: `Visitor to THE CONTAINED installation${locationText ? ` — ${locationText}` : ''}`,
      primary_organization_id: JH_ORG_ID,
      justicehub_enabled: true,
      location: locationText || null,
    });
    if (profileError) {
      console.error('EL profile creation failed:', profileError);
      return null;
    }

    // Create EL storyteller
    const { error: storytellerError } = await elService.from('storytellers').insert({
      id: storytellerId,
      profile_id: profileId,
      display_name: displayName,
      slug,
      author_role: 'community_storyteller',
      is_active: true,
    });
    if (storytellerError) {
      console.error('EL storyteller creation failed:', storytellerError);
      // Profile was created, return partial
      return { elProfileId: profileId, elStorytellerId: '' };
    }

    // Link storyteller to JH org
    await elService.from('storyteller_organizations').insert({
      id: crypto.randomUUID(),
      storyteller_id: storytellerId,
      organization_id: JH_ORG_ID,
      tenant_id: JH_TENANT_ID,
      role: 'storyteller',
      is_active: true,
    }).then(() => {}).catch(() => {});

    // Link storyteller to CONTAINED project
    await elService.from('project_storytellers').insert({
      id: crypto.randomUUID(),
      project_id: CONTAINED_PROJECT_ID,
      storyteller_id: profileId, // project_storytellers references profile_id
    }).then(() => {}).catch(() => {});

    return { elProfileId: profileId, elStorytellerId: storytellerId };
  } catch (err) {
    console.error('EL visitor sync error:', err);
    return null;
  }
}
