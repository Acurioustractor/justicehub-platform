#!/usr/bin/env node
/**
 * ALMA Enhanced Extraction - Better deduplication, locations, facilities
 *
 * Improvements over basic scraper:
 * 1. Fuzzy deduplication using Levenshtein distance
 * 2. Specific extraction for detention centres and facilities
 * 3. Location/coordinate extraction with geocoding
 * 4. Enrichment of existing records with new information
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * Australian Youth Detention Centres (known facilities)
 */
const KNOWN_DETENTION_CENTRES = [
  // QLD
  { name: 'Brisbane Youth Detention Centre', state: 'QLD', city: 'Wacol', lat: -27.5833, lng: 152.9333 },
  { name: 'West Moreton Youth Detention Centre', state: 'QLD', city: 'Wacol', lat: -27.5833, lng: 152.9333 },
  { name: 'Cleveland Youth Detention Centre', state: 'QLD', city: 'Townsville', lat: -19.3167, lng: 146.7667 },
  // NSW
  { name: 'Cobham Youth Justice Centre', state: 'NSW', city: 'Werrington', lat: -33.7500, lng: 150.7500 },
  { name: 'Reiby Youth Justice Centre', state: 'NSW', city: 'Airds', lat: -34.0833, lng: 150.8333 },
  { name: 'Orana Youth Justice Centre', state: 'NSW', city: 'Dubbo', lat: -32.2569, lng: 148.6011 },
  { name: 'Riverina Youth Justice Centre', state: 'NSW', city: 'Wagga Wagga', lat: -35.1082, lng: 147.3598 },
  { name: 'Frank Baxter Youth Justice Centre', state: 'NSW', city: 'Kariong', lat: -33.4333, lng: 151.2833 },
  { name: 'Acmena Youth Justice Centre', state: 'NSW', city: 'Grafton', lat: -29.6833, lng: 152.9333 },
  // VIC
  { name: 'Parkville Youth Justice Precinct', state: 'VIC', city: 'Parkville', lat: -37.7833, lng: 144.9500 },
  { name: 'Malmsbury Youth Justice Centre', state: 'VIC', city: 'Malmsbury', lat: -37.1833, lng: 144.3667 },
  { name: 'Cherry Creek Youth Justice Centre', state: 'VIC', city: 'Werribee', lat: -37.9000, lng: 144.6667 },
  // WA
  { name: 'Banksia Hill Detention Centre', state: 'WA', city: 'Canning Vale', lat: -32.0667, lng: 115.9167 },
  { name: 'Unit 18 Casuarina Prison', state: 'WA', city: 'Casuarina', lat: -32.1167, lng: 115.8500 },
  // SA
  { name: 'Adelaide Youth Training Centre', state: 'SA', city: 'Cavan', lat: -34.8333, lng: 138.5833 },
  { name: 'Kurlana Tapa Youth Justice Centre', state: 'SA', city: 'Cavan', lat: -34.8333, lng: 138.5833 },
  // NT
  { name: 'Don Dale Youth Detention Centre', state: 'NT', city: 'Berrimah', lat: -12.4333, lng: 130.9167 },
  { name: 'Alice Springs Youth Detention Centre', state: 'NT', city: 'Alice Springs', lat: -23.6980, lng: 133.8807 },
  // TAS
  { name: 'Ashley Youth Detention Centre', state: 'TAS', city: 'Deloraine', lat: -41.5167, lng: 146.6500 },
  // ACT
  { name: 'Bimberi Youth Justice Centre', state: 'ACT', city: 'Mitchell', lat: -35.2167, lng: 149.1333 },
];

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalize intervention name for comparison
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find similar existing intervention (fuzzy match)
 */
async function findSimilarIntervention(name, threshold = 0.85) {
  const normalized = normalizeName(name);

  // Get all interventions for comparison
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name')
    .limit(2000);

  if (!interventions) return null;

  for (const existing of interventions) {
    const existingNorm = normalizeName(existing.name);

    // Exact match
    if (normalized === existingNorm) {
      return { id: existing.id, name: existing.name, similarity: 1.0 };
    }

    // Fuzzy match using Levenshtein
    const maxLen = Math.max(normalized.length, existingNorm.length);
    const distance = levenshteinDistance(normalized, existingNorm);
    const similarity = 1 - (distance / maxLen);

    if (similarity >= threshold) {
      return { id: existing.id, name: existing.name, similarity };
    }

    // Check if one contains the other
    if (normalized.includes(existingNorm) || existingNorm.includes(normalized)) {
      return { id: existing.id, name: existing.name, similarity: 0.9 };
    }
  }

  return null;
}

