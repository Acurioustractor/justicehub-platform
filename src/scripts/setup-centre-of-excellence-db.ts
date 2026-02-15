import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function setupDatabase() {
  console.log('📚 Setting up Centre of Excellence database...\n');

  try {
    // Create regions enum
    console.log('Creating enums...');
    await supabase.rpc('exec', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE global_region AS ENUM (
            'north_america',
            'europe',
            'asia_pacific',
            'africa',
            'latin_america',
            'middle_east',
            'australasia'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          CREATE TYPE program_type AS ENUM (
            'custodial_reform',
            'diversion',
            'restorative_justice',
            'family_therapy',
            'community_based',
            'education_vocational',
            'mentoring',
            'prevention',
            'reentry_support',
            'policy_initiative',
            'traditional_practice'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          CREATE TYPE evidence_strength AS ENUM (
            'rigorous_rct',
            'quasi_experimental',
            'longitudinal_study',
            'evaluation_report',
            'promising_practice',
            'emerging'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `,
    });

    console.log('✅ Enums created\n');

    // Create main international_programs table
    console.log('Creating international_programs table...');
    const { error: programsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS international_programs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          country TEXT NOT NULL,
          region TEXT NOT NULL,
          city_location TEXT,
          program_type TEXT[] NOT NULL DEFAULT '{}',
          description TEXT NOT NULL,
          approach_summary TEXT NOT NULL,
          target_population TEXT,
          year_established INTEGER,
          key_outcomes JSONB DEFAULT '[]'::jsonb,
          recidivism_rate NUMERIC(5,2),
          recidivism_comparison TEXT,
          evidence_strength TEXT,
          research_citations JSONB DEFAULT '[]'::jsonb,
          cost_benefit_ratio TEXT,
          scale TEXT,
          population_served INTEGER,
          australian_adaptations TEXT[],
          visit_status TEXT,
          visit_date DATE,
          visit_notes TEXT,
          collaboration_opportunities TEXT,
          featured_image_url TEXT,
          website_url TEXT,
          contact_email TEXT,
          documents JSONB DEFAULT '[]'::jsonb,
          related_story_ids UUID[],
          related_program_ids UUID[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID,
          status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
        );
      `,
    });

    if (programsError) {
      console.error('Error creating programs table:', programsError);
    } else {
      console.log('✅ international_programs table created\n');
    }

    // Create program_outcomes table
    console.log('Creating program_outcomes table...');
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS program_outcomes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          program_id UUID REFERENCES international_programs(id) ON DELETE CASCADE,
          outcome_type TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          value TEXT NOT NULL,
          comparison_value TEXT,
          timeframe TEXT,
          sample_size INTEGER,
          source TEXT,
          source_year INTEGER,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    console.log('✅ program_outcomes table created\n');

    // Create best_practices table
    console.log('Creating best_practices table...');
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS best_practices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          supporting_research TEXT,
          example_programs UUID[],
          australian_implementation TEXT,
          challenges TEXT,
          recommendations TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    console.log('✅ best_practices table created\n');

    // Create program_visits table
    console.log('Creating program_visits table...');
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS program_visits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          program_id UUID REFERENCES international_programs(id) ON DELETE CASCADE,
          visit_type TEXT NOT NULL CHECK (visit_type IN ('in_person', 'virtual', 'conference', 'exchange')),
          visit_date DATE NOT NULL,
          participants TEXT[],
          organizations TEXT[],
          purpose TEXT,
          outcomes TEXT,
          follow_up_actions TEXT,
          documents JSONB DEFAULT '[]'::jsonb,
          photos JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    console.log('✅ program_visits table created\n');

    // Create international_invitations table
    console.log('Creating international_invitations table...');
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS international_invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          program_id UUID REFERENCES international_programs(id),
          invitee_name TEXT NOT NULL,
          invitee_role TEXT,
          invitee_email TEXT,
          invitation_status TEXT DEFAULT 'draft' CHECK (
            invitation_status IN ('draft', 'sent', 'accepted', 'declined', 'completed')
          ),
          invitation_date DATE,
          visit_purpose TEXT,
          proposed_dates TEXT,
          hosting_organization TEXT,
          visit_completed BOOLEAN DEFAULT FALSE,
          visit_report TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    console.log('✅ international_invitations table created\n');

    // Verify all tables
    console.log('Verifying tables...\n');
    const tables = [
      'international_programs',
      'program_outcomes',
      'best_practices',
      'program_visits',
      'international_invitations',
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: Ready`);
      }
    }

    console.log('\n🎉 Centre of Excellence database setup complete!');
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupDatabase();
