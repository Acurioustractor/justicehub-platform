/**
 * Generate static photo data from EL v2 API (production)
 * Org-scoped — only JusticeHub data.
 */

const V2_URL = process.env.EMPATHY_LEDGER_V2_URL || 'https://www.empathyledger.com';
const V2_KEY = process.env.EMPATHY_LEDGER_V2_KEY;

async function v2Fetch(endpoint, params = {}) {
  const url = new URL(`/api/v2/${endpoint}`, V2_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': V2_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

// Fetch all galleries
const galResult = await v2Fetch('galleries', { limit: 50 });
const galleries = galResult?.data || [];
const galMap = {};
for (const g of galleries) {
  galMap[g.id] = g.title.replace('JusticeHub — ', '');
}

// Fetch all media (paginated)
let allMedia = [];
let page = 1;
while (true) {
  const r = await v2Fetch('media', { limit: 200, page });
  if (!r || !r.data?.length) break;
  allMedia = allMedia.concat(r.data);
  if (!r.pagination?.hasMore) break;
  page++;
}

// Fetch gallery assignments from EL DB (collection_id = gallery id)
const EL_SERVICE_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY;
let mediaGalleryMap = {};
if (EL_SERVICE_KEY) {
  const { createClient } = await import('@supabase/supabase-js');
  const el = createClient('https://yvnuayzslukamizrlhwb.supabase.co', EL_SERVICE_KEY);
  const { data: rows } = await el.from('media_assets')
    .select('id, collection_id')
    .not('collection_id', 'is', null)
    .in('collection_id', Object.keys(galMap));
  if (rows) {
    for (const r of rows) {
      mediaGalleryMap[r.id] = galMap[r.collection_id] || null;
    }
    console.log(`Gallery assignments loaded: ${rows.length} media → galleries`);
  }
}

// Categorize media by gallery or auto-detect from URL/title
function categorize(m) {
  if (m.galleryId && galMap[m.galleryId]) return galMap[m.galleryId].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const url = (m.url || '').toLowerCase();
  const t = (m.title || m.filename || '').toLowerCase();
  // Detect from storage path
  const pathMatch = url.match(/justicehub\/([^/]+)\//);
  if (pathMatch) return pathMatch[1];
  // Detect from content
  if (/spain|diagrama/.test(t)) return 'spain';
  if (/bimberi|confit|deadlylab|program|gallery-\d/.test(t)) return 'programs';
  if (/oonchiumpa|homestead|drone|dji|station|camp|aerial/.test(t)) return 'places';
  if (/brodie|vic|joe.kwon|hamilton|kristy|tanya|law.student|richard/.test(t)) return 'people';
  if (/queensland|spending|funding|road.to.hell|paradox|gold.standard/.test(t)) return 'data';
  if (/container.factory|stretch.bed|washing|assembly|goods/.test(t)) return 'goods';
  if (/breaking.bread|connecting|community|justice.reinvest|jackqwann|mparntwe/.test(t)) return 'community';
  if (/brodie|hero|mentoring|courage/.test(t)) return 'hero';
  return 'general';
}

// Build static array
const staticPhotos = allMedia
  .filter(m => {
    const ct = m.contentType || '';
    return ct.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(m.filename || m.url || '');
  })
  .map(m => ({
    src: m.url,
    thumb: m.thumbnailUrl || m.previewUrl || m.url,
    label: (m.title || m.filename || 'Untitled').substring(0, 50).replace(/[-_]/g, ' ').replace(/\.\w+$/, ''),
    cat: categorize(m),
    gallery: mediaGalleryMap[m.id] || (m.galleryId && galMap[m.galleryId] ? galMap[m.galleryId] : null),
    id: m.id,
  }));

// Also fetch storytellers for avatars
const tellerResult = await v2Fetch('storytellers', { limit: 100 });
const storytellers = (tellerResult?.data || []).filter(t => t.avatarUrl);

// Also fetch stories with images
const storyResult = await v2Fetch('stories', { limit: 100 });
const stories = (storyResult?.data || []).filter(s => s.imageUrl);

// Group counts
const catCounts = {};
for (const p of staticPhotos) {
  catCounts[p.cat] = (catCounts[p.cat] || 0) + 1;
}

console.log(`Total photos: ${staticPhotos.length}`);
console.log('By category:', JSON.stringify(catCounts, null, 2));
console.log(`Storytellers with avatars: ${storytellers.length}`);
console.log(`Stories with images: ${stories.length}`);

// Write JS file
const output = `// Auto-generated from EL v2 API (production) — ${new Date().toISOString()}
// Org-scoped to JusticeHub (0e878fa2-0b44-49b7-86d7-ecf169345582)
// ${staticPhotos.length} photos, ${storytellers.length} storytellers, ${stories.length} stories

const STATIC_GALLERIES = ${JSON.stringify(galleries.map(g => ({
  id: g.id, title: g.title.replace('JusticeHub — ', ''), photoCount: g.photoCount || g.mediaAssetCount || 0
})), null, 2)};

const STATIC_PHOTOS = ${JSON.stringify(staticPhotos, null, 2)};

const STATIC_STORYTELLERS = ${JSON.stringify(storytellers.map(t => ({
  id: t.id, name: t.displayName, avatar: t.avatarUrl, stories: t.storyCount,
  cultural: t.culturalBackground, isElder: t.isElder
})), null, 2)};

const STATIC_STORIES = ${JSON.stringify(stories.map(s => ({
  id: s.id, title: s.title, excerpt: s.excerpt, image: s.imageUrl,
  themes: s.themes, status: s.status, publishedAt: s.publishedAt
})), null, 2)};
`;

const fs = await import('fs');
fs.writeFileSync('output/campaign-hub/static-v2-data.js', output);
console.log('\nWritten to output/campaign-hub/static-v2-data.js');
