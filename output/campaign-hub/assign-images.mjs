#!/usr/bin/env node
/**
 * Batch assign images to ACT Communications Dashboard posts in Notion.
 * Run: node output/campaign-hub/assign-images.mjs
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const TOKEN = process.env.JUSTICEHUB_NOTION_TOKEN;
const DB_ID = 'e400e93e-fd9d-4a21-810c-58d67ed9fe97';

if (!TOKEN) { console.error('Missing JUSTICEHUB_NOTION_TOKEN'); process.exit(1); }

// ── Image URL constants ──────────────────────────────────
const JH = 'https://justicehub.com.au/images/contained';
const EL = 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public';
const SB = 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public';

const IMG = {
  posterTour:     `${JH}/poster-tour.png`,
  posterBrand:    `${JH}/poster-brand.png`,
  statCost:       `${JH}/social-stat-cost.png`,
  statRatio:      `${JH}/social-stat-ratio.png`,
  stat155m:       `${JH}/stat-155m.png`,
  statCompare:    `${JH}/stat-comparison.png`,
  tourMtDruitt:   `${JH}/tour-mount-druitt.png`,
  dataViz:        `${JH}/bespoke-data-viz.png`,
  heroLandscape:  `${JH}/justicehub-hero-landscape.png`,
  brandSquare:    `${JH}/contained-brand-square.png`,
  // EL container room photos
  room1:          `${EL}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631913022_Contained-4.jpg`,
  container:      `${EL}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631920999_Contained-23.jpg`,
  roomWhatWorks:  `${EL}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631917162_Contained-9.jpg`,
  twoRealities:   `${EL}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773632013813_two_rooms.png`,
  // EL Spain/Diagrama photos
  diagrama:       `${EL}/gallery-photos/justicehub/spain/the-diagrama-model-a-transformative-approach-to-youth-justice.jpg`,
  diagramaDay1:   `${EL}/gallery-photos/justicehub/spain/from-punishment-to-potential-lessons-from-spains-innovative-youth-justice-model---day-1-with-diagrama.jpg`,
  spainPower:     `${EL}/gallery-photos/justicehub/spain/the-nature-of-power-how-control-shapes-youth-justice.jpg`,
  // Org hero photos
  oonchiumpa:     `${SB}/media/contained/gallery/oonchiumpa-hero.jpg`,
  bgfit:          `${SB}/media/contained/gallery/bgfit-hero.jpg`,
  // Container room overview
  containerRoom:  `${SB}/media/contained/container-room.jpg`,
};

// ── Post → Image mapping ─────────────────────────────────
// Match by title substring → image URL
const ASSIGNMENTS = [
  // CONTAINED Pre-launch
  ['Pre-launch teaser — Australia\'s most expensive failure', IMG.statCost],
  ['Behind the build — container prep',                      IMG.container],
  ['Org spotlight — First Room 3',                           IMG.oonchiumpa],
  ['Why I built this — personal reflection',                 IMG.brandSquare],
  ['Cost comparison that changes everything',                IMG.statCompare],
  ['Diagrama Spain — what detention could look like',        IMG.diagrama],
  ['First 5 nominations announced',                          IMG.posterTour],
  ['Elder voice — community authority',                      IMG.bgfit],
  ['The people behind the programs',                         IMG.roomWhatWorks],
  ['Mount Druitt preview — what to expect',                  IMG.tourMtDruitt],
  ['Warm broadcast email to Tier 2',                         IMG.posterBrand],
  ['Commitments locked — who\'s walking through',            IMG.posterBrand],
  ['GHL mass broadcast — campaign launch email',             IMG.posterTour],
  ['Week 1 impact — reactions, commitments',                 IMG.twoRealities],

  // CONTAINED Launch Week
  ['Day 1 — Launch: It Starts Here (IG)',                    IMG.posterTour],
  ['Day 1 — Launch: It Starts Here (X)',                     IMG.posterTour],
  ['Day 2 — Cost of Detention (IG)',                         IMG.statCost],
  ['Day 2 — Cost of Detention (X)',                          IMG.statCost],
  ['Day 3 — Spain / Diagrama (IG)',                          IMG.diagrama],
  ['Day 3 — Spain / Diagrama (X)',                           IMG.diagramaDay1],
  ['Day 4 — Community Orgs (IG)',                            IMG.oonchiumpa],
  ['Day 4 — Community Orgs (X)',                             IMG.bgfit],
  ['Day 5 — LAUNCH DAY: Young People\'s Voices (IG)',        IMG.room1],
  ['Day 5 — LAUNCH DAY: Young People\'s Voices (X)',         IMG.room1],
  ['Day 6 — The Tour Experience (IG)',                       IMG.container],
  ['Day 6 — The Tour Experience (X)',                        IMG.containerRoom],
  ['Day 7 — Call to Action: Nominate / Book / Share (IG)',   IMG.posterBrand],
  ['Day 7 — Call to Action (X)',                             IMG.posterBrand],

  // JusticeHub posts
  ['We mapped $97.9B in justice funding',                    IMG.dataViz],
  ['JusticeHub x CivicGraph',                                IMG.heroLandscape],
  ['$1.3M per child for detention',                          IMG.stat155m],
  ['The 190 organisations changing',                         IMG.dataViz],
  ['924 interventions with cultural authority',               IMG.dataViz],
  ['INSTAGRAM: Launch carousel',                             IMG.brandSquare],
  ['EMAIL: State AG departments',                            IMG.heroLandscape],
  ['EMAIL: NIAA cold outreach',                              IMG.heroLandscape],
  ['EMAIL: Foundation outreach',                             IMG.heroLandscape],
  ['LINKEDIN: One person, one AI',                           IMG.heroLandscape],
  ['$859,589 per year to destroy',                           IMG.stat155m],
  ['Sound a detention centre makes',                         IMG.room1],
  ['ACT news - Refresh',                                     IMG.brandSquare],
];

// ── Notion helpers ───────────────────────────────────────
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

async function queryAllPages() {
  let pages = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Query failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    pages = pages.concat(data.results);
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  return pages;
}

async function setImage(pageId, imageUrl, imageName) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({
      properties: {
        Image: {
          files: [{
            type: 'external',
            name: imageName,
            external: { url: imageUrl },
          }],
        },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed for ${pageId}: ${res.status} ${err}`);
  }
  return res.json();
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log('Fetching all posts from ACT Communications Dashboard...');
  const pages = await queryAllPages();
  console.log(`Found ${pages.length} posts total.`);

  // Build page map: title → { id, hasImage }
  const pageMap = pages.map(p => {
    const title = p.properties['Content/Communication Name']?.title?.[0]?.plain_text || '';
    const imageFiles = p.properties['Image']?.files || [];
    return { id: p.id, title, hasImage: imageFiles.length > 0 };
  });

  const alreadyHasImage = pageMap.filter(p => p.hasImage).length;
  console.log(`${alreadyHasImage} already have images, ${pageMap.length - alreadyHasImage} need assignment.\n`);

  let assigned = 0;
  let skipped = 0;
  let errors = 0;
  let notFound = [];

  for (const [titleSubstring, imageUrl] of ASSIGNMENTS) {
    const match = pageMap.find(p => p.title.includes(titleSubstring));
    if (!match) {
      notFound.push(titleSubstring);
      continue;
    }

    if (match.hasImage) {
      console.log(`  SKIP (has image): ${match.title}`);
      skipped++;
      continue;
    }

    const imageName = imageUrl.split('/').pop().split('?')[0];
    try {
      await setImage(match.id, imageUrl, imageName);
      console.log(`  ✓ ${match.title} → ${imageName}`);
      match.hasImage = true;
      assigned++;
    } catch (e) {
      console.error(`  ✗ ${match.title}: ${e.message}`);
      errors++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\n═══ RESULTS ═══`);
  console.log(`Assigned: ${assigned}`);
  console.log(`Skipped (already had image): ${skipped}`);
  console.log(`Errors: ${errors}`);
  if (notFound.length) {
    console.log(`\nNot found in Notion (${notFound.length}):`);
    notFound.forEach(t => console.log(`  - ${t}`));
  }

  // Show remaining posts without images
  const remaining = pageMap.filter(p => !p.hasImage);
  if (remaining.length) {
    console.log(`\nStill missing images (${remaining.length}):`);
    remaining.forEach(p => console.log(`  - ${p.title}`));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
