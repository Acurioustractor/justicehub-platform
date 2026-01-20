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

const sql = `
-- Drop the old constraint
ALTER TABLE partner_photos DROP CONSTRAINT IF EXISTS partner_photos_photo_type_check;

-- Add new constraint with updated values
ALTER TABLE partner_photos ADD CONSTRAINT partner_photos_photo_type_check
  CHECK (photo_type IN ('card_thumbnail', 'hero_banner', 'gallery', 'team', 'location', 'program',
                        'hero', 'profile', 'event', 'site', 'general'));

-- Migrate existing data to new types
UPDATE partner_photos SET photo_type = 'hero_banner' WHERE photo_type = 'hero';
UPDATE partner_photos SET photo_type = 'team' WHERE photo_type = 'profile';
UPDATE partner_photos SET photo_type = 'location' WHERE photo_type = 'site';
UPDATE partner_photos SET photo_type = 'program' WHERE photo_type = 'event';
`;

async function run() {
  console.log('Updating photo_type constraint...');
  const { error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Photo types updated successfully!');

  // Verify
  const { data: photos } = await supabase
    .from('partner_photos')
    .select('photo_type')
    .limit(10);

  console.log('Sample photo types:', photos?.map(p => p.photo_type));
}

run().catch(console.error);
