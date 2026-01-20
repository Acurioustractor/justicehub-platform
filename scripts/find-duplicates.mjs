import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const searchName = process.argv[2] || 'oonchiumpa';

const { data, error } = await supabase
  .from('organizations')
  .select('id, name, slug, location, created_at, organizations_profiles(id)')
  .ilike('name', '%' + searchName + '%')
  .order('created_at');

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('Found ' + data.length + ' organizations matching "' + searchName + '":\n');
data.forEach((org, i) => {
  const teamCount = org.organizations_profiles ? org.organizations_profiles.length : 0;
  console.log((i+1) + '. ID: ' + org.id);
  console.log('   Slug: ' + org.slug);
  console.log('   Location: ' + (org.location || 'none'));
  console.log('   Team members: ' + teamCount);
  console.log('   Created: ' + org.created_at + '\n');
});
