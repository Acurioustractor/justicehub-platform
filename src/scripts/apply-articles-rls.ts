import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS policies to articles table...');

  const policies = [
    {
      name: 'Authenticated users can insert articles',
      sql: `
        CREATE POLICY "Authenticated users can insert articles"
          ON articles FOR INSERT
          TO authenticated
          WITH CHECK (true);
      `
    },
    {
      name: 'Users can update their own articles',
      sql: `
        CREATE POLICY "Users can update their own articles"
          ON articles FOR UPDATE
          TO authenticated
          USING (author_id IN (
            SELECT id FROM public_profiles WHERE user_id = auth.uid()
          ))
          WITH CHECK (author_id IN (
            SELECT id FROM public_profiles WHERE user_id = auth.uid()
          ));
      `
    },
    {
      name: 'Users can delete their own articles',
      sql: `
        CREATE POLICY "Users can delete their own articles"
          ON articles FOR DELETE
          TO authenticated
          USING (author_id IN (
            SELECT id FROM public_profiles WHERE user_id = auth.uid()
          ));
      `
    },
    {
      name: 'Users can view their own articles',
      sql: `
        CREATE POLICY "Users can view their own articles"
          ON articles FOR SELECT
          TO authenticated
          USING (
            status = 'published' OR
            author_id IN (SELECT id FROM public_profiles WHERE user_id = auth.uid())
          );
      `
    }
  ];

  for (const policy of policies) {
    console.log(`\n📝 Creating policy: ${policy.name}...`);

    const { data, error } = await supabase.rpc('query', {
      query: policy.sql
    });

    if (error) {
      // Policy might already exist, which is fine
      if (error.message.includes('already exists')) {
        console.log(`✅ Policy already exists: ${policy.name}`);
      } else {
        console.error(`❌ Error creating policy "${policy.name}":`, error);
        console.log('\n📋 SQL to run manually:');
        console.log(policy.sql);
      }
    } else {
      console.log(`✅ Policy created: ${policy.name}`);
    }
  }

  console.log('\n✅ RLS policies application complete!');
}

applyRLSPolicies();
