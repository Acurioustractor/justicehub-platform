/**
 * Run Migration via Supabase Client
 *
 * Executes migration statements one by one using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigrationViaSupabase() {
  console.log('\n🚀 Running Migration via Supabase Client\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20250123000001_create_unified_profiles_system.sql'
  );

  console.log('📖 Reading migration SQL...\n');
  const fullSQL = readFileSync(migrationPath, 'utf-8');

  // For simplicity, let's create the tables manually using the client
  console.log('Creating tables one by one...\n');

  // 1. Create public_profiles table
  console.log('1/11 Creating public_profiles table...');
  const { error: error1 } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS public_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        preferred_name TEXT,
        pronouns TEXT,
        bio TEXT,
        tagline TEXT,
        role_tags TEXT[] DEFAULT '{}',
        photo_url TEXT,
        photo_credit TEXT,
        website_url TEXT,
        email TEXT,
        social_links JSONB DEFAULT '{}',
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        empathy_ledger_profile_id UUID,
        is_featured BOOLEAN DEFAULT false,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_public_profiles_slug ON public_profiles(slug);
      CREATE INDEX IF NOT EXISTS idx_public_profiles_featured ON public_profiles(is_featured) WHERE is_featured = true;
    `
  });

  if (error1 && !error1.message?.includes('already exists')) {
    console.log(`   ❌ Error: ${error1.message}\n`);
  } else {
    console.log('   ✅ Done\n');
  }

  // 2. Extend authors table
  console.log('2/11 Extending authors table...');
  const { error: error2 } = await supabase.rpc('exec', {
    query: `
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS public_profile_id UUID REFERENCES public_profiles(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_authors_public_profile ON authors(public_profile_id);
    `
  });

  if (error2 && !error2.message?.includes('already exists')) {
    console.log(`   ❌ Error: ${error2.message}\n`);
  } else {
    console.log('   ✅ Done\n');
  }

  // 3. Create art_innovation_profiles table
  console.log('3/11 Creating art_innovation_profiles table...');
  const { error: error3 } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS art_innovation_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
        public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        role_description TEXT,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(art_innovation_id, public_profile_id)
      );

      CREATE INDEX IF NOT EXISTS idx_art_innovation_profiles_art ON art_innovation_profiles(art_innovation_id);
      CREATE INDEX IF NOT EXISTS idx_art_innovation_profiles_profile ON art_innovation_profiles(public_profile_id);
    `
  });

  if (error3 && !error3.message?.includes('already exists')) {
    console.log(`   ❌ Error: ${error3.message}\n`);
  } else {
    console.log('   ✅ Done\n');
  }

  // 4. Create community_programs_profiles table
  console.log('4/11 Creating community_programs_profiles table...');
  const { error: error4 } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS community_programs_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
        public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        role_description TEXT,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(program_id, public_profile_id)
      );

      CREATE INDEX IF NOT EXISTS idx_community_programs_profiles_program ON community_programs_profiles(program_id);
      CREATE INDEX IF NOT EXISTS idx_community_programs_profiles_profile ON community_programs_profiles(public_profile_id);
    `
  });

  if (error4 && !error4.message?.includes('already exists')) {
    console.log(`   ❌ Error: ${error4.message}\n`);
  } else {
    console.log('   ✅ Done\n');
  }

  // 5. Create services_profiles table
  console.log('5/11 Creating services_profiles table...');
  const { error: error5 } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS services_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES services(id) ON DELETE CASCADE,
        public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        role_description TEXT,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(service_id, public_profile_id)
      );

      CREATE INDEX IF NOT EXISTS idx_services_profiles_service ON services_profiles(service_id);
      CREATE INDEX IF NOT EXISTS idx_services_profiles_profile ON services_profiles(public_profile_id);
    `
  });

  if (error5 && !error5.message?.includes('already exists')) {
    console.log(`   ❌ Error: ${error5.message}\n`);
  } else {
    console.log('   ✅ Done\n');
  }

  // 6. Create article_related_art table
  console.log('6/11 Creating article_related_art table...');
  const { error: error6 } = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS article_related_art (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
        art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
        relevance_note TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(article_id, art_innovation_id)
      );

      CREATE INDEX IF NOT EXISTS idx_article_related_art_article ON article_related_art(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_related_art_art ON article_related_art(art_innovation_id);
    `
  });

  if (error6 && !error6.message?.includes('already exists')) {
    console.log(`   ❌ Error: ${error6.message}\n`);
  } else {
    console.log('   ✅ Done\n');
  }

  console.log('═══════════════════════════════════════════════════\n');
  console.log('⚠️  Note: RPC exec may not exist - trying direct table creation...\n');

  // Verify by trying to select from tables
  console.log('Verifying table creation...\n');

  const tables = [
    'public_profiles',
    'art_innovation_profiles',
    'community_programs_profiles',
    'services_profiles',
    'article_related_art'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(0);

    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: accessible`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('If tables are not accessible, please run the migration manually:');
  console.log('1. Open: https://supabase.com/dashboard → SQL Editor');
  console.log('2. Copy/paste: supabase/migrations/20250123000001_create_unified_profiles_system.sql');
  console.log('3. Click "Run"\n');
  console.log('Then re-run this script to verify.\n');
}

runMigrationViaSupabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
