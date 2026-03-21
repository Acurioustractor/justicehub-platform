/**
 * Fetch ALL media from EL v2 API (org-scoped to JusticeHub)
 * This is the correct way — uses the authenticated org API key.
 */

const V2_URL = process.env.EMPATHY_LEDGER_V2_URL;
const V2_KEY = process.env.EMPATHY_LEDGER_V2_KEY;

if (!V2_URL || !V2_KEY) {
  console.error('Missing EMPATHY_LEDGER_V2_URL or EMPATHY_LEDGER_V2_KEY');
  process.exit(1);
}

async function v2Fetch(endpoint, params = {}) {
  const url = new URL(`/api/v2/${endpoint}`, V2_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': V2_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) {
    console.error(`API ${res.status}: ${await res.text()}`);
    return null;
  }
  return res.json();
}

// 1. Get all galleries
console.log('=== Galleries (org-scoped) ===');
const galResult = await v2Fetch('galleries', { limit: 50 });
if (galResult) {
  console.log(`Total: ${galResult.pagination?.total || galResult.data?.length}`);
  for (const g of galResult.data || []) {
    console.log(`  "${g.title}" — ${g.photoCount || g.mediaAssetCount || 0} photos (${g.id})`);
  }
}

// 2. Get all media (paginate)
console.log('\n=== Media (org-scoped, all pages) ===');
let allMedia = [];
let page = 1;
while (true) {
  const mediaResult = await v2Fetch('media', { limit: 200, page });
  if (!mediaResult || !mediaResult.data?.length) break;
  allMedia = allMedia.concat(mediaResult.data);
  console.log(`  Page ${page}: ${mediaResult.data.length} items (total so far: ${allMedia.length})`);
  if (!mediaResult.pagination?.hasMore) break;
  page++;
}
console.log(`\nTotal media: ${allMedia.length}`);

// 3. Group by gallery
const byGallery = {};
const noGallery = [];
for (const m of allMedia) {
  if (m.galleryId) {
    if (!byGallery[m.galleryId]) byGallery[m.galleryId] = [];
    byGallery[m.galleryId].push(m);
  } else {
    noGallery.push(m);
  }
}
console.log('\n=== Media by gallery ===');
for (const [gid, items] of Object.entries(byGallery)) {
  const galName = galResult?.data?.find(g => g.id === gid)?.title || gid;
  console.log(`  "${galName}": ${items.length} items`);
}
if (noGallery.length) console.log(`  (no gallery): ${noGallery.length} items`);

// 4. Get projects
console.log('\n=== Projects ===');
const projResult = await v2Fetch('projects', { limit: 20 });
if (projResult) {
  for (const p of projResult.data || []) {
    console.log(`  "${p.name}" (${p.code}) — ${p.storyCount} stories, ${p.storytellerCount} storytellers`);
  }
}

// 5. Get stories
console.log('\n=== Stories ===');
const storyResult = await v2Fetch('stories', { limit: 100 });
if (storyResult) {
  console.log(`Total: ${storyResult.pagination?.total}`);
  for (const s of (storyResult.data || []).slice(0, 10)) {
    console.log(`  "${s.title}" [${s.status}] img: ${s.imageUrl ? 'yes' : 'no'}`);
  }
}

// 6. Get storytellers
console.log('\n=== Storytellers ===');
const tellerResult = await v2Fetch('storytellers', { limit: 100 });
if (tellerResult) {
  console.log(`Total: ${tellerResult.pagination?.total}`);
  for (const t of (tellerResult.data || []).slice(0, 10)) {
    console.log(`  "${t.displayName}" — ${t.storyCount} stories, avatar: ${t.avatarUrl ? 'yes' : 'no'}`);
  }
}

// 7. Sample media item to see full structure
if (allMedia.length) {
  console.log('\n=== Sample media item ===');
  console.log(JSON.stringify(allMedia[0], null, 2));
}
