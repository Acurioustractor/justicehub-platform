import { config as loadDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadDotenv({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const defaultSmokeEmail = `admin-smoke+${Date.now()}@justicehub.au`;
const smokeEmail = process.env.ADMIN_BROWSER_SMOKE_EMAIL || defaultSmokeEmail;
const smokePassword = process.env.ADMIN_BROWSER_SMOKE_PASSWORD || 'AdminSmoke123!';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findOrCreateAuthUser() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: smokeEmail,
    password: smokePassword,
    email_confirm: true,
  });

  if (!createError && created.user) {
    return created.user;
  }

  const duplicateLikeError =
    createError?.message?.toLowerCase().includes('already') ||
    createError?.message?.toLowerCase().includes('exists');

  if (duplicateLikeError) {
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', smokeEmail)
      .single();

    if (profileError || !existingProfile?.id) {
      throw new Error(profileError?.message || 'Existing smoke user profile not found');
    }

    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      existingProfile.id,
      {
        email: smokeEmail,
        password: smokePassword,
        email_confirm: true,
      }
    );

    if (updateError || !updated.user) {
      throw new Error(updateError?.message || 'Failed to refresh existing admin browser smoke user');
    }

    return updated.user;
  }

  throw new Error(createError?.message || 'Failed to create admin browser smoke user');
}

async function ensureAdminProfile(userId) {
  const profileRow = {
    id: userId,
    email: smokeEmail,
    role: 'admin',
    is_super_admin: true,
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id' });

  if (error) {
    throw new Error(error.message || 'Failed to upsert admin profile');
  }
}

async function main() {
  const user = await findOrCreateAuthUser();
  await ensureAdminProfile(user.id);

  console.log(JSON.stringify({
    email: smokeEmail,
    password: smokePassword,
    userId: user.id,
    role: 'admin',
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
