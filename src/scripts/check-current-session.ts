import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSession() {
  console.log('\n🔍 Checking Current Browser Session\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Check all sessions
  const { data: sessions } = await supabase.auth.admin.listUsers();

  console.log('All users in auth:');
  sessions?.users.forEach(u => {
    console.log(`  - ${u.email} (${u.id})`);
  });

  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('⚠️  IMPORTANT: This script cannot check browser session');
  console.log('You need to check in the browser:\n');
  console.log('1. Open DevTools (F12 or Cmd+Option+I)');
  console.log('2. Go to Application tab → Local Storage');
  console.log('3. Look for: sb-[project-ref]-auth-token');
  console.log('4. If it exists, you are logged in');
  console.log('5. If not, you need to log in at /login\n');
  console.log('OR check the Network tab for the page request');
  console.log('and look at the cookies being sent\n');
  console.log('═══════════════════════════════════════════════════\n');
}

checkSession()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
