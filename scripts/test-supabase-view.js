// Test Supabase connection and view
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testing services table...');
    const { data: services, error: servicesError, count } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: false })
      .limit(3);

    if (servicesError) {
      console.error('❌ Services table error:', servicesError.message);
    } else {
      console.log(`✅ Services table: ${count} rows`);
      console.log('Sample:', services?.[0]?.name || 'No data');
    }

    console.log('\n📊 Testing services_complete view...');
    const { data: complete, error: viewError } = await supabase
      .from('services_complete')
      .select('*')
      .limit(3);

    if (viewError) {
      console.error('❌ View error:', viewError.message);
      console.error('Details:', viewError);
    } else {
      console.log(`✅ View works: ${complete?.length} rows`);
      if (complete?.[0]) {
        console.log('Sample fields:', Object.keys(complete[0]).join(', '));
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