/**
 * Enhanced extraction prompt with facilities and locations
 */
function getEnhancedPrompt(content, jurisdiction) {
  return `Extract ALL youth justice entities from this Australian ${jurisdiction} content. Be THOROUGH - extract every program, facility, and service mentioned.

CRITICAL: Look specifically for:
1. DETENTION CENTRES / YOUTH JUSTICE FACILITIES
2. Youth justice service centres and offices
3. Diversion programs
4. Rehabilitation programs
5. Cultural programs (especially Indigenous)
6. Community-based alternatives

Return ONLY valid JSON (no markdown, no code blocks):
{
  "facilities": [
    {
      "name": "Facility name (e.g., 'Brisbane Youth Detention Centre')",
      "type": "detention_centre|youth_justice_centre|community_centre|court|service_office",
      "address": "Full street address if mentioned",
      "city": "City/suburb",
      "state": "${jurisdiction}",
      "capacity": "Number if mentioned",
      "operator": "Who runs it (e.g., 'Department of Youth Justice')",
      "services": ["List of services provided"]
    }
  ],
  "interventions": [
    {
      "name": "Program/service name",
      "type": "Prevention|Diversion|Detention|Cultural Connection|Education/Employment|Family Support|Therapeutic|Community-Led|Justice Reinvestment|Wraparound|Early Intervention|Court Support|Bail Support|Transition/Reintegration",
      "description": "Detailed description (2-3 sentences)",
      "target_age": "e.g., '10-17 years'",
      "target_cohort": ["Aboriginal and Torres Strait Islander youth", "Young offenders", etc],
      "delivery_locations": ["City/region names"],
      "state": "${jurisdiction}",
      "operating_org": "Organization that runs it",
      "website": "URL if mentioned",
      "phone": "Phone number if mentioned",
      "eligibility": "Who can access",
      "referral_process": "How to access",
      "evidence_base": "Any outcomes/effectiveness data mentioned"
    }
  ],
  "statistics": [
    {
      "metric": "What is measured",
      "value": "The number/percentage",
      "year": "Year of data",
      "source": "Where this data comes from"
    }
  ],
  "contacts": [
    {
      "name": "Person/role name",
      "title": "Job title",
      "organization": "Organization",
      "phone": "Phone if mentioned",
      "email": "Email if mentioned"
    }
  ]
}

Extract EVERYTHING mentioned, even partial information. Better to capture more than miss something.

Content:
${content.substring(0, 40000)}`;
}

/**
 * Extract entities with enhanced prompt
 */
async function extractEnhanced(content, jurisdiction) {
  if (content.length < 200) return null;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: getEnhancedPrompt(content, jurisdiction) }]
    });

    let jsonText = response.content[0].text;
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.log(`   ❌ Extraction error: ${error.message}`);
    return null;
  }
}

/**
 * Valid intervention types (from database constraint)
 */
const VALID_TYPES = [
  'Community-Led', 'Cultural Connection', 'Diversion', 'Early Intervention',
  'Education/Employment', 'Family Strengthening', 'Justice Reinvestment',
  'Prevention', 'Therapeutic', 'Wraparound Support'
];

/**
 * Map extracted type to valid database type
 */
function mapToValidType(extractedType) {
  if (!extractedType) return 'Community-Led';

  const typeMap = {
    'detention': 'Community-Led', // Facilities don't have a dedicated type
    'facility': 'Community-Led',
    'court support': 'Diversion',
    'bail support': 'Diversion',
    'transition': 'Wraparound Support',
    'reintegration': 'Wraparound Support'
  };

  const lower = extractedType.toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (lower.includes(key)) return value;
  }

  // Try exact match
  const exactMatch = VALID_TYPES.find(t =>
    t.toLowerCase() === lower || lower.includes(t.toLowerCase())
  );
  if (exactMatch) return exactMatch;

  return 'Community-Led'; // Default
}

