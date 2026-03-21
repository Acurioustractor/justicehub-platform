#!/usr/bin/env node
/**
 * Populate lga_cross_system_stats table
 *
 * Aggregates from existing data:
 * - postcode_geo → LGA reference (491 LGAs)
 * - seifa_2021 + postcode_geo → SEIFA by LGA
 * - youth_detention_facilities → detention beds by LGA (manual postcode mapping)
 * - organizations + gs_entities + justice_funding → funding by LGA
 * - crime_stats_lga → crime rates (NSW only)
 *
 * Pipeline Intensity Score:
 *   school 25% + welfare 25% + justice 35% + demographics 15%
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Known detention facility postcodes (manually researched)
const FACILITY_POSTCODES = {
  'Bimberi Youth Justice Centre': '2913',         // Mitchell, ACT
  'Reiby Juvenile Justice Centre': '2232',         // Airds, NSW
  'Riverina Juvenile Justice Centre': '2650',      // Wagga Wagga, NSW
  'Orana Juvenile Justice Centre': '2830',         // Dubbo, NSW
  'Acmena Juvenile Justice Centre': '2541',        // South Nowra, NSW
  'Cobham Juvenile Justice Centre': '2170',        // Werrington, NSW
  'Frank Baxter Juvenile Justice Centre': '2263',  // Kariong, NSW
  'Alice Springs Youth Detention Centre': '0870',  // Alice Springs, NT
  'Don Dale Youth Detention Centre': '0820',       // Berrimah, NT
  'Holtze Youth Detention Centre': '0829',         // Holtze, NT
  'Brisbane Youth Detention Centre': '4110',       // Wacol, QLD
  'Cleveland Youth Detention Centre': '4811',      // Townsville, QLD
  'West Moreton Youth Detention Centre': '4305',   // Wacol/Ipswich, QLD
  'Kurlana Tapa Youth Justice Centre': '5031',     // Cavan, SA
  'Ashley Youth Detention Centre': '7250',         // Deloraine, TAS
  'Malmsbury Youth Justice Centre': '3446',        // Malmsbury, VIC
  'Cherry Creek Youth Justice Centre': '3805',     // Narre Warren, VIC
  'Parkville Youth Justice Centre': '3052',        // Parkville, VIC
  'Banksia Hill Detention Centre': '6167',         // Canning Vale, WA
};

async function sql(query) {
  const { data, error } = await supabase.rpc('exec_sql', { query });
  if (error) throw new Error(`SQL error: ${error.message}\nQuery: ${query.slice(0, 200)}`);
  return data || [];
}

async function main() {
  console.log('=== Populating lga_cross_system_stats ===\n');

  // 1. Get all unique LGAs from postcode_geo
  console.log('1. Loading LGA reference from postcode_geo...');
  const lgas = await sql(`
    SELECT DISTINCT lga_code, lga_name,
      (SELECT pg2.state FROM postcode_geo pg2 WHERE pg2.lga_code = pg.lga_code AND pg2.state IS NOT NULL LIMIT 1) as state
    FROM postcode_geo pg
    WHERE lga_code IS NOT NULL AND lga_name IS NOT NULL
    ORDER BY lga_name
  `);
  // Filter out any without state
  const lgasFiltered = lgas.filter(l => l.state);
  console.log(`   Found ${lgas.length} LGAs (${lgasFiltered.length} with state)`);


  // 2. SEIFA by LGA (aggregate from postcode-level)
  console.log('2. Aggregating SEIFA scores by LGA...');
  const seifaByLga = await sql(`
    SELECT pg.lga_code,
      ROUND(AVG(s.score)) as avg_irsd_score,
      ROUND(AVG(s.decile_national)) as avg_decile
    FROM seifa_2021 s
    JOIN postcode_geo pg ON pg.postcode = s.postcode
    WHERE s.index_type = 'IRSD' AND pg.lga_code IS NOT NULL
    GROUP BY pg.lga_code
  `);
  const seifaMap = Object.fromEntries(seifaByLga.map(r => [r.lga_code, r]));
  console.log(`   SEIFA data for ${seifaByLga.length} LGAs`);

  // 3. Detention facilities by LGA
  console.log('3. Mapping detention facilities to LGAs...');
  const facilities = await sql(`SELECT name, state, capacity_beds, operational_status, indigenous_population_percentage FROM youth_detention_facilities`);

  // Map facility postcodes → LGA codes
  const facilityPostcodes = Object.values(FACILITY_POSTCODES);
  const postcodeToLga = await sql(`
    SELECT DISTINCT postcode, lga_code, lga_name
    FROM postcode_geo
    WHERE postcode IN (${facilityPostcodes.map(p => `'${p}'`).join(',')})
  `);
  const pcToLga = Object.fromEntries(postcodeToLga.map(r => [r.postcode, r.lga_code]));

  const detentionByLga = {};
  for (const f of facilities) {
    const pc = FACILITY_POSTCODES[f.name];
    const lgaCode = pc ? pcToLga[pc] : null;
    if (lgaCode) {
      if (!detentionByLga[lgaCode]) detentionByLga[lgaCode] = { beds: 0, count: 0, indigenous_pct_sum: 0, indigenous_count: 0 };
      detentionByLga[lgaCode].beds += f.capacity_beds || 0;
      detentionByLga[lgaCode].count += 1;
      if (f.indigenous_population_percentage) {
        detentionByLga[lgaCode].indigenous_pct_sum += parseFloat(f.indigenous_population_percentage);
        detentionByLga[lgaCode].indigenous_count += 1;
      }
    } else {
      console.log(`   ⚠ Could not map facility: ${f.name} (pc: ${pc})`);
    }
  }
  console.log(`   Mapped ${Object.keys(detentionByLga).length} LGAs with detention facilities`);

  // 4. Justice funding by LGA — two-step to avoid timeout
  console.log('4. Aggregating justice funding by LGA...');

  // Step 4: Funding by LGA — use Supabase client to avoid exec_sql timeout
  console.log('4. Aggregating justice funding by LGA...');

  // 4a: Get postcode→LGA lookup (already have this from postcode_geo)
  const pcToLgaAll = await sql(`
    SELECT DISTINCT postcode, lga_code FROM postcode_geo WHERE lga_code IS NOT NULL
  `);
  const postcodeLgaMap = {};
  for (const r of pcToLgaAll) postcodeLgaMap[r.postcode] = r.lga_code;
  console.log(`   ${Object.keys(postcodeLgaMap).length} postcodes mapped to LGAs`);

  // 4b: Get org postcodes via gs_entities (paginated via Supabase client)
  const fundingMap = {};
  let page = 0;
  const pageSize = 1000;
  let totalOrgs = 0;
  while (true) {
    const { data: orgBatch, error: orgErr } = await supabase
      .from('gs_entities')
      .select('id, postcode')
      .not('postcode', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (orgErr) throw new Error(`gs_entities query: ${orgErr.message}`);
    if (!orgBatch || orgBatch.length === 0) break;

    for (const gs of orgBatch) {
      const lgaCode = postcodeLgaMap[gs.postcode];
      if (lgaCode) {
        if (!fundingMap[lgaCode]) fundingMap[lgaCode] = { total_funding: 0, org_count: 0 };
        fundingMap[lgaCode].org_count += 1;
      }
    }
    totalOrgs += orgBatch.length;
    page++;
    if (orgBatch.length < pageSize) break;
  }
  console.log(`   ${totalOrgs} gs_entities with postcodes, ${Object.keys(fundingMap).length} LGAs`);

  // 4c: Get funding by state (fast aggregate)
  const fundingByState = await sql(`
    SELECT o.state, SUM(jf.amount_dollars)::bigint as total_funding
    FROM justice_funding jf
    JOIN organizations o ON o.id = jf.alma_organization_id
    WHERE jf.amount_dollars > 0 AND o.state IS NOT NULL
    GROUP BY o.state
  `);
  console.log(`   Funding by state: ${fundingByState.map(r => `${r.state}=$${(parseInt(r.total_funding)/1e6).toFixed(0)}M`).join(', ')}`);

  // Distribute state funding proportionally across LGAs by org count
  const stateOrgTotals = {};
  for (const lga of lgasFiltered) {
    const f = fundingMap[lga.lga_code];
    if (f && lga.state) {
      stateOrgTotals[lga.state] = (stateOrgTotals[lga.state] || 0) + f.org_count;
    }
  }
  const stateFundingLookup = Object.fromEntries(fundingByState.map(r => [r.state, parseInt(r.total_funding)]));
  for (const lga of lgasFiltered) {
    const f = fundingMap[lga.lga_code];
    if (f && lga.state && stateFundingLookup[lga.state] && stateOrgTotals[lga.state]) {
      f.total_funding = Math.round(stateFundingLookup[lga.state] * (f.org_count / stateOrgTotals[lga.state]));
    }
  }
  console.log(`   Funding distributed across ${Object.keys(fundingMap).length} LGAs`);

  // 5. Crime stats by LGA (NSW only — aggregate "The major offences")
  console.log('5. Loading crime stats by LGA (NSW)...');
  const crimeByLga = await sql(`
    SELECT lga_name,
      SUM(incidents) as total_incidents,
      AVG(rate_per_100k) as avg_rate
    FROM crime_stats_lga
    WHERE offence_group = 'The major offences'
    GROUP BY lga_name
  `);
  // Match by name since crime_stats_lga doesn't have lga_code
  const crimeByName = Object.fromEntries(crimeByLga.map(r => [r.lga_name.toLowerCase(), r]));
  console.log(`   Crime data for ${crimeByLga.length} NSW LGAs`);

  // 6. Build rows and compute pipeline intensity
  console.log('\n6. Computing pipeline intensity scores...');

  const rows = [];
  for (const lga of lgasFiltered) {
    const seifa = seifaMap[lga.lga_code] || {};
    const detention = detentionByLga[lga.lga_code] || {};
    const funding = fundingMap[lga.lga_code] || { total_funding: 0, org_count: 0 };
    const crime = crimeByName[lga.lga_name.toLowerCase()] || {};

    // Pipeline intensity calculation
    // School: inverse of SEIFA decile (lower decile = more disadvantaged = higher score)
    const schoolScore = seifa.avg_decile ? ((10 - seifa.avg_decile) / 10) * 100 : null;

    // Justice: based on detention presence + crime rate
    let justiceScore = 0;
    if (detention.beds > 0) justiceScore += 50; // detention facility present
    if (crime.avg_rate > 0) justiceScore += Math.min(50, (crime.avg_rate / 100) * 50); // crime rate contribution

    // Funding gap: high org count but low funding = worse
    const fundingGapScore = funding.org_count > 0 && funding.total_funding > 0
      ? Math.max(0, 50 - (funding.total_funding / funding.org_count / 100000) * 50)
      : null;

    // Composite: school 25%, welfare/funding 25%, justice 35%, demographics 15%
    const components = [];
    if (schoolScore !== null) components.push({ weight: 0.40, score: schoolScore }); // school+welfare combined
    if (justiceScore > 0) components.push({ weight: 0.35, score: justiceScore });
    if (fundingGapScore !== null) components.push({ weight: 0.25, score: fundingGapScore });

    let pipeline_intensity = null;
    if (components.length > 0) {
      const totalWeight = components.reduce((s, c) => s + c.weight, 0);
      pipeline_intensity = Math.round(
        components.reduce((s, c) => s + (c.score * c.weight / totalWeight), 0) * 10
      ) / 10;
    }

    rows.push({
      lga_code: lga.lga_code,
      lga_name: lga.lga_name,
      state: lga.state,
      avg_icsea: seifa.avg_irsd_score || null,
      detention_beds: detention.beds || 0,
      detention_facility_count: detention.count || 0,
      jh_funding_tracked: parseInt(funding.total_funding) || 0,
      jh_org_count: funding.org_count || 0,
      youth_offenders: crime.total_incidents ? parseInt(crime.total_incidents) : 0,
      youth_offender_rate: crime.avg_rate ? parseFloat(crime.avg_rate).toFixed(2) : null,
      pipeline_intensity,
    });
  }

  // Deduplicate by lga_code (postcode_geo can have multiple entries per LGA)
  const deduped = Object.values(
    rows.reduce((acc, r) => { acc[r.lga_code] = r; return acc; }, {})
  );

  // Sort by pipeline intensity (highest first)
  deduped.sort((a, b) => (b.pipeline_intensity || 0) - (a.pipeline_intensity || 0));
  const rows_final = deduped;

  console.log(`   Top 10 Pipeline Intensity LGAs (${rows_final.length} unique):`);
  rows_final.slice(0, 10).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.lga_name} (${r.state}): ${r.pipeline_intensity} — beds: ${r.detention_beds}, funding: $${(r.jh_funding_tracked / 1e6).toFixed(1)}M, orgs: ${r.jh_org_count}`);
  });

  // 7. Insert into table
  console.log(`\n7. Inserting ${rows_final.length} LGA rows...`);

  // Upsert via Supabase client (exec_sql doesn't support INSERT/DELETE)
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows_final.length; i += batchSize) {
    const batch = rows_final.slice(i, i + batchSize).map(r => ({
      lga_code: r.lga_code,
      lga_name: r.lga_name,
      state: r.state,
      avg_icsea: r.avg_icsea || null,
      detention_beds: r.detention_beds,
      detention_facility_count: r.detention_facility_count,
      youth_offenders: r.youth_offenders,
      youth_offender_rate: r.youth_offender_rate || null,
      jh_funding_tracked: r.jh_funding_tracked,
      jh_org_count: r.jh_org_count,
      pipeline_intensity: r.pipeline_intensity || null,
      sources: { seifa: 'ABS SEIFA 2021', crime: 'BOCSAR NSW', detention: 'AIHW/JusticeHub', funding: 'JusticeHub DB' },
    }));

    const { error } = await supabase.from('lga_cross_system_stats').upsert(batch, { onConflict: 'lga_code' });
    if (error) throw new Error(`Upsert batch ${i}: ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`   ${inserted}/${rows_final.length}\r`);
  }

  console.log(`\n   ✓ Upserted ${inserted} rows`);

  // 8. Summary stats
  const summary = await sql(`
    SELECT
      COUNT(*) as total_lgas,
      COUNT(CASE WHEN detention_beds > 0 THEN 1 END) as lgas_with_detention,
      COUNT(CASE WHEN jh_funding_tracked > 0 THEN 1 END) as lgas_with_funding,
      COUNT(CASE WHEN youth_offenders > 0 THEN 1 END) as lgas_with_crime,
      COUNT(CASE WHEN pipeline_intensity IS NOT NULL THEN 1 END) as lgas_with_score,
      ROUND(AVG(pipeline_intensity), 1) as avg_intensity,
      MAX(pipeline_intensity) as max_intensity
    FROM lga_cross_system_stats
  `);

  console.log('\n=== Summary ===');
  const s = summary[0];
  console.log(`Total LGAs: ${s.total_lgas}`);
  console.log(`With detention facilities: ${s.lgas_with_detention}`);
  console.log(`With JH funding data: ${s.lgas_with_funding}`);
  console.log(`With crime data: ${s.lgas_with_crime}`);
  console.log(`With pipeline score: ${s.lgas_with_score}`);
  console.log(`Avg intensity: ${s.avg_intensity} | Max: ${s.max_intensity}`);
}

main().catch(e => { console.error(e); process.exit(1); });
