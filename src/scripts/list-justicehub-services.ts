/**
 * List JusticeHub services to help match with Empathy Ledger stories
 */

import { createClient } from '@supabase/supabase-js';

const justiceHubClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || ''
);

async function listServices() {
  console.log('📋 JusticeHub Services for Story Matching\n');

  const { data: services, error} = await justiceHubClient
    .from('services')
    .select('id, name, description, category, location_city, location_state, tags')
    .order('category', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  // Group by category
  const byCategory: { [key: string]: any[] } = {};

  services?.forEach(service => {
    const cat = service.category || 'uncategorized';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(service);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Display by category
  Object.entries(byCategory).forEach(([category, srvcs]) => {
    console.log(`\n📁 ${category.toUpperCase()} (${srvcs.length} services)\n`);

    srvcs.slice(0, 10).forEach((service, i) => {
      const location = service.location_city || 'Not specified';
      const tags = service.tags?.slice(0, 3).join(', ') || 'No tags';
      console.log(`${i + 1}. ${service.name}`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Location: ${location}${service.location_state ? `, ${service.location_state}` : ''}`);
      console.log(`   Tags: ${tags}`);
      console.log(`   Description: ${service.description?.substring(0, 100)}...`);
      console.log('');
    });

    if (srvcs.length > 10) {
      console.log(`   ... and ${srvcs.length - 10} more ${category} services\n`);
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`\n📊 Total Services: ${services?.length || 0}\n`);

  console.log('💡 KEY CATEGORIES TO MATCH:\n');
  console.log('- Youth Justice stories → legal, emergency, family services');
  console.log('- Homelessness stories → housing, emergency services');
  console.log('- Mental Health stories → health services');
  console.log('- Drug & Alcohol stories → substance, health services');
  console.log('- Family Support stories → family, education services\n');

  return byCategory;
}

listServices()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