/**
 * Store or enrich facility
 */
async function storeOrEnrichFacility(facility, sourceUrl) {
  // Check if known detention centre
  const knownCentre = KNOWN_DETENTION_CENTRES.find(
    kc => normalizeName(kc.name).includes(normalizeName(facility.name)) ||
         normalizeName(facility.name).includes(normalizeName(kc.name))
  );

  const lat = knownCentre?.lat || null;
  const lng = knownCentre?.lng || null;

  // Check for existing
  const { data: existing } = await supabase
    .from('alma_interventions')
    .select('id, name, description, geography, metadata')
    .or(`name.ilike.%${facility.name}%,name.ilike.%${facility.name.split(' ')[0]}%`)
    .limit(5);

  const exactMatch = existing?.find(e => normalizeName(e.name) === normalizeName(facility.name));

  if (exactMatch) {
    // ENRICH existing record
    const updates = {};
    if (lat && !exactMatch.latitude) updates.latitude = lat;
    if (lng && !exactMatch.longitude) updates.longitude = lng;
    if (facility.capacity) {
      const currentMeta = exactMatch.metadata || {};
      updates.metadata = { ...currentMeta, capacity: facility.capacity, facility_type: facility.type };
    }
    if (facility.operator) updates.operating_organization = facility.operator;

    if (Object.keys(updates).length > 0) {
      await supabase.from('alma_interventions').update(updates).eq('id', exactMatch.id);
      console.log(`   🔄 Enriched: ${facility.name}`);
      return { action: 'enriched', id: exactMatch.id };
    }
    return { action: 'skipped', id: exactMatch.id };
  }

  // Insert new facility with valid type
  const validType = mapToValidType(facility.type);
  const { data, error } = await supabase.from('alma_interventions').insert({
    name: facility.name,
    type: validType,
    description: `${facility.type} facility. ${facility.services?.join(', ') || ''}`.trim(),
    geography: [facility.city, facility.state].filter(Boolean),
    latitude: lat,
    longitude: lng,
    operating_organization: facility.operator,
    consent_level: 'Public Knowledge Commons',
    review_status: 'Approved',
    permitted_uses: ['Query (internal)'],
    metadata: {
      capacity: facility.capacity,
      address: facility.address,
      facility_type: facility.type
    }
  }).select('id').single();

  if (!error && data) {
    console.log(`   ✅ NEW Facility: ${facility.name}`);
    return { action: 'inserted', id: data.id };
  }

  return { action: 'error' };
}

/**
 * Store or enrich intervention with deduplication
 */
