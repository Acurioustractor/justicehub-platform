#!/usr/bin/env node
/**
 * Link verified government program delivery partners.
 * Sources: QLD Government statements, youthjustice.qld.gov.au, QTenders
 * Only creates links where we have government-confirmed evidence.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verified program → intervention links from government sources
const PROGRAM_LINKS = [
  // Staying on Track (fd07ea7f) — from statements.qld.gov.au/103190 and youthjustice.qld.gov.au
  { programId: 'fd07ea7f-bd83-438e-8a62-30c8eae93559', interventionName: '%Life Without Barriers%', source: 'statements.qld.gov.au/103190' },
  { programId: 'fd07ea7f-bd83-438e-8a62-30c8eae93559', interventionName: '%Anglicare Southern Queensland%', source: 'statements.qld.gov.au/103605' },
  { programId: 'fd07ea7f-bd83-438e-8a62-30c8eae93559', interventionName: '%54 Reasons%', source: 'statements.qld.gov.au/103605' },

  // Also link the duplicate "Staying on Track program" (b40cd6ed)
  { programId: 'b40cd6ed-73b4-4f7d-b796-9ee262d37654', interventionName: '%Staying On Track%', source: 'junction parity' },
  { programId: 'b40cd6ed-73b4-4f7d-b796-9ee262d37654', interventionName: '%Ted Noffs Staying%', source: 'junction parity' },

  // Regional Reset (5459d242) — from statements.qld.gov.au/103188
  { programId: '5459d242-4e44-41df-9bd5-9f7b10916294', interventionName: '%Regional Reset%Gold Coast%', source: 'statements.qld.gov.au/103188' },
  { programId: '5459d242-4e44-41df-9bd5-9f7b10916294', interventionName: '%Regional Reset%Mount Isa%', source: 'statements.qld.gov.au/103188' },
  { programId: '5459d242-4e44-41df-9bd5-9f7b10916294', interventionName: '%Regional Reset%Moreton%', source: 'statements.qld.gov.au/103188' },

  // Kickstarter Grants (38ba97dc) — from youthjustice.qld.gov.au/partnerships/kickstarter-grants
  { programId: '38ba97dc-2ebc-4f8d-bc6e-6679bb399a3f', interventionName: '%Kickstarter%Flame%', source: 'youthjustice.qld.gov.au/partnerships/kickstarter-grants' },
  { programId: '38ba97dc-2ebc-4f8d-bc6e-6679bb399a3f', interventionName: '%Kickstarter%Turning Point%', source: 'youthjustice.qld.gov.au/partnerships/kickstarter-grants' },
  { programId: '38ba97dc-2ebc-4f8d-bc6e-6679bb399a3f', interventionName: '%Kickstarter%Indigenous Mana%', source: 'youthjustice.qld.gov.au/partnerships/kickstarter-grants' },

  // Transition 2 Success (99e61a0b)
  { programId: '99e61a0b-c0dd-477c-8dea-78fbae1b1b54', interventionName: '%Transition 2 Success%', source: 'qld.gov.au/law/sentencing-prisons-and-probation/youth-justice-community-programs-and-services/t2s' },

  // Circuit Breaker (0a5fcecb)
  { programId: '0a5fcecb-b281-40ac-9eea-e4599ca27529', interventionName: '%Circuit Breaker%', source: 'youthjustice.qld.gov.au/programs-initiatives/initiatives/circuit-breaker-sentencing' },
];

// Orgs to create if missing
const MISSING_ORGS = [
  { name: 'Fearless Towards Success', state: 'QLD', description: 'Youth mentoring and support service in Ipswich/Inala/Somerset/Lockyer Valley. Contracted delivery partner for QLD Staying on Track program.' },
  { name: 'Music Beat Australia', state: 'QLD', description: 'Music-based youth engagement program. Kickstarter grant recipient from QLD Department of Youth Justice.' },
];

// Interventions to create for verified delivery contracts
const MISSING_INTERVENTIONS = [
  {
    name: 'Staying on Track — Life Without Barriers (Gold Coast)',
    description: 'Life Without Barriers delivers the Staying on Track post-detention rehabilitation program in the Gold Coast region under contract from the QLD Department of Youth Justice and Victim Support.',
    operating_organization: 'Life Without Barriers',
    orgSearch: '%Life Without Barriers%',
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    source_documents: 'https://statements.qld.gov.au/statements/103190',
  },
  {
    name: 'Staying on Track — Anglicare SQ (Ipswich/Inala/Somerset/Lockyer)',
    description: 'Anglicare Southern Queensland delivers the Staying on Track post-detention rehabilitation program in Ipswich, Inala, Somerset and Lockyer Valley regions.',
    operating_organization: 'Anglicare Southern Queensland',
    orgSearch: '%Anglicare Southern Queensland%',
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    source_documents: 'https://statements.qld.gov.au/statements/103605',
  },
  {
    name: 'Staying on Track — Village Support (Ipswich/Inala/Somerset/Lockyer)',
    description: 'Village Support Limited delivers components of the Staying on Track program in Ipswich, Inala, Somerset and Lockyer Valley regions.',
    operating_organization: 'VILLAGE SUPPORT LTD',
    orgSearch: '%Village Support%',
    evidence_level: 'Untested (theory/pilot stage)',
    source_documents: 'https://statements.qld.gov.au/statements/103605',
  },
  {
    name: 'Staying on Track — Fearless Towards Success (Ipswich/Inala/Somerset/Lockyer)',
    description: 'Fearless Towards Success delivers the Staying on Track post-detention rehabilitation program in Ipswich, Inala, Somerset and Lockyer Valley.',
    operating_organization: 'Fearless Towards Success',
    orgSearch: '%Fearless%',
    evidence_level: 'Untested (theory/pilot stage)',
    source_documents: 'https://statements.qld.gov.au/statements/103605',
  },
  {
    name: 'Staying on Track — 54 Reasons (Mount Isa)',
    description: '54 Reasons delivers the Staying on Track post-detention rehabilitation program in the Mount Isa region.',
    operating_organization: '54 Reasons',
    orgSearch: '%54 Reasons%',
    evidence_level: 'Untested (theory/pilot stage)',
    source_documents: 'https://statements.qld.gov.au/statements/103605',
  },
];

async function run() {
  let created = 0, linked = 0, skipped = 0;

  // 1. Create missing orgs
  for (const org of MISSING_ORGS) {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', `%${org.name}%`)
      .limit(1);

    if (existing?.length) {
      console.log(`  ORG EXISTS: ${org.name}`);
      continue;
    }

    const { error } = await supabase
      .from('organizations')
      .insert({ name: org.name, state: org.state, description: org.description });

    if (error) console.error(`  ORG ERROR: ${org.name}:`, error.message);
    else { console.log(`  ORG CREATED: ${org.name}`); created++; }
  }

  // 2. Create missing interventions
  for (const intv of MISSING_INTERVENTIONS) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('alma_interventions')
      .select('id')
      .ilike('name', `%${intv.name.substring(0, 30)}%`)
      .limit(1);

    if (existing?.length) {
      console.log(`  INTV EXISTS: ${intv.name}`);
      continue;
    }

    // Find org
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', intv.orgSearch)
      .limit(1);

    const { error } = await supabase
      .from('alma_interventions')
      .insert({
        name: intv.name,
        description: intv.description,
        operating_organization: intv.operating_organization,
        operating_organization_id: orgs?.[0]?.id || null,
        evidence_level: intv.evidence_level,
        source_documents: [intv.source_documents],
        verification_status: 'verified',
        type: 'Post-Detention Support',
      });

    if (error) console.error(`  INTV ERROR: ${intv.name}:`, error.message);
    else { console.log(`  INTV CREATED: ${intv.name}`); created++; }
  }

  // 3. Create program-intervention junction links
  for (const link of PROGRAM_LINKS) {
    // Find matching intervention
    const { data: interventions } = await supabase
      .from('alma_interventions')
      .select('id, name')
      .ilike('name', link.interventionName)
      .neq('verification_status', 'ai_generated')
      .limit(5);

    if (!interventions?.length) {
      console.log(`  NO MATCH: ${link.interventionName} for program ${link.programId.substring(0, 8)}`);
      skipped++;
      continue;
    }

    for (const intv of interventions) {
      // Check if link already exists
      const { data: existingLink } = await supabase
        .from('alma_program_interventions')
        .select('id')
        .eq('program_id', link.programId)
        .eq('intervention_id', intv.id)
        .limit(1);

      if (existingLink?.length) {
        console.log(`  LINK EXISTS: ${intv.name.substring(0, 50)} → ${link.programId.substring(0, 8)}`);
        skipped++;
        continue;
      }

      const { error } = await supabase
        .from('alma_program_interventions')
        .insert({
          program_id: link.programId,
          intervention_id: intv.id,
          relationship: 'implements',
          notes: `Source: ${link.source}`,
        });

      if (error) console.error(`  LINK ERROR:`, error.message);
      else { console.log(`  LINKED: ${intv.name.substring(0, 50)} → ${link.programId.substring(0, 8)}`); linked++; }
    }
  }

  console.log(`\nDone: ${created} created, ${linked} linked, ${skipped} skipped`);
}

run().catch(console.error);
