import { createClient } from '@supabase/supabase-js';

const el = createClient(
  'https://yvnuayzslukamizrlhwb.supabase.co',
  process.env.EMPATHY_LEDGER_SERVICE_KEY
);

const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';
const JH_PROJECT_ID = '2e774118-471c-450b-a6bc-41467a43c0cf';
const CONTAINED_PROJECT_ID = '9b90b47c-2a4c-409c-97d5-3718aaf8c30c';

// Get media_assets for JusticeHub org
const { data: orgMedia, count: orgCount } = await el.from('media_assets')
  .select('id, title, display_name, url, cdn_url, thumbnail_url, medium_url, storage_path, storage_bucket, media_type, file_type, project_id, collection_id, organization_id', { count: 'exact' })
  .eq('organization_id', JH_ORG_ID)
  .limit(500);

console.log(`=== media_assets for JusticeHub org: ${orgCount} items ===`);
if (orgMedia) {
  // Group by storage_path prefix
  const pathGroups = {};
  orgMedia.forEach(m => {
    const path = m.storage_path || m.url || 'unknown';
    const prefix = path.split('/').slice(0, 3).join('/');
    if (!pathGroups[prefix]) pathGroups[prefix] = [];
    pathGroups[prefix].push(m);
  });
  Object.entries(pathGroups).forEach(([prefix, items]) => {
    console.log(`  ${prefix}: ${items.length} items`);
  });
  // Show samples
  console.log('\nSamples:');
  orgMedia.slice(0, 5).forEach(m => {
    const url = m.cdn_url || m.url || m.thumbnail_url || '';
    console.log(`  "${m.title || m.display_name}" [${m.media_type || m.file_type}] bucket:${m.storage_bucket} path:${m.storage_path?.substring(0, 60)}`);
    console.log(`    url: ${url.substring(0, 100)}`);
  });
}

// Get media_assets for JusticeHub project specifically
const { data: projMedia, count: projCount } = await el.from('media_assets')
  .select('id, title, display_name, url, cdn_url, thumbnail_url, storage_path, storage_bucket, media_type, file_type, collection_id', { count: 'exact' })
  .eq('project_id', JH_PROJECT_ID)
  .limit(500);

console.log(`\n=== media_assets for JusticeHub PROJECT: ${projCount} items ===`);
if (projMedia && projMedia.length) {
  const pathGroups = {};
  projMedia.forEach(m => {
    const bucket = m.storage_bucket || 'unknown';
    const path = m.storage_path || 'none';
    const key = `${bucket}/${path.split('/').slice(0, 2).join('/')}`;
    if (!pathGroups[key]) pathGroups[key] = [];
    pathGroups[key].push(m);
  });
  Object.entries(pathGroups).forEach(([prefix, items]) => {
    console.log(`  ${prefix}: ${items.length} items`);
  });
}

// Get media_assets for CONTAINED project
const { data: contMedia, count: contCount } = await el.from('media_assets')
  .select('id, title, display_name, url, cdn_url, thumbnail_url, storage_path, storage_bucket, media_type', { count: 'exact' })
  .eq('project_id', CONTAINED_PROJECT_ID)
  .limit(500);

console.log(`\n=== media_assets for CONTAINED PROJECT: ${contCount} items ===`);
if (contMedia && contMedia.length) {
  contMedia.slice(0, 10).forEach(m => {
    console.log(`  "${m.title || m.display_name}" [${m.media_type}] → ${(m.cdn_url || m.url || '').substring(0, 100)}`);
  });
}

// Also check galleries linked to JusticeHub org
const { data: jhGalleries } = await el.from('galleries')
  .select('id, title, photo_count, organization_id')
  .eq('organization_id', JH_ORG_ID);

console.log(`\n=== Galleries for JusticeHub org ===`);
if (jhGalleries) jhGalleries.forEach(g => console.log(`  "${g.title}" (${g.id}) — ${g.photo_count} photos`));

// All galleries to understand the full picture
const { data: allGals } = await el.from('galleries').select('id, title, photo_count, organization_id').order('photo_count', { ascending: false });
console.log(`\n=== ALL Galleries ===`);
if (allGals) allGals.forEach(g => console.log(`  "${g.title}" org:${g.organization_id} — ${g.photo_count} photos`));

// Get gallery_photos for JH galleries
if (jhGalleries && jhGalleries.length) {
  for (const g of jhGalleries) {
    const { data: gPhotos, count: gCount } = await el.from('gallery_photos')
      .select('id, media_asset_id, gallery_id', { count: 'exact' })
      .eq('gallery_id', g.id)
      .limit(5);
    console.log(`\n  Gallery "${g.title}" gallery_photos: ${gCount}`);
  }
}
