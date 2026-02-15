import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function applyStoragePolicies() {
  console.log('Applying storage policies for story-images bucket...\n');

  const queries = [
    // Drop existing policies
    `DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated upload to story-images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow public read from story-images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated update in story-images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated delete from story-images" ON storage.objects;`,

    // Create new policies
    `CREATE POLICY "Allow authenticated upload to story-images"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'story-images');`,

    `CREATE POLICY "Allow public read from story-images"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'story-images');`,

    `CREATE POLICY "Allow authenticated update in story-images"
     ON storage.objects FOR UPDATE
     TO authenticated
     USING (bucket_id = 'story-images')
     WITH CHECK (bucket_id = 'story-images');`,

    `CREATE POLICY "Allow authenticated delete from story-images"
     ON storage.objects FOR DELETE
     TO authenticated
     USING (bucket_id = 'story-images');`,
  ];

  for (const query of queries) {
    console.log('Executing:', query.substring(0, 60) + '...');
    const { error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success');
    }
  }

  console.log('\n✅ Storage policies applied!');
  console.log('\nYou can now upload images to the story-images bucket.');
}

applyStoragePolicies();