async function storeOrEnrichIntervention(intervention, sourceUrl) {
  // Fuzzy match check
  const similar = await findSimilarIntervention(intervention.name);

  if (similar) {
    // ENRICH existing record with new information
    const { data: existing } = await supabase
      .from('alma_interventions')
      .select('*')
      .eq('id', similar.id)
      .single();

    if (existing) {
      const updates = {};

      // Only update if we have better data
      if (!existing.description && intervention.description) {
        updates.description = intervention.description;
      }
      if (!existing.type && intervention.type) {
        updates.type = intervention.type;
      }
      if (!existing.operating_organization && intervention.operating_org) {
        updates.operating_organization = intervention.operating_org;
      }
      if (!existing.website && intervention.website) {
        updates.website = intervention.website;
      }
      if (!existing.contact_phone && intervention.phone) {
        updates.contact_phone = intervention.phone;
      }
      if (intervention.delivery_locations?.length) {
        const currentGeo = existing.geography || [];
        const newGeo = [...new Set([...currentGeo, ...intervention.delivery_locations])];
        if (newGeo.length > currentGeo.length) {
          updates.geography = newGeo;
        }
      }
      if (intervention.target_cohort?.length) {
        const currentCohort = existing.target_cohort || [];
        const newCohort = [...new Set([...currentCohort, ...intervention.target_cohort])];
        if (newCohort.length > currentCohort.length) {
          updates.target_cohort = newCohort;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase.from('alma_interventions').update(updates).eq('id', similar.id);
        console.log(`   🔄 Enriched (${Math.round(similar.similarity * 100)}% match): ${intervention.name}`);
        return { action: 'enriched', id: similar.id };
      }

      console.log(`   ⏭️ Duplicate (${Math.round(similar.similarity * 100)}%): ${intervention.name}`);
      return { action: 'skipped', id: similar.id };
    }
  }

  // Insert new intervention with valid type
  const validType = mapToValidType(intervention.type);
  const { data, error } = await supabase.from('alma_interventions').insert({
    name: intervention.name,
    type: validType,
    description: intervention.description,
    target_cohort: intervention.target_cohort || ['Young people'],
    geography: [...(intervention.delivery_locations || []), intervention.state].filter(Boolean),
    operating_organization: intervention.operating_org,
    website: intervention.website,
    contact_phone: intervention.phone,
    source_url: sourceUrl,
    consent_level: 'Public Knowledge Commons',
    review_status: 'Approved',
    permitted_uses: ['Query (internal)'],
    metadata: {
      target_age: intervention.target_age,
      eligibility: intervention.eligibility,
      referral_process: intervention.referral_process,
      evidence_base: intervention.evidence_base
    }
  }).select('id').single();

  if (!error && data) {
    console.log(`   ✅ NEW: ${intervention.name}`);
    return { action: 'inserted', id: data.id };
  }

  return { action: 'error' };
}

/**
 * Process content with enhanced extraction
 */
async function processContent(content, sourceUrl, jurisdiction) {
  const entities = await extractEnhanced(content, jurisdiction);
  if (!entities) return { facilities: 0, interventions: 0, enriched: 0 };

  const stats = { facilities: 0, interventions: 0, enriched: 0 };

  // Process facilities
  for (const facility of (entities.facilities || [])) {
    const result = await storeOrEnrichFacility(facility, sourceUrl);
    if (result.action === 'inserted') stats.facilities++;
    if (result.action === 'enriched') stats.enriched++;
  }

  // Process interventions
  for (const intervention of (entities.interventions || [])) {
    const result = await storeOrEnrichIntervention(intervention, sourceUrl);
    if (result.action === 'inserted') stats.interventions++;
    if (result.action === 'enriched') stats.enriched++;
  }

  return stats;
}

/**
 * Re-process existing raw content with enhanced extraction
 */
async function reprocessExisting(limit = 50) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     ALMA Enhanced Re-Extraction - Enriching Database      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Get raw content that has been processed but may benefit from re-extraction
  const { data: rawContent, error } = await supabase
    .from('alma_raw_content')
    .select('id, source_url, raw_content, source_type')
    .eq('processing_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !rawContent) {
    console.log('No raw content to reprocess');
    return;
  }

  console.log(`📋 Found ${rawContent.length} items to reprocess\n`);

  let totalNew = 0;
  let totalEnriched = 0;

  for (const item of rawContent) {
    console.log(`\n🔄 Reprocessing: ${item.source_url.substring(0, 60)}...`);

    // Detect jurisdiction
    const jurisdiction = detectJurisdiction(item.source_url);

    // Run enhanced extraction
    const stats = await processContent(item.raw_content, item.source_url, jurisdiction);

    totalNew += stats.facilities + stats.interventions;
    totalEnriched += stats.enriched;

    // Update processing timestamp
    await supabase
      .from('alma_raw_content')
      .update({
        last_processed_at: new Date().toISOString(),
        metadata: { enhanced_extraction: true }
      })
      .eq('id', item.id);

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 ENHANCED EXTRACTION SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`New entities inserted: ${totalNew}`);
  console.log(`Existing entities enriched: ${totalEnriched}`);
  console.log('✅ Complete!');
}

/**
 * Detect jurisdiction from URL
 */
function detectJurisdiction(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.vic.gov.au') || urlLower.includes('victoria')) return 'VIC';
  if (urlLower.includes('.qld.gov.au') || urlLower.includes('queensland')) return 'QLD';
  if (urlLower.includes('.nsw.gov.au') || urlLower.includes('new-south-wales')) return 'NSW';
  if (urlLower.includes('.nt.gov.au') || urlLower.includes('northern-territory')) return 'NT';
  if (urlLower.includes('.sa.gov.au') || urlLower.includes('south-australia')) return 'SA';
  if (urlLower.includes('.wa.gov.au') || urlLower.includes('western-australia')) return 'WA';
  if (urlLower.includes('.tas.gov.au') || urlLower.includes('tasmania')) return 'TAS';
  if (urlLower.includes('.act.gov.au') || urlLower.includes('canberra')) return 'ACT';
  return 'National';
}

