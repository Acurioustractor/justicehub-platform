/**
 * Check Services Data in Supabase
 * Verifies existing services and provides statistics
 */

import { createClient } from '@supabase/supabase-js';

// Support multiple env variable names
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.YJSF_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.YJSF_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('   SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServicesData() {
  console.log('🔍 Checking JusticeHub Services Data in Supabase...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  try {
    // Check if services table exists and get count
    const { data: services, error: servicesError, count: servicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: false })
      .limit(10);

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError.message);
      return;
    }

    console.log(`✅ Services table exists!`);
    console.log(`📊 Total services in database: ${servicesCount}\n`);

    if (services && services.length > 0) {
      console.log('📋 Sample services (first 10):');
      console.log('─'.repeat(80));
      services.forEach((service: any, index: number) => {
        console.log(`\n${index + 1}. ${service.name || 'Unnamed Service'}`);
        console.log(`   ID: ${service.id}`);
        console.log(`   Categories: ${service.categories?.join(', ') || 'None'}`);
        console.log(`   Description: ${service.description?.substring(0, 100) || 'No description'}...`);
      });
      console.log('\n' + '─'.repeat(80));
    }

    // Check categories distribution
    const { data: allServices } = await supabase
      .from('services')
      .select('categories');

    if (allServices) {
      const categoryCount: Record<string, number> = {};
      allServices.forEach((service: any) => {
        if (service.categories && Array.isArray(service.categories)) {
          service.categories.forEach((cat: string) => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
        }
      });

      console.log('\n📊 Services by Category:');
      console.log('─'.repeat(80));
      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          const bar = '█'.repeat(Math.ceil(count / 5));
          console.log(`${category.padEnd(25)} ${count.toString().padStart(3)} ${bar}`);
        });
      console.log('─'.repeat(80));
    }

    // Check organizations
    const { count: orgsCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🏢 Organizations in database: ${orgsCount || 0}`);

    // Check locations
    const { count: locationsCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true });

    console.log(`📍 Locations in database: ${locationsCount || 0}`);

    // Check contacts
    const { count: contactsCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    console.log(`📞 Contacts in database: ${contactsCount || 0}\n`);

    // Summary
    console.log('═'.repeat(80));
    console.log('✨ DATABASE SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Services:      ${servicesCount}`);
    console.log(`Total Organizations: ${orgsCount || 0}`);
    console.log(`Total Locations:     ${locationsCount || 0}`);
    console.log(`Total Contacts:      ${contactsCount || 0}`);
    console.log(`Unique Categories:   ${Object.keys(categoryCount || {}).length}`);
    console.log('═'.repeat(80));

    console.log('\n✅ Database check complete!');
    console.log('🚀 Ready to start building the AI-powered scraping system!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkServicesData();
