#!/usr/bin/env node
/**
 * Detention Centre Data Scraper
 *
 * Uses Firecrawl to scrape state government youth justice websites
 * to gather detention centre information, statistics, and partnership data.
 */

import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

// State youth justice department URLs
const STATE_YOUTH_JUSTICE_SOURCES = {
  QLD: {
    name: 'Queensland Youth Justice',
    urls: [
      'https://www.youthjustice.qld.gov.au/',
      'https://www.youthjustice.qld.gov.au/about-us/youth-detention-centres',
      'https://www.youthjustice.qld.gov.au/about-us/our-partners',
      'https://www.qld.gov.au/law/youth-justice'
    ]
  },
  NSW: {
    name: 'NSW Youth Justice',
    urls: [
      'https://www.dcj.nsw.gov.au/children-and-families/youth-justice',
      'https://www.justice.nsw.gov.au/Pages/YouthJustice/youth-justice.aspx'
    ]
  },
  VIC: {
    name: 'Victoria Youth Justice',
    urls: [
      'https://www.justice.vic.gov.au/justice-system/youth-justice',
      'https://www.vic.gov.au/youth-justice-strategy'
    ]
  },
  WA: {
    name: 'Western Australia Youth Justice',
    urls: [
      'https://www.justice.wa.gov.au/Y/youth_justice.aspx',
      'https://www.wa.gov.au/organisation/department-of-justice/youth-justice-services'
    ]
  },
  SA: {
    name: 'South Australia Youth Justice',
    urls: [
      'https://dhs.sa.gov.au/services/youth-justice',
      'https://www.sa.gov.au/topics/rights-and-law/young-people-and-the-law'
    ]
  },
  NT: {
    name: 'Northern Territory Youth Justice',
    urls: [
      'https://territory.gov.au/department-territory-families',
      'https://nt.gov.au/law/young-people'
    ]
  },
  TAS: {
    name: 'Tasmania Youth Justice',
    urls: [
      'https://www.communities.tas.gov.au/children/youth_justice',
      'https://www.justice.tas.gov.au/youth-justice'
    ]
  },
  ACT: {
    name: 'ACT Youth Justice',
    urls: [
      'https://www.communityservices.act.gov.au/children-and-families/youth-justice',
      'https://www.act.gov.au/our-canberra/community-and-safety/youth-justice'
    ]
  }
};

// Extraction schema for detention centre information
const DETENTION_CENTRE_SCHEMA = {
  type: 'object',
  properties: {
    facilities: {
      type: 'array',
      description: 'List of youth detention centres mentioned',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the detention centre' },
          location: { type: 'string', description: 'City or suburb where located' },
          capacity: { type: 'number', description: 'Number of beds or places' },
          type: { type: 'string', description: 'Type of facility (e.g., remand, sentenced, mixed)' },
          programs: { type: 'array', items: { type: 'string' }, description: 'Programs offered at the facility' },
          contact_phone: { type: 'string', description: 'Phone number' },
          contact_email: { type: 'string', description: 'Email address' }
        }
      }
    },
    statistics: {
      type: 'object',
      description: 'Youth justice statistics if found',
      properties: {
        total_detained: { type: 'number', description: 'Total number of young people detained' },
        indigenous_percentage: { type: 'number', description: 'Percentage of Indigenous young people' },
        average_age: { type: 'number', description: 'Average age of detained youth' },
        reporting_period: { type: 'string', description: 'Period the statistics cover' }
      }
    },
    partner_organizations: {
      type: 'array',
      description: 'Organizations that partner with youth justice',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Organization name' },
          type: { type: 'string', description: 'Type of partnership (e.g., education, health, cultural)' },
          description: { type: 'string', description: 'Brief description of the partnership' }
        }
      }
    },
    programs: {
      type: 'array',
      description: 'Youth justice programs mentioned',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Program name' },
          type: { type: 'string', description: 'Program type' },
          description: { type: 'string', description: 'What the program does' }
        }
      }
    }
  }
};

