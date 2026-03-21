#!/usr/bin/env node
/**
 * scrape-qld-yj-programs.mjs
 *
 * Scrapes QLD youth justice program funding from multiple sources:
 * 1. DYJVS Contract Disclosure Reports (monthly CSVs) — contracts >$10K
 * 2. Ministerial media statements — program announcements with dollar figures
 * 3. Budget SDS program-level spending (hardcoded from PDFs)
 * 4. data.qld.gov.au datasets — conferencing referrals, centre locations
 * 5. AIHW Appendix D — program listings
 *
 * Usage: node scripts/scrape-qld-yj-programs.mjs [mode]
 *   modes: all, contracts, budget, programs, conferencing
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mode = process.argv[2] || 'all';
const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

console.log(`╔══════════════════════════════════════════════════╗`);
console.log(`║  QLD Youth Justice Program Scraper               ║`);
console.log(`║  Mode: ${mode.padEnd(42)}║`);
console.log(`╚══════════════════════════════════════════════════╝`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 1: DYJVS Contract Disclosure Reports
// Monthly CSVs of all government contracts >$10K
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONTRACT_URLS = [
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-nov-2025.csv', period: 'Nov 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-oct-2025.csv', period: 'Oct 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-sep-2025.csv', period: 'Sep 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-aug-2025.csv', period: 'Aug 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-jul-2025.csv', period: 'Jul 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-jun-25.csv', period: 'Jun 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-may-25.csv', period: 'May 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-vs-contract-disclosure-nov-24-apr-25.csv', period: 'Nov 2024-Apr 2025' },
  { url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-contract-disclosure-ss-jul-nov-2025.csv', period: 'Social Services Jul-Nov 2025' },
];

async function scrapeContracts() {
  console.log('\n══════ SOURCE 1: DYJVS CONTRACT DISCLOSURES ══════');

  let totalInserted = 0;

  for (const { url, period } of CONTRACT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  [SKIP] ${period} — HTTP ${res.status}`);
        continue;
      }

      const text = await res.text();
      let records;
      try {
        records = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true });
      } catch (e) {
        console.log(`  [SKIP] ${period} — CSV parse error: ${e.message}`);
        continue;
      }

      console.log(`  [CSV] ${period}: ${records.length} contracts`);

      let inserted = 0;
      for (const row of records) {
        // Actual CSV columns: "Supplier name", " Contract value ", "Supplier ABN", "Contract description/name", "Contract category group", "Award contract date", "Contract reference number"
        const supplierName = row['Supplier name'] || row['Supplier'] || '';
        const abn = row['Supplier ABN'] || row['ABN'] || '';
        const description = row['Contract description/name'] || row['Description'] || '';
        const valueStr = row[' Contract value '] || row['Contract value'] || '';
        const category = row['Contract category group'] || row['Category'] || '';
        const contractRef = row['Contract reference number'] || '';

        // Parse dollar amount
        const amount = parseFloat(String(valueStr).replace(/[$,\s]/g, ''));
        if (!supplierName || isNaN(amount) || amount <= 0) continue;

        // Determine financial year from period or start date
        let fy = '2024-25';
        if (period.includes('2025') && !period.includes('2024')) fy = '2025-26';

        const record = {
          source: 'dyjvs-contracts',
          source_url: url,
          source_statement_id: contractRef || `${supplierName}-${amount}-${period}`.substring(0, 200),
          recipient_name: supplierName.trim(),
          recipient_abn: abn.replace(/\s/g, ''),
          program_name: category || 'DYJVS Contract',
          program_round: description.substring(0, 500),
          amount_dollars: amount,
          state: 'QLD',
          funding_type: 'contract',
          sector: 'youth_justice',
          project_description: description.substring(0, 2000),
          financial_year: fy,
        };

        // Check if already exists
        const { count } = await supabase.from('justice_funding')
          .select('*', { count: 'exact', head: true })
          .eq('source', record.source)
          .eq('source_statement_id', record.source_statement_id);
        if (count > 0) continue;

        const { error } = await supabase.from('justice_funding').insert(record);

        if (!error) inserted++;
      }

      totalInserted += inserted;
      console.log(`  → Inserted ${inserted} new contracts from ${period}`);

    } catch (e) {
      console.log(`  [ERROR] ${period}: ${e.message}`);
    }

    await SLEEP(500);
  }

  console.log(`  CONTRACTS TOTAL: ${totalInserted} new records`);
  return totalInserted;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 2: Budget SDS Program Spending (extracted from PDFs)
// These are departmental appropriations NOT captured in QGIP grants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BUDGET_PROGRAMS = [
  // From 2025-26 SDS (DYJVS) — current Crisafulli LNP government
  {
    program_name: 'Circuit Breaker Sentencing',
    amount_dollars: 80000000,
    financial_year: '2025-26',
    project_description: '$80 million over 4 years for court-ordered intensive youth rehabilitation as alternative to detention. Two remote facilities (North and South QLD), capacity up to 60 youth offenders. Delivery commencing 2026.',
    source_url: 'https://budget.qld.gov.au/files/Budget-2025-26-SDS-Department-of-Youth-Justice-and-Victim-Support.pdf',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 20000000,
  },
  {
    program_name: 'Youth Co-Responder Teams',
    amount_dollars: 78100000,
    financial_year: '2024-25',
    project_description: '$78.1 million over 4 years for extending and expanding joint Youth Justice / QLD Police Service co-responder patrols. Teams pair youth justice officers with police for after-hours engagement.',
    source_url: 'https://www.treasury.qld.gov.au/files/Budget_2024-25_SDS_Youth_Justice.pdf',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice / QLD Police Service',
    per_year: 19525000,
  },
  {
    program_name: 'Kickstarter Grants',
    amount_dollars: 50000000,
    financial_year: '2025-26',
    project_description: '$50 million over 4 years for Kickstarter grants (up to $300K each) as part of $100 million Gold Standard Early Intervention investment. Crime-prevention programs for at-risk youth.',
    source_url: 'https://statements.qld.gov.au/statements/102352',
    funding_type: 'grants_program',
    recipient_name: 'Multiple community organisations (grants program)',
    per_year: 12500000,
  },
  {
    program_name: 'Gold Standard Early Intervention',
    amount_dollars: 100000000,
    financial_year: '2025-26',
    project_description: '$100 million investment to deliver Gold Standard Early Intervention through crime-prevention programs. Includes $50M Kickstarter grants component.',
    source_url: 'https://statements.qld.gov.au/statements/102352',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 25000000,
  },
  {
    program_name: 'Transition 2 Success (T2S)',
    amount_dollars: 28700000,
    financial_year: '2024-25',
    project_description: '$28.7 million over 4 years to expand T2S program. Includes $1.2M TAFE Queensland partnership. ROI: every $1 spent delivers $2.13 in benefits (avoided crime, custody, supervision costs).',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/initiatives/transition-to-success',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice / TAFE Queensland',
    per_year: 7175000,
  },
  {
    program_name: 'Intensive Bail Initiative (departmental)',
    amount_dollars: 25400000,
    financial_year: '2024-25',
    project_description: '$25.4 million over 4 years for Intensive Bail Initiative targeting repeat offenders with complex needs. Supplements NGO-delivered bail support.',
    source_url: 'https://www.treasury.qld.gov.au/files/Budget_2024-25_SDS_Youth_Justice.pdf',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice',
    per_year: 6350000,
  },
  {
    program_name: 'Diversionary Programs (total allocation)',
    amount_dollars: 189500000,
    financial_year: '2023-24',
    project_description: '$189.5 million over 5 years for intervention and diversionary programs. Includes youth justice conferencing, CYRD, cultural mentoring, flexischool bridging, sport diversion.',
    source_url: 'https://statements.qld.gov.au/statements/97933',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice',
    per_year: 37900000,
  },
  {
    program_name: 'Intensive Case Management',
    amount_dollars: 38800000,
    financial_year: '2025-26',
    project_description: '$38.8 million over 4 years for Intensive Case Management providing tailored, evidence-based support to high-risk youth including serious repeat offenders.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 9700000,
  },
  {
    program_name: 'Bail Programs Expansion',
    amount_dollars: 24400000,
    financial_year: '2025-26',
    project_description: '$24.4 million over 4 years and $8.3 million ongoing for bail programs to better support compliance by youth.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 6100000,
  },
  {
    program_name: 'Staying On Track Rehabilitation',
    amount_dollars: 225000000,
    financial_year: '2025-26',
    project_description: '$225 million for new Staying On Track rehabilitation program — intensive rehabilitation for 12 months after detention.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 56250000,
  },
  {
    program_name: 'Victim Liaison Service',
    amount_dollars: 11600000,
    financial_year: '2025-26',
    project_description: '$11.6 million to strengthen Victim Liaison Service within youth justice system.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 2900000,
  },
  {
    program_name: 'Victims Advocate Service',
    amount_dollars: 50000000,
    financial_year: '2025-26',
    project_description: '$50 million over 5 years ($10 million annually) for establishment of new Victims Advocate Service.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 10000000,
  },
  // Detention infrastructure (from 2024-25 SDS)
  {
    program_name: 'Woodford Youth Detention Centre',
    amount_dollars: 224200000,
    financial_year: '2024-25',
    project_description: '$224.2 million over 4 years for establishment and operation of Woodford Youth Detention Centre.',
    source_url: 'https://www.treasury.qld.gov.au/files/Budget_2024-25_SDS_Youth_Justice.pdf',
    funding_type: 'capital',
    recipient_name: 'Department of Youth Justice',
    per_year: 56050000,
  },
  {
    program_name: 'Wacol Youth Remand Centre',
    amount_dollars: 94000000,
    financial_year: '2024-25',
    project_description: '$94 million over 3 years to operate Wacol Youth Remand Centre.',
    source_url: 'https://www.treasury.qld.gov.au/files/Budget_2024-25_SDS_Youth_Justice.pdf',
    funding_type: 'capital',
    recipient_name: 'Department of Youth Justice',
    per_year: 31333333,
  },
  {
    program_name: 'Watchhouse Youth Support',
    amount_dollars: 17700000,
    financial_year: '2024-25',
    project_description: '$17.7 million over 2 years to support young people in watchhouses and support build of Woodford and Cairns youth detention centres.',
    source_url: 'https://www.treasury.qld.gov.au/files/Budget_2024-25_SDS_Youth_Justice.pdf',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice',
    per_year: 8850000,
  },
  {
    program_name: 'Electronic Monitoring Program',
    amount_dollars: 0, // Amount not disclosed separately
    financial_year: '2025-26',
    project_description: 'Major expansion of electronic monitoring across Queensland for high-risk youth offenders.',
    source_url: 'https://statements.qld.gov.au/statements/101546',
    funding_type: 'appropriation',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 0,
  },
  // From 2023-24 record budget ($396.5M)
  {
    program_name: 'Total Youth Justice Budget 2023-24',
    amount_dollars: 396500000,
    financial_year: '2023-24',
    project_description: 'Record $396.5 million youth justice budget. Includes community programs, detention operations, diversionary programs, and infrastructure.',
    source_url: 'https://statements.qld.gov.au/statements/97933',
    funding_type: 'total_budget',
    recipient_name: 'Department of Youth Justice',
    per_year: 396500000,
  },
  {
    program_name: 'Total Youth Justice Budget 2025-26',
    amount_dollars: 343000000,
    financial_year: '2025-26',
    project_description: '$343 million administered budget for Department of Youth Justice and Victim Support.',
    source_url: 'https://budget.qld.gov.au/files/Budget-2025-26-SDS-Department-of-Youth-Justice-and-Victim-Support.pdf',
    funding_type: 'total_budget',
    recipient_name: 'Department of Youth Justice and Victim Support',
    per_year: 343000000,
  },
];

async function insertBudgetPrograms() {
  console.log('\n══════ SOURCE 2: BUDGET SDS PROGRAM SPENDING ══════');

  let inserted = 0;

  for (const prog of BUDGET_PROGRAMS) {
    if (prog.amount_dollars <= 0) continue;

    const record = {
      source: 'qld-budget-sds',
      source_url: prog.source_url,
      source_statement_id: `${prog.program_name}-${prog.financial_year}`,
      recipient_name: prog.recipient_name,
      program_name: prog.program_name,
      amount_dollars: prog.per_year || prog.amount_dollars,
      state: 'QLD',
      funding_type: prog.funding_type,
      sector: 'youth_justice',
      project_description: prog.project_description,
      financial_year: prog.financial_year,
    };

    // Check if already exists
    const { count } = await supabase.from('justice_funding')
      .select('*', { count: 'exact', head: true })
      .eq('source', record.source)
      .eq('source_statement_id', record.source_statement_id);

    if (count > 0) {
      console.log(`  [EXISTS] ${prog.program_name}`);
      continue;
    }

    const { error } = await supabase.from('justice_funding').insert(record);

    if (error) {
      console.log(`  [ERROR] ${prog.program_name}: ${error.message}`);
    } else {
      inserted++;
      console.log(`  ✓ ${prog.program_name} — $${(prog.per_year || prog.amount_dollars).toLocaleString()}/yr (${prog.financial_year})`);
    }
  }

  console.log(`  BUDGET PROGRAMS: ${inserted} records inserted`);
  return inserted;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 3: Known QLD YJ Programs (from AIHW Appendix D + DYJ website)
// These are programs that exist but may not have public $ figures
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const KNOWN_PROGRAMS = [
  {
    name: 'Youth Justice Conferencing',
    type: 'Diversion',
    description: 'Restorative justice conferences for youth offenders — meeting between offender and those affected by crime. Facilitated by trained convenors. Alternative to court.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Department of Youth Justice and Victim Support',
  },
  {
    name: 'Community Youth Response and Diversion (CYRD)',
    type: 'Diversion',
    description: 'Community-based diversionary services including after-hours engagement, cultural mentoring, sport diversion, and bridging to flexischool. Delivered across multiple QLD locations.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Multiple NGO providers',
  },
  {
    name: 'Transition 2 Success (T2S)',
    type: 'Education/Employment',
    description: 'Education and employment program partnering with TAFE Queensland. Helps at-risk young people re-engage with education or find employment. ROI: $2.13 per $1 invested.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/initiatives/transition-to-success',
    org: 'Department of Youth Justice / TAFE Queensland',
  },
  {
    name: 'Youth Co-Responder Teams',
    type: 'Prevention',
    description: 'Joint QPS/Youth Justice patrols engaging at-risk youth after hours. Teams pair sworn police officers with youth justice case workers for proactive community engagement.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/initiatives/co-responder-teams',
    org: 'QLD Police Service / Department of Youth Justice',
  },
  {
    name: 'Kickstarter Grants Program',
    type: 'Prevention',
    description: 'Grants of up to $300,000 for community organisations delivering crime-prevention programs for at-risk youth. Part of Gold Standard Early Intervention investment.',
    source_url: 'https://www.youthjustice.qld.gov.au/partnerships/kickstarter-grants',
    org: 'Multiple community organisations',
  },
  {
    name: 'Circuit Breaker Sentencing',
    type: 'Therapeutic',
    description: 'Court-sentenced intensive youth rehabilitation as alternative to detention. Two remote residential facilities (North and South QLD), combined capacity 60 youth offenders.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/initiatives/circuit-breaker-sentencing',
    org: 'Department of Youth Justice and Victim Support',
  },
  {
    name: 'Intensive Bail Initiative (IBI)',
    type: 'Wraparound Support',
    description: 'Intensive case management and wraparound support for youth on bail. Targets repeat offenders with complex needs. Delivered by NGOs across 10+ QLD locations.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Multiple NGO providers (YAC, Anglicare, Kurbingui, TAIHS)',
  },
  {
    name: 'Intensive Case Management',
    type: 'Wraparound Support',
    description: 'Tailored, evidence-based support for high-risk youth including serious repeat offenders. $38.8M over 4 years.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    org: 'Department of Youth Justice and Victim Support',
  },
  {
    name: 'On Country Programs',
    type: 'Cultural Connection',
    description: 'Culturally-grounded programs taking Aboriginal and Torres Strait Islander young people on country for healing, cultural connection, and mentoring. Multiple locations including Mt Isa, FNQ.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Multiple Aboriginal community organisations',
  },
  {
    name: 'Staying On Track',
    type: 'Therapeutic',
    description: '$225 million rehabilitation program providing intensive support for 12 months after young people leave detention. Aims to prevent reoffending.',
    source_url: 'https://statements.qld.gov.au/statements/102882',
    org: 'Department of Youth Justice and Victim Support',
  },
  {
    name: 'Multi-Systemic Therapy (MST)',
    type: 'Therapeutic',
    description: 'Evidence-based family therapy for youth with serious antisocial behaviour. AIHW identifies MST as having strongest current evidence of effectiveness for reducing youth offending.',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/appendices/appendix-d-state-and-territory-systems',
    org: 'Life Without Barriers',
  },
  {
    name: 'Functional Family Therapy (FFT)',
    type: 'Therapeutic',
    description: 'Short-term family intervention for at-risk youth and families. Evidence-based model focusing on communication, parenting, and problem-solving.',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/appendices/appendix-d-state-and-territory-systems',
    org: 'Multiple providers',
  },
  {
    name: 'Murri Court',
    type: 'Community-Led',
    description: 'Specialist court for Aboriginal and Torres Strait Islander defendants. Elders and respected persons provide cultural authority and sentencing advice.',
    source_url: 'https://www.courts.qld.gov.au/courts/murri-court',
    org: 'Queensland Courts / Aboriginal Elders',
  },
  {
    name: 'Restorative Justice Programs',
    type: 'Diversion',
    description: 'Programs facilitating restorative processes between offenders and victims/community. Includes conferencing, mediation, and community-led justice responses.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Department of Youth Justice / Community organisations',
  },
  {
    name: 'Bail Support Services',
    type: 'Wraparound Support',
    description: 'Non-intensive bail support services delivered across QLD. Includes accommodation support, transport, and basic case management for youth on bail.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Multiple NGO providers',
  },
  {
    name: 'Community Safety Plans',
    type: 'Community-Led',
    description: 'Local community safety plans developed with Aboriginal and Torres Strait Islander communities. Funding for community-identified safety initiatives.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Aboriginal Shire Councils',
  },
  {
    name: 'Specialist Youth Justice Schools',
    type: 'Education/Employment',
    description: 'Dedicated schools for youth in the justice system. New schools announced for Logan and Cairns.',
    source_url: 'https://statements.qld.gov.au/statements/102999',
    org: 'Department of Education / Department of Youth Justice',
  },
  {
    name: 'Queensland Youth Partnership Initiative (QYPI)',
    type: 'Community-Led',
    description: 'Partnership initiative supporting community-led responses to youth justice issues across Queensland.',
    source_url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    org: 'Multiple community organisations',
  },
];

async function insertKnownPrograms() {
  console.log('\n══════ SOURCE 3: KNOWN QLD YJ PROGRAMS ══════');

  let inserted = 0;

  for (const prog of KNOWN_PROGRAMS) {
    // Insert as ALMA intervention if not already there
    const { data: existing } = await supabase
      .from('alma_interventions')
      .select('id')
      .ilike('name', prog.name)
      .neq('verification_status', 'ai_generated')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  [EXISTS] ${prog.name}`);
      continue;
    }

    // Determine geography
    let geography = ['QLD'];
    if (prog.description.includes('Mt Isa')) geography.push('Mt Isa');
    if (prog.description.includes('Townsville')) geography.push('Townsville');
    if (prog.description.includes('Cairns')) geography.push('Cairns');
    if (prog.description.includes('Logan')) geography.push('Logan');

    const { error } = await supabase.from('alma_interventions').insert({
      name: prog.name,
      type: prog.type,
      description: prog.description,
      geography: geography,
      operating_organization: prog.org,
      source_documents: [prog.source_url],
      verification_status: 'verified',
      consent_level: 'Public Knowledge Commons',
      evidence_level: 'Promising (community-endorsed, emerging evidence)',
    });

    if (error) {
      console.log(`  [ERROR] ${prog.name}: ${error.message}`);
    } else {
      inserted++;
      console.log(`  ✓ ${prog.name} (${prog.type})`);
    }
  }

  console.log(`  PROGRAMS: ${inserted} new interventions inserted`);
  return inserted;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE 4: Youth Justice Conferencing Referrals (data.qld.gov.au)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeConferencingData() {
  console.log('\n══════ SOURCE 4: YJ CONFERENCING REFERRALS ══════');

  try {
    // Get the dataset info from CKAN
    const res = await fetch('https://www.data.qld.gov.au/api/3/action/package_show?id=youth-justice-referrals-to-youth-justice-conferencing');
    const data = await res.json();
    const pkg = data.result;

    console.log(`  Dataset: ${pkg.title}`);
    console.log(`  Resources: ${pkg.resources?.length || 0}`);

    let totalRecords = 0;

    for (const resource of (pkg.resources || [])) {
      if (resource.format !== 'CSV') continue;

      try {
        const csvRes = await fetch(resource.url);
        if (!csvRes.ok) continue;

        const text = await csvRes.text();
        const records = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true });

        console.log(`  [CSV] ${resource.name}: ${records.length} rows`);
        totalRecords += records.length;

        // Store as research findings
        for (const row of records) {
          const finding = {
            source: 'data.qld.gov.au',
            finding_type: 'external_source',
            title: `YJ Conferencing: ${Object.values(row).slice(0, 3).join(' — ')}`,
            content: JSON.stringify(row),
            source_url: resource.url,
          };

          const { error } = await supabase.from('alma_research_findings').insert(finding);
          if (error && error.code !== '23505') console.log('  [WARN]', error.message);
        }

      } catch (e) {
        console.log(`  [ERROR] ${resource.name}: ${e.message}`);
      }

      await SLEEP(500);
    }

    console.log(`  CONFERENCING: ${totalRecords} data rows processed`);
    return totalRecords;

  } catch (e) {
    console.log(`  [ERROR] ${e.message}`);
    return 0;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const results = {};

if (mode === 'all' || mode === 'contracts') {
  results.contracts = await scrapeContracts();
}

if (mode === 'all' || mode === 'budget') {
  results.budget = await insertBudgetPrograms();
}

if (mode === 'all' || mode === 'programs') {
  results.programs = await insertKnownPrograms();
}

if (mode === 'all' || mode === 'conferencing') {
  results.conferencing = await scrapeConferencingData();
}

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log(`║                  FINAL RESULTS                   ║`);
console.log(`╠══════════════════════════════════════════════════╣`);
for (const [key, val] of Object.entries(results)) {
  console.log(`║  ${key.padEnd(25)} ${String(val).padStart(5)} items    ║`);
}
const total = Object.values(results).reduce((a, b) => a + b, 0);
console.log(`╠══════════════════════════════════════════════════╣`);
console.log(`║  TOTAL                     ${String(total).padStart(5)} items    ║`);
console.log(`╚══════════════════════════════════════════════════╝`);
