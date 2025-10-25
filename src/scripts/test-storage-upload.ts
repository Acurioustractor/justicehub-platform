import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function testStorageUpload() {
  console.log('Testing storage upload with service key...\n');

  // Create a test image blob
  const testImageData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    // Minimal PNG data
  ]);

  const testFile = new Blob([testImageData], { type: 'image/png' });
  const testFileName = `test-${Date.now()}.png`;
  const testPath = `blog/${testFileName}`;

  console.log('Uploading test file:', testPath);

  const { data, error } = await supabase.storage
    .from('story-images')
    .upload(testPath, testFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Error details:', error);
    return;
  }

  console.log('✅ Upload successful!');
  console.log('Data:', data);

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('story-images')
    .getPublicUrl(testPath);

  console.log('✅ Public URL:', publicUrl);

  // Clean up
  console.log('\nCleaning up test file...');
  const { error: deleteError } = await supabase.storage
    .from('story-images')
    .remove([testPath]);

  if (deleteError) {
    console.error('❌ Delete failed:', deleteError.message);
  } else {
    console.log('✅ Test file deleted');
  }

  console.log('\n🎉 Storage upload is working correctly!');
  console.log('You can now upload images from the editor.');
}

testStorageUpload();
