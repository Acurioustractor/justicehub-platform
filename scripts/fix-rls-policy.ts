import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['YJSF_SUPABASE_SERVICE_KEY']!
);

async function fixRLSPolicy() {
  console.log('🔧 Fixing RLS policy for articles...');

  // Drop the old policy
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: `DROP POLICY IF EXISTS "Users can update their own articles" ON articles;`
  });

  if (dropError) {
    console.error('Error dropping old policy:', dropError);
  } else {
    console.log('✅ Dropped old policy');
  }

  // Create new policy
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "Users can update their own articles or claim orphaned articles"
        ON articles FOR UPDATE
        TO authenticated
        USING (
          author_id IS NULL OR
          author_id IN (
            SELECT id FROM public_profiles WHERE user_id = auth.uid()
          )
        )
        WITH CHECK (
          author_id IS NULL OR
          author_id IN (
            SELECT id FROM public_profiles WHERE user_id = auth.uid()
          )
        );
    `
  });

  if (createError) {
    console.error('Error creating new policy:', createError);
  } else {
    console.log('✅ Created new policy');
  }

  console.log('\n✅ RLS policy updated! You can now edit articles with NULL author_id.');
}

fixRLSPolicy();
