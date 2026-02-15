import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function fixStoragePolicies() {
  console.log('Setting up storage policies for story-images bucket...\n');

  // Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
    return;
  }

  const storyImagesBucket = buckets?.find(b => b.name === 'story-images');

  if (!storyImagesBucket) {
    console.error('story-images bucket does not exist!');
    return;
  }

  console.log('✓ story-images bucket found');
  console.log('  - Public:', storyImagesBucket.public);
  console.log('  - ID:', storyImagesBucket.id);

  console.log('\nNote: Storage policies must be set in Supabase Dashboard');
  console.log('\nRequired policies for story-images bucket:');
  console.log('\n1. Upload Policy (INSERT):');
  console.log('   Name: Allow authenticated users to upload');
  console.log('   Definition: (bucket_id = \'story-images\' AND auth.role() = \'authenticated\')');
  console.log('   Operations: INSERT');

  console.log('\n2. Read Policy (SELECT):');
  console.log('   Name: Allow public read access');
  console.log('   Definition: bucket_id = \'story-images\'');
  console.log('   Operations: SELECT');

  console.log('\n3. Update Policy (UPDATE):');
  console.log('   Name: Allow authenticated users to update their uploads');
  console.log('   Definition: (bucket_id = \'story-images\' AND auth.role() = \'authenticated\')');
  console.log('   Operations: UPDATE');

  console.log('\n4. Delete Policy (DELETE):');
  console.log('   Name: Allow authenticated users to delete their uploads');
  console.log('   Definition: (bucket_id = \'story-images\' AND auth.role() = \'authenticated\')');
  console.log('   Operations: DELETE');

  console.log('\nTo set these up:');
  console.log('1. Go to Supabase Dashboard > Storage > story-images');
  console.log('2. Click "Policies" tab');
  console.log('3. Add each policy above');

  // Test upload with service key (should work)
  console.log('\nTesting upload with service key...');
  const testFile = new Blob(['test'], { type: 'text/plain' });
  const testPath = `test-${Date.now()}.txt`;

  const { data, error } = await supabase.storage
    .from('story-images')
    .upload(`blog/${testPath}`, testFile);

  if (error) {
    console.error('✗ Upload failed:', error);
  } else {
    console.log('✓ Upload successful with service key');

    // Clean up
    await supabase.storage
      .from('story-images')
      .remove([`blog/${testPath}`]);

    console.log('✓ Test file cleaned up');
  }
}

fixStoragePolicies();