async function scrapeStateYouthJustice(state, config) {
  console.log(`\n--- Scraping ${config.name} ---`);

  const results = {
    facilities: [],
    statistics: null,
    partners: [],
    programs: []
  };

  for (const url of config.urls) {
    console.log(`  Scraping: ${url}`);

    try {
      const scrapeResult = await firecrawl.scrapeUrl(url, {
        formats: ['extract', 'markdown'],
        extract: {
          prompt: `Extract information about youth detention centres, facilities, statistics, partner organizations, and youth justice programs from this page. Focus on factual information about detention facilities, their capacity, programs offered, and partnerships.`,
          schema: DETENTION_CENTRE_SCHEMA
        }
      });

      if (scrapeResult.success && scrapeResult.extract) {
        const data = scrapeResult.extract;

        // Collect facilities
        if (data.facilities?.length) {
          results.facilities.push(...data.facilities.map(f => ({ ...f, state })));
          console.log(`    Found ${data.facilities.length} facilities`);
        }

        // Collect statistics
        if (data.statistics?.total_detained || data.statistics?.indigenous_percentage) {
          results.statistics = { ...data.statistics, state };
          console.log(`    Found statistics`);
        }

        // Collect partners
        if (data.partner_organizations?.length) {
          results.partners.push(...data.partner_organizations.map(p => ({ ...p, state })));
          console.log(`    Found ${data.partner_organizations.length} partner organizations`);
        }

        // Collect programs
        if (data.programs?.length) {
          results.programs.push(...data.programs.map(p => ({ ...p, state })));
          console.log(`    Found ${data.programs.length} programs`);
        }
      } else {
        console.log(`    No structured data extracted`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`    Error: ${error.message}`);
    }
  }

  return results;
}

async function updateFacilityData(facilityData) {
  console.log('\n--- Updating Facility Data ---');

  for (const facility of facilityData) {
    // Find matching facility in database
    const { data: existing } = await supabase
      .from('youth_detention_facilities')
      .select('id, name')
      .eq('state', facility.state)
      .ilike('name', `%${facility.name?.split(' ')[0]}%`)
      .limit(1)
      .single();

    if (existing) {
      const updates = {};

      if (facility.capacity) updates.capacity_beds = facility.capacity;
      if (facility.contact_phone) updates.contact_phone = facility.contact_phone;
      if (facility.contact_email) updates.contact_email = facility.contact_email;
      if (facility.programs?.length) updates.has_therapeutic_programs = true;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('youth_detention_facilities')
          .update(updates)
          .eq('id', existing.id);

        if (error) {
          console.log(`  X Failed to update ${existing.name}`);
        } else {
          console.log(`  + Updated ${existing.name}`);
        }
      }
    } else {
      console.log(`  ? No match found for ${facility.name} (${facility.state})`);
    }
  }
}

async function linkPartnerships(partnersData) {
  console.log('\n--- Linking Partnerships ---');

  for (const partner of partnersData) {
    // Try to find matching organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', `%${partner.name?.split(' ')[0]}%`)
      .eq('state', partner.state)
      .limit(1)
      .single();

    if (org) {
      // Get facilities for this state
      const { data: facilities } = await supabase
        .from('youth_detention_facilities')
        .select('id, name')
        .eq('state', partner.state);

      // Create partnerships
      for (const facility of facilities || []) {
        const partnershipType = mapPartnershipType(partner.type);

        const { error } = await supabase
          .from('facility_partnerships')
          .upsert({
            facility_id: facility.id,
            partner_type: 'organization',
            organization_id: org.id,
            partnership_type: partnershipType,
            is_active: true,
            description: partner.description
          }, {
            onConflict: 'facility_id,organization_id',
            ignoreDuplicates: true
          });

        if (!error) {
          console.log(`  + Linked ${org.name} to ${facility.name}`);
        }
      }
    }
  }
}

function mapPartnershipType(typeString) {
  const type = (typeString || '').toLowerCase();

  if (type.includes('education')) return 'education_provider';
  if (type.includes('health') || type.includes('mental')) return 'health_provider';
  if (type.includes('legal')) return 'legal_support';
  if (type.includes('cultural') || type.includes('indigenous')) return 'cultural_program';
  if (type.includes('housing')) return 'housing_support';
  if (type.includes('employment') || type.includes('job')) return 'employment_support';
  if (type.includes('family')) return 'family_connection';
  if (type.includes('mentor')) return 'mentoring';
  if (type.includes('advocacy')) return 'advocacy';
  if (type.includes('post') || type.includes('release')) return 'post_release_support';

  return 'in_facility_program';
}

async function main() {
  console.log('============================================================');
  console.log('DETENTION CENTRE DATA SCRAPER');
  console.log('============================================================');
  console.log(`Using Firecrawl API: ${process.env.FIRECRAWL_API_KEY ? 'Yes' : 'No'}`);

  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('\nNo FIRECRAWL_API_KEY found. Please set it in .env.local');
    return;
  }

  // Collect data from all states
  const allData = {
    facilities: [],
    statistics: [],
    partners: [],
    programs: []
  };

  // Scrape each state (limiting to avoid rate limits)
  const statesToScrape = ['QLD', 'NSW', 'VIC'];  // Start with major states

  for (const state of statesToScrape) {
    const config = STATE_YOUTH_JUSTICE_SOURCES[state];
    if (config) {
      const stateData = await scrapeStateYouthJustice(state, config);

      allData.facilities.push(...stateData.facilities);
      if (stateData.statistics) allData.statistics.push(stateData.statistics);
      allData.partners.push(...stateData.partners);
      allData.programs.push(...stateData.programs);

      // Rate limiting between states
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Update database with scraped data
  if (allData.facilities.length > 0) {
    await updateFacilityData(allData.facilities);
  }

  if (allData.partners.length > 0) {
    await linkPartnerships(allData.partners);
  }

  // Summary
  console.log('\n============================================================');
  console.log('SCRAPING SUMMARY');
  console.log('============================================================');
  console.log(`Facilities found: ${allData.facilities.length}`);
  console.log(`Statistics collected: ${allData.statistics.length}`);
  console.log(`Partner organizations: ${allData.partners.length}`);
  console.log(`Programs found: ${allData.programs.length}`);

  // Show current database state
  const { count: facilityCount } = await supabase
    .from('youth_detention_facilities')
    .select('*', { count: 'exact', head: true });

  const { count: partnershipCount } = await supabase
    .from('facility_partnerships')
    .select('*', { count: 'exact', head: true });

  console.log(`\nDatabase state:`);
  console.log(`  Detention facilities: ${facilityCount}`);
  console.log(`  Facility partnerships: ${partnershipCount}`);
}

main().catch(console.error);
