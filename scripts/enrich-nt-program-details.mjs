#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n✨ Enriching NT Program Details\n');

// Programs to enrich with better details
const enrichments = [
  {
    name: 'Oochiumpa Youth Services',
    updates: {
      website: 'https://www.oochiumpa.org.au/',
      description: 'Aboriginal-owned and operated holistic youth support service in Central Australia. Delivers integrated support across 4 pillars: Education & Employment (72% school re-engagement), Health & Wellbeing (68% mental health improvement), Housing & Basic Needs (85% housing stability), and Cultural Connection (82% cultural identity strengthening). Achieved 95% reduction in offending (18 of 19 youth removed from Operation Luna list). Provides wrap-around case management, cultural healing, family support, and advocacy.',
      metadata: {
        source: 'Oochiumpa internal evaluation 2024, GitHub repository',
        outcomes: '95% offending reduction (18 of 19 youth), 72% school re-engagement, 68% mental health improvement, 85% housing stability, 82% cultural connection improvement',
        programs: ['Education & Employment', 'Health & Wellbeing', 'Housing & Basic Needs', 'Cultural Connection'],
        service_model: 'Holistic wrap-around case management',
        evidence_strength: 'Strong local outcomes data, multiple impact areas measured',
        authority: 'Aboriginal-owned and operated, community-controlled',
        comparison_note: 'THE BENCHMARK - 95% success rate, holistic model',
      },
    },
  },
  {
    name: 'NAAJA Youth Throughcare',
    updates: {
      website: 'https://www.naaja.org.au/youth-throughcare/',
      description: 'Intensive case management and legal support for Aboriginal young people in detention or on bail. Delivered by North Australian Aboriginal Justice Agency (NAAJA) across Darwin, Alice Springs, and Palmerston. Senior Youth Justice Workers provide holistic support including legal representation, family reconnection, housing, education, health referrals, and cultural connection. Addresses over-incarceration of Aboriginal youth in NT (96% of detained youth).',
      metadata: {
        source: 'NAAJA website, Justice Programs page',
        programs: ['Intensive case management', 'Legal representation', 'Family support', 'Housing assistance', 'Education support', 'Health referrals'],
        target: 'Young people in detention or on bail',
        locations: 'Darwin, Alice Springs, Palmerston',
        authority: 'Aboriginal Community Controlled Organisation - peak Aboriginal legal service NT',
        established: 'Ongoing program',
      },
    },
  },
  {
    name: 'Kunga Stopping Violence Program',
    updates: {
      website: 'https://www.naaja.org.au/justice-programs/',
      description: 'Culturally-grounded violence prevention and intervention program for Aboriginal young people. Delivered by NAAJA, focuses on addressing root causes of violence through cultural healing, behavior change support, and community connection. Integrates Aboriginal cultural frameworks with trauma-informed approaches.',
      metadata: {
        source: 'NAAJA website',
        focus: 'Violence prevention and intervention',
        approach: 'Cultural healing + trauma-informed',
        authority: 'Aboriginal Community Controlled Organisation (NAAJA)',
      },
    },
  },
  {
    name: 'AMSANT Social Emotional Wellbeing (SEWB) Program',
    updates: {
      website: 'https://www.amsant.org.au/',
      description: 'Peak body coordination and support for Social Emotional Wellbeing programs across NT Aboriginal Community Controlled Health Services. Provides training, resources, advocacy, and coordination for youth mental health and wellbeing services. Includes FASD screening, mental health support, and pathways to health workforce through NT Aboriginal Health Academy.',
      metadata: {
        source: 'AMSANT website',
        role: 'Peak body coordination and support',
        programs: ['SEWB coordination', 'FASD screening', 'Mental health support', 'NT Aboriginal Health Academy'],
        reach: 'Supports ACCHS network across NT',
        authority: 'Peak body for Aboriginal Community Controlled Health Services in NT',
      },
    },
  },
  {
    name: 'Youth Outreach and Re-engagement Teams (NT)',
    updates: {
      website: 'https://nt.gov.au/law/youth-justice/youth-diversion-programs',
      description: 'Government-funded early intervention and case management program (YORET) for at-risk youth across NT. Provides one-on-one engagement, family support, vulnerability assessment, and pathways to positive life choices. Established 2017 with $18.2M funding allocation. Operates statewide to identify and support youth before justice system involvement.',
      metadata: {
        source: 'NT Government Youth Justice website',
        established: '2017',
        funding: '$18.2M allocation',
        coverage: 'Statewide NT',
        focus: 'Early intervention before justice involvement',
        services: ['One-on-one engagement', 'Family support', 'Vulnerability assessment', 'Pathways support'],
      },
    },
  },
  {
    name: 'Youth Pre-Court Diversion Scheme (YDS)',
    updates: {
      website: 'https://nt.gov.au/law/youth-justice/youth-diversion-programs',
      description: 'Police-led diversion program for first-time or low-level young offenders (ages 10-17) across NT. Youth who admit responsibility can be diverted from court to alternative interventions including warnings, conferences, or referrals to support services. Aims to reduce formal justice system contact and provide early intervention.',
      metadata: {
        source: 'NT Government Youth Justice, AIHW Youth Justice in Australia 2023-24',
        target: 'First-time or low-level offenders, ages 10-17',
        model: 'Police-led diversion',
        interventions: ['Warnings', 'Conferences', 'Support service referrals'],
        coverage: 'Darwin, Alice Springs, Regional NT',
      },
    },
  },
  {
    name: 'Youth Justice Conferencing (NT)',
    updates: {
      website: 'https://www.youthjustice.nt.gov.au/initiatives/youth-justice-conferencing-and-victim-support',
      description: 'Restorative justice conferencing bringing together young offenders, victims, families, and community members to address harm and develop reparation plans. Operated by Community Justice Centre and expanded through partnerships with Jesuit Social Services. Includes cultural advisors for Aboriginal youth. 60% non-reoffending rate. Expanding to remote communities via Local Decision Making.',
      metadata: {
        source: 'NT Government Youth Justice website',
        outcomes: '60% non-reoffending rate',
        model: 'Restorative justice conferencing',
        providers: 'Community Justice Centre, Jesuit Social Services',
        expansion: 'Phase 1 & 2 to remote communities',
        cultural_support: 'Aboriginal Cultural Advisors included',
      },
    },
  },
  {
    name: 'Community Youth Justice Officers (CYJOs)',
    updates: {
      website: 'https://nt.gov.au/law/youth-justice',
      description: 'Government-employed case managers providing supervision and support to young people on court orders (bail, probation, community service). Monitor compliance with conditions, coordinate services, and link youth to education, health, and family support. Operate across NT regions.',
      metadata: {
        source: 'NT Government Youth Justice',
        role: 'Case management and supervision',
        target: 'Youth on court orders (bail, probation, community service)',
        functions: ['Monitor compliance', 'Service coordination', 'Education/health referrals'],
        coverage: 'NT-wide',
      },
    },
  },
  {
    name: 'Don Dale Youth Detention Centre',
    updates: {
      website: 'https://www.royalcommission.gov.au/child-detention',
      description: 'Youth detention facility in Darwin. Subject of 2017 Royal Commission into Protection and Detention of Children following abuse and mistreatment revelations. Highest recidivism rate (40%) compared to community alternatives. Royal Commission recommended closure and replacement with therapeutic care models. Continues to operate pending NT Government reforms.',
      metadata: {
        source: 'Royal Commission into Protection and Detention of Children in NT (2017)',
        location: 'Darwin',
        issues: 'High recidivism (40%), Royal Commission documented abuse',
        status: 'Under reform, recommended for closure',
        comparison: 'Detention causes harm vs community programs achieve 60-95% success rates',
      },
    },
  },
  {
    name: 'Alice Springs Youth Detention Centre',
    updates: {
      website: 'https://www.royalcommission.gov.au/child-detention',
      description: 'Youth detention facility in Alice Springs. Subject to Royal Commission review alongside Don Dale. High recidivism rates and cultural safety concerns for Aboriginal youth (who comprise 96% of detained youth in NT). Royal Commission recommended reform toward community-based alternatives and therapeutic care models.',
      metadata: {
        source: 'Royal Commission into Protection and Detention of Children in NT (2017)',
        location: 'Alice Springs',
        issues: 'High recidivism, cultural safety concerns',
        demographics: '96% Aboriginal youth detained in NT',
        status: 'Under reform, community alternatives recommended',
      },
    },
  },
  {
    name: 'Royal Commission into Protection and Detention of Children in Northern Territory',
    updates: {
      website: 'https://www.royalcommission.gov.au/child-detention',
      description: 'Landmark 2017 Royal Commission following revelations of abuse and mistreatment in NT youth detention. Made 227 recommendations across 17 work programs including: closure of Don Dale and Alice Springs detention centers, expansion of diversion programs, raising age of criminal responsibility, increased investment in community-led alternatives, and cultural safety reforms. NT Government allocated $229.6M over 5 years for implementation.',
      metadata: {
        source: 'Royal Commission Final Report 2017',
        year: '2017',
        recommendations: '227 recommendations across 17 work programs',
        funding: '$229.6M over 5 years for implementation',
        key_reforms: ['Close detention centers', 'Expand diversion', 'Raise age of responsibility', 'Invest in community alternatives', 'Cultural safety'],
        status: 'Implementation ongoing',
      },
    },
  },
  {
    name: 'East Arnhem Land Youth Model (Guŋga\'yunga Djamarrkuliny)',
    updates: {
      metadata: {
        programs: ['Local Decision Making youth initiatives', 'Community-led programs across 7 communities'],
        outcomes: 'Early implementation - evaluation pending',
        significance: 'Pioneering Aboriginal self-determination in youth justice',
      },
    },
  },
  {
    name: 'Central Australia Justice Reinvestment Initiative',
    updates: {
      metadata: {
        programs: ['Community-led prevention', 'Family support', 'Cultural programs', 'Service coordination'],
        significance: 'Aboriginal-led consortium model - Lhere Artepe (Traditional Owners) leading',
        status: 'Active implementation 2023-27',
      },
    },
  },
  {
    name: 'Bawinanga Aboriginal Corporation Community Services',
    updates: {
      metadata: {
        programs: ['Community patrol', 'Night patrol', 'Community support services'],
        relationship: 'Works alongside Nja-marleya Justice Reinvestment in Maningrida',
        established: 'Long-established ACCO',
      },
    },
  },
  {
    name: 'Urapuntja Health Service Youth Program',
    updates: {
      metadata: {
        programs: ['Youth health services', 'Mental health support', 'SEWB programs'],
        model: 'Comprehensive primary health care with youth focus',
        authority: 'Aboriginal Community Controlled Health Service since 1977',
      },
    },
  },
];

let updateCount = 0;

for (const enrichment of enrichments) {
  // Find the program
  const { data: programs } = await supabase
    .from('alma_interventions')
    .select('id, name, metadata')
    .eq('name', enrichment.name)
    .single();

  if (!programs) {
    console.log(`⚠️  Not found: ${enrichment.name}`);
    continue;
  }

  // Merge existing metadata with new metadata
  const existingMetadata = programs.metadata || {};
  const newMetadata = enrichment.updates.metadata || {};
  const mergedMetadata = { ...existingMetadata, ...newMetadata };

  // Prepare update object
  const updateData = { ...enrichment.updates };
  if (Object.keys(newMetadata).length > 0) {
    updateData.metadata = mergedMetadata;
  }

  // Update the program
  const { error } = await supabase
    .from('alma_interventions')
    .update(updateData)
    .eq('id', programs.id);

  if (error) {
    console.log(`❌ Error updating ${enrichment.name}:`, error.message);
  } else {
    console.log(`✅ Enriched: ${enrichment.name}`);
    updateCount++;
  }
}

console.log(`\n✨ Updated ${updateCount} of ${enrichments.length} programs\n`);
