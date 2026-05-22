#!/usr/bin/env node
/**
 * Seed AU youth detention centres as first-class organizations rows.
 *
 * Source: src/lib/organizations/fallback-detention-centres.ts (the
 * canonical curated list). This script mirrors that data into the DB
 * so the civic page can render detention beside the community-based
 * Tier 1 universe and the cost comparison (community vs detention) has
 * structural data to lean on.
 *
 * Idempotent on slug. Re-run safe — updates fields that change
 * (capacity, status) without duplicating rows.
 *
 * Each row gets:
 *   - organizations.type = 'detention_centre'
 *   - organizations.is_active = true
 *   - organizations.acnc_data.detention_meta = { capacity_beds, security_level,
 *       government_department, operational_status }
 *   - A civic_org_classifications row with sector_category = 'government',
 *     tier = null (detention isn't Tier 1 by definition), confirmed_at = now,
 *     override_reason = 'detention_centre_seed'
 *
 * Usage:
 *   node scripts/civic/seed-detention-centres.mjs               # dry-run
 *   node scripts/civic/seed-detention-centres.mjs --apply       # write
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const apply = process.argv.includes('--apply');

// Canonical list — kept in sync with src/lib/organizations/fallback-detention-centres.ts.
// Capacity figures are operational bed numbers at last AIHW publication;
// daily population is typically below capacity. Security level mapping:
// maximum = high-security, all-purpose; medium = lower-classification.
const FACILITIES = [
  { slug: 'brisbane-youth-detention-centre', name: 'Brisbane Youth Detention Centre', city: 'Wacol', state: 'QLD', lat: -27.5945, lng: 152.9339, capacity: 96, dept: 'Department of Youth Justice', security: 'maximum' },
  { slug: 'cleveland-youth-detention-centre', name: 'Cleveland Youth Detention Centre', city: 'Townsville', state: 'QLD', lat: -19.2590, lng: 146.8169, capacity: 48, dept: 'Department of Youth Justice', security: 'maximum' },
  { slug: 'cobham-juvenile-justice-centre', name: 'Cobham Juvenile Justice Centre', city: 'Werrington', state: 'NSW', lat: -33.7573, lng: 150.7533, capacity: 42, dept: 'Youth Justice NSW', security: 'maximum' },
  { slug: 'frank-baxter-juvenile-justice-centre', name: 'Frank Baxter Juvenile Justice Centre', city: 'Kariong', state: 'NSW', lat: -33.4386, lng: 151.2976, capacity: 120, dept: 'Youth Justice NSW', security: 'maximum' },
  { slug: 'reiby-juvenile-justice-centre', name: 'Reiby Juvenile Justice Centre', city: 'Airds', state: 'NSW', lat: -34.0819, lng: 150.8281, capacity: 60, dept: 'Youth Justice NSW', security: 'medium' },
  { slug: 'orana-juvenile-justice-centre', name: 'Orana Juvenile Justice Centre', city: 'Dubbo', state: 'NSW', lat: -32.2569, lng: 148.6011, capacity: 30, dept: 'Youth Justice NSW', security: 'medium' },
  { slug: 'acmena-juvenile-justice-centre', name: 'Acmena Juvenile Justice Centre', city: 'Grafton', state: 'NSW', lat: -29.6767, lng: 152.9370, capacity: 36, dept: 'Youth Justice NSW', security: 'medium' },
  { slug: 'parkville-youth-justice-centre', name: 'Parkville Youth Justice Centre', city: 'Parkville', state: 'VIC', lat: -37.7839, lng: 144.9490, capacity: 100, dept: 'Department of Justice and Community Safety', security: 'maximum' },
  { slug: 'malmsbury-youth-justice-centre', name: 'Malmsbury Youth Justice Centre', city: 'Malmsbury', state: 'VIC', lat: -37.1859, lng: 144.3743, capacity: 120, dept: 'Department of Justice and Community Safety', security: 'maximum' },
  { slug: 'banksia-hill-detention-centre', name: 'Banksia Hill Detention Centre', city: 'Canning Vale', state: 'WA', lat: -32.0766, lng: 115.9180, capacity: 240, dept: 'Department of Justice WA', security: 'maximum' },
  { slug: 'adelaide-youth-training-centre', name: 'Adelaide Youth Training Centre', city: 'Cavan', state: 'SA', lat: -34.8366, lng: 138.5977, capacity: 76, dept: 'Department of Human Services SA', security: 'maximum' },
  { slug: 'don-dale-youth-detention-centre', name: 'Don Dale Youth Detention Centre', city: 'Berrimah', state: 'NT', lat: -12.4308, lng: 130.9167, capacity: 36, dept: 'Territory Families', security: 'maximum' },
  { slug: 'alice-springs-youth-detention-centre', name: 'Alice Springs Youth Detention Centre', city: 'Alice Springs', state: 'NT', lat: -23.6980, lng: 133.8807, capacity: 24, dept: 'Territory Families', security: 'medium' },
  { slug: 'ashley-youth-detention-centre', name: 'Ashley Youth Detention Centre', city: 'Deloraine', state: 'TAS', lat: -41.5175, lng: 146.6503, capacity: 51, dept: 'Department of Communities Tasmania', security: 'medium' },
  { slug: 'bimberi-youth-justice-centre', name: 'Bimberi Youth Justice Centre', city: 'Mitchell', state: 'ACT', lat: -35.2093, lng: 149.1287, capacity: 40, dept: 'ACT Community Services', security: 'medium' },
];

async function upsertFacility(f) {
  // Match by slug — there's no unique constraint, so we use the manual
  // select-then-insert/update pattern.
  const { data: existing } = await supabase
    .from('organizations')
    .select('id, slug, name, acnc_data, type, is_active')
    .eq('slug', f.slug)
    .limit(1);
  const existingRow = existing && existing[0];

  const detentionMeta = {
    capacity_beds: f.capacity,
    security_level: f.security,
    government_department: f.dept,
    operational_status: 'operational',
    seeded_at: new Date().toISOString(),
  };

  const payload = {
    name: f.name,
    slug: f.slug,
    city: f.city,
    state: f.state,
    latitude: f.lat,
    longitude: f.lng,
    type: 'detention_centre',
    is_active: true,
    archived: false,
    description: `Government-operated youth detention facility (${f.security} security, ${f.capacity} bed capacity).`,
    acnc_data: { ...(existingRow?.acnc_data || {}), detention_meta: detentionMeta },
    updated_at: new Date().toISOString(),
  };

  if (!apply) {
    return existingRow ? { action: 'would_update', id: existingRow.id } : { action: 'would_insert' };
  }

  if (existingRow) {
    const { error } = await supabase
      .from('organizations')
      .update(payload)
      .eq('id', existingRow.id);
    if (error) throw new Error(`update failed: ${error.message}`);
    return { action: 'updated', id: existingRow.id };
  }

  const { data: inserted, error } = await supabase
    .from('organizations')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(`insert failed: ${error.message}`);
  return { action: 'inserted', id: inserted.id };
}

async function upsertClassification(orgId) {
  // Mark as confirmed government sector. Tier stays null because detention
  // is not Tier 1 (community-led frontline) by definition.
  const { data: existing } = await supabase
    .from('civic_org_classifications')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1);
  const row = existing && existing[0];

  const payload = {
    organization_id: orgId,
    sector_category: 'government',
    tier: null,
    confirmed_at: new Date().toISOString(),
    override_reason: 'detention_centre_seed',
    updated_at: new Date().toISOString(),
  };

  if (!apply) return { action: row ? 'would_update_class' : 'would_insert_class' };

  if (row) {
    const { error } = await supabase
      .from('civic_org_classifications')
      .update(payload)
      .eq('id', row.id);
    if (error) throw new Error(`class update: ${error.message}`);
    return { action: 'updated_class' };
  }

  const { error } = await supabase.from('civic_org_classifications').insert(payload);
  if (error) throw new Error(`class insert: ${error.message}`);
  return { action: 'inserted_class' };
}

async function main() {
  console.log(`Detention centre seed · ${apply ? 'APPLY' : 'DRY-RUN'} · ${FACILITIES.length} facilities\n`);
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  for (const f of FACILITIES) {
    try {
      const orgRes = await upsertFacility(f);
      if (orgRes.action === 'inserted' || orgRes.action === 'would_insert') inserted++;
      else updated++;
      const classRes = orgRes.id ? await upsertClassification(orgRes.id) : { action: 'skip' };
      console.log(`  ${f.slug.padEnd(40)} → ${orgRes.action}${classRes.action !== 'skip' ? ` + ${classRes.action}` : ''}`);
    } catch (e) {
      errors++;
      console.warn(`  ! ${f.slug}: ${e.message}`);
    }
  }
  console.log(`\n${inserted} inserted · ${updated} updated · ${errors} errors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
