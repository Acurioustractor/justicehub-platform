import { createClient } from '@supabase/supabase-js';

const el = createClient(
  'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_SERVICE_KEY || process.env.NEXT_PUBLIC_EMPATHY_LEDGER_ANON_KEY
);

// List all folders under gallery-photos/justicehub/
const { data, error } = await el.storage.from('gallery-photos').list('justicehub', { limit: 100 });
if (error) { console.error('Error:', error); process.exit(1); }

const folders = data.filter(f => !f.metadata);
const files = data.filter(f => f.metadata);

console.log('FOLDERS:', folders.map(f => f.name));
console.log('Root files:', files.length);

for (const folder of folders) {
  const { data: items } = await el.storage.from('gallery-photos').list('justicehub/' + folder.name, { limit: 500 });
  if (!items) continue;
  const photos = items.filter(i => i.metadata);
  const subs = items.filter(i => !i.metadata);
  console.log(`${folder.name}: ${photos.length} photos, ${subs.length} subfolders${subs.length > 0 ? ' → ' + subs.map(s => s.name).join(', ') : ''}`);

  // Recurse into subfolders
  for (const sub of subs) {
    const { data: subItems } = await el.storage.from('gallery-photos').list(`justicehub/${folder.name}/${sub.name}`, { limit: 500 });
    if (!subItems) continue;
    const subPhotos = subItems.filter(i => i.metadata);
    const subSubs = subItems.filter(i => !i.metadata);
    console.log(`  ${sub.name}: ${subPhotos.length} photos, ${subSubs.length} subfolders`);
  }
}

// Also check other top-level buckets
console.log('\n=== Other storage paths ===');
const { data: topLevel } = await el.storage.from('gallery-photos').list('', { limit: 100 });
if (topLevel) {
  const topFolders = topLevel.filter(f => !f.metadata);
  console.log('Top-level folders in gallery-photos:', topFolders.map(f => f.name));
}

// Check media bucket too
const { data: mediaBuckets } = await el.storage.listBuckets();
if (mediaBuckets) {
  console.log('All buckets:', mediaBuckets.map(b => b.name));
}

// Check media bucket contents
const { data: mediaTop } = await el.storage.from('media').list('', { limit: 100 });
if (mediaTop) {
  const mediaFolders = mediaTop.filter(f => !f.metadata);
  console.log('media/ top-level folders:', mediaFolders.map(f => f.name));

  for (const mf of mediaFolders) {
    const { data: mfItems } = await el.storage.from('media').list(mf.name, { limit: 200 });
    if (!mfItems) continue;
    const mfPhotos = mfItems.filter(i => i.metadata);
    const mfSubs = mfItems.filter(i => !i.metadata);
    console.log(`  media/${mf.name}: ${mfPhotos.length} files, ${mfSubs.length} subfolders${mfSubs.length > 0 ? ' → ' + mfSubs.map(s => s.name).join(', ') : ''}`);
  }
}
