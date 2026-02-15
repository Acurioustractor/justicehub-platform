#!/usr/bin/env node
/**
 * Enrich known organizations with verified contact details
 *
 * This script contains manually researched contact information for
 * well-known youth justice organizations.
 */

import { importServices, ServiceInput } from '../lib/service-importer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Manually researched contact details for known organizations
const organizationContacts: Record<string, {
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
}> = {
  'Orange Sky': {
    website: 'https://orangesky.org.au',
    phone: '1800 699 714',
    email: 'connect@orangesky.org.au',
    city: 'Brisbane',
    postcode: '4000'
  },
  'Blue EDGE': {
    website: 'https://www.blueedge.org.au',
    phone: '(07) 3284 6600',
    email: 'info@blueedge.org.au',
    city: 'Brisbane',
    postcode: '4000'
  },
  'Anglicare': {
    website: 'https://www.anglicaresq.org.au',
    phone: '1300 610 610',
    email: 'info@anglicaresq.org.au',
    city: 'Brisbane',
    postcode: '4000'
  },
  'CentacareCQ': {
    website: 'https://www.centacare.net',
    phone: '(07) 4927 6677',
    email: 'admin@centacare.net',
    city: 'Rockhampton',
    postcode: '4700'
  },
  'CentacareNQ': {
    website: 'https://centacarefnq.org.au',
    phone: '(07) 4044 0130',
    email: 'enquiries@centacarefnq.org.au',
    city: 'Cairns',
    postcode: '4870'
  },
  'Brisbane Youth Detention Centre': {
    website: 'https://www.youthjustice.qld.gov.au',
    phone: '(07) 3837 5111',
    email: 'youthjustice@youthjustice.qld.gov.au',
    address: '261 Sir Fred Schonell Drive',
    city: 'St Lucia',
    postcode: '4067'
  },
  'Cairns Youth Foyer': {
    website: 'https://www.cairnsyouthfoyer.org.au',
    phone: '(07) 4041 5700',
    email: 'admin@cairnsyouthfoyer.org.au',
    city: 'Cairns',
    postcode: '4870'
  },
  'AFL Cape York': {
    website: 'https://www.aflcapeyork.com.au',
    phone: '(07) 4069 9100',
    email: 'info@aflcapeyork.com.au',
    city: 'Cairns',
    postcode: '4870'
  },
  'ABCN': {
    website: 'https://www.abcn.com.au',
    phone: '1800 2 CONNECT',
    email: 'info@abcn.com.au',
    city: 'Sydney',
    postcode: '2000'
  },
  'Department of Housing': {
    website: 'https://www.qld.gov.au/housing',
    phone: '1800 464 489',
    email: 'housing@qld.gov.au',
    city: 'Brisbane',
    postcode: '4000'
  },
  'Department of Child Safety': {
    website: 'https://www.csyw.qld.gov.au',
    phone: '1800 811 810',
    email: 'childprotection@csyw.qld.gov.au',
    city: 'Brisbane',
    postcode: '4000'
  }
};

async function main() {
  console.log('============================================================');
  console.log('🔍 ENRICHING KNOWN ORGANIZATIONS');
  console.log('============================================================\n');

  let enriched = 0;
  let failed = 0;

  for (const [orgName, contacts] of Object.entries(organizationContacts)) {
    console.log(`\n📌 ${orgName}`);

    try {
      // Find services for this organization
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          id,
          name,
          slug,
          organizations!inner(name)
        `)
        .ilike('organizations.name', `%${orgName}%`);

      if (error) {
        console.error(`   ❌ Error finding services: ${error.message}`);
        failed++;
        continue;
      }

      if (!services || services.length === 0) {
        console.log(`   ⚠️  No services found`);
        continue;
      }

      console.log(`   Found ${services.length} services`);

      // Update each service with contact details
      for (const service of services) {
        const updateData: any = {};

        if (contacts.website && !updateData.website_url) {
          updateData.website_url = contacts.website;
        }
        if (contacts.phone && !updateData.contact_phone) {
          updateData.contact_phone = contacts.phone;
        }
        if (contacts.email && !updateData.contact_email) {
          updateData.contact_email = contacts.email;
        }
        if (contacts.address && !updateData.location_address) {
          updateData.location_address = contacts.address;
        }
        if (contacts.city && !updateData.location_city) {
          updateData.location_city = contacts.city;
        }
        if (contacts.postcode && !updateData.location_postcode) {
          updateData.location_postcode = contacts.postcode;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('services')
            .update(updateData)
            .eq('id', service.id);

          if (updateError) {
            console.error(`   ❌ Failed to update ${service.name}: ${updateError.message}`);
            failed++;
          } else {
            console.log(`   ✅ Enriched: ${service.name}`);
            enriched++;
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${orgName}:`, error);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log('📊 ENRICHMENT SUMMARY');
  console.log('============================================================');
  console.log(`Organizations processed: ${Object.keys(organizationContacts).length}`);
  console.log(`Services enriched: ${enriched}`);
  console.log(`Failed: ${failed}`);
  console.log('\n💡 Run identify-enrichment-targets.ts again to see improvement!');
}

main().catch(console.error);
