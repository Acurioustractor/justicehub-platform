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

const KEEP_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';

const { data: org, error } = await supabase
  .from('organizations')
  .select(`
    *,
    partner_photos(id, photo_url, photo_type, is_featured),
    partner_videos(id, title, video_url, platform),
    partner_impact_metrics(id, metric_name, metric_value, is_featured),
    organizations_profiles(id, public_profiles(full_name))
  `)
  .eq('id', KEEP_ID)
  .single();

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('Current Oonchiumpa data:');
console.log('========================');
console.log('Name:', org.name);
console.log('Slug:', org.slug);
console.log('Location:', org.location);
console.log('');
console.log('Description:');
console.log(org.description ? org.description.substring(0, 200) + '...' : 'NONE');
console.log('');
console.log('Photos:', org.partner_photos?.length || 0);
if (org.partner_photos) {
  org.partner_photos.forEach(p => console.log('  -', p.photo_type, p.photo_url?.substring(0, 60)));
}
console.log('');
console.log('Videos:', org.partner_videos?.length || 0);
if (org.partner_videos) {
  org.partner_videos.forEach(v => console.log('  -', v.title || v.platform, v.video_url?.substring(0, 60)));
}
console.log('');
console.log('Metrics:', org.partner_impact_metrics?.length || 0);
if (org.partner_impact_metrics) {
  org.partner_impact_metrics.forEach(m => console.log('  -', m.metric_name + ':', m.metric_value));
}
console.log('');
console.log('Team:', org.organizations_profiles?.length || 0);
if (org.organizations_profiles) {
  org.organizations_profiles.forEach(p => console.log('  -', p.public_profiles?.full_name));
}