/**
 * Seed known detention centres
 */
async function seedDetentionCentres() {
  console.log('🏢 Seeding known detention centres...\n');

  for (const centre of KNOWN_DETENTION_CENTRES) {
    const { data: existing } = await supabase
      .from('alma_interventions')
      .select('id')
      .ilike('name', `%${centre.name}%`)
      .limit(1);

    if (existing?.length > 0) {
      // Enrich with coordinates
      await supabase
        .from('alma_interventions')
        .update({
          latitude: centre.lat,
          longitude: centre.lng,
          location_type: 'detention_centre',
          geography: [centre.city, centre.state]
        })
        .eq('id', existing[0].id);
      console.log(`   🔄 Updated: ${centre.name}`);
    } else {
      // Insert new
      await supabase.from('alma_interventions').insert({
        name: centre.name,
        type: 'Detention',
        description: `Youth detention facility in ${centre.city}, ${centre.state}`,
        geography: [centre.city, centre.state],
        latitude: centre.lat,
        longitude: centre.lng,
        location_type: 'detention_centre',
        consent_level: 'Public Knowledge Commons',
        review_status: 'Approved',
        permitted_uses: ['Query (internal)']
      });
      console.log(`   ✅ Added: ${centre.name}`);
    }
  }

  console.log('\n✅ Detention centres seeded!');
}

/**
 * Audit current data quality
 */
async function auditDataQuality() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║            ALMA Data Quality Audit                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Total interventions
  const { count: total } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  // By type - get all and count in JS
  const { data: allTypes } = await supabase
    .from('alma_interventions')
    .select('type')
    .limit(2000);

  const byType = {};
  (allTypes || []).forEach(i => {
    const t = i.type || 'Unknown';
    byType[t] = (byType[t] || 0) + 1;
  });

  // With coordinates
  const { count: withCoords } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null);

  // With source_url
  const { count: withSource } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .not('source_url', 'is', null);

  // Detention facilities
  const { count: detention } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .eq('location_type', 'detention_centre');

  // Find duplicates
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('name')
    .limit(2000);

  const names = interventions?.map(i => i.name) || [];
  const nameCounts = {};
  names.forEach(n => { nameCounts[n] = (nameCounts[n] || 0) + 1; });
  const duplicates = Object.entries(nameCounts).filter(([_, c]) => c > 1);

  console.log('📊 DATA QUALITY METRICS\n');
  console.log(`Total interventions: ${total}`);
  console.log(`With coordinates: ${withCoords} (${Math.round(withCoords/total*100)}%)`);
  console.log(`With source URL: ${withSource} (${Math.round(withSource/total*100)}%)`);
  console.log(`Detention centres: ${detention}`);
  console.log(`Exact duplicates: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log('\n⚠️ Duplicate names to review:');
    duplicates.slice(0, 10).forEach(([name, count]) => {
      console.log(`   "${name.substring(0, 50)}..." (${count}x)`);
    });
  }

  console.log('\n📊 BY INTERVENTION TYPE:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
}

// Main
const args = process.argv.slice(2);
const command = args[0] || 'audit';

switch (command) {
  case 'audit':
    await auditDataQuality();
    break;
  case 'seed':
    await seedDetentionCentres();
    break;
  case 'reprocess':
    const limit = parseInt(args[1]) || 50;
    await reprocessExisting(limit);
    break;
  default:
    console.log(`
ALMA Enhanced Extraction

Commands:
  audit      - Check data quality and find issues
  seed       - Add all known detention centres
  reprocess  - Re-extract from existing raw content (with limit)

Examples:
  node scripts/alma-enhanced-extraction.mjs audit
  node scripts/alma-enhanced-extraction.mjs seed
  node scripts/alma-enhanced-extraction.mjs reprocess 100
`);
}
