import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function makeUserAdmin(email: string) {
  console.log(`\n🔧 Making ${email} an admin...\n`);

  // Check current user
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);

  console.log('Current user:', users);

  if (!users || users.length === 0) {
    console.log('❌ User not found');
    return;
  }

  // Update to admin
  const { data: updated, error } = await supabase
    .from('users')
    .update({ user_role: 'admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ User updated to admin:', updated);
    console.log('\n✅ Done! Log out and log back in for changes to take effect.\n');
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'test@justicehub.au';

makeUserAdmin(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
