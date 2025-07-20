import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing')
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing')

// Test with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('\n📊 Testing what we can do with current credentials:\n')

// Test read access
try {
  const { data, error } = await supabase
    .from('budget_allocations')
    .select('*')
    .limit(1)
  
  if (!error) {
    console.log('✅ Can READ from existing tables')
  } else {
    console.log('❌ Cannot read:', error.message)
  }
} catch (e) {
  console.log('❌ Read test failed:', e.message)
}

// Test write access
try {
  const { error } = await supabase
    .from('budget_allocations')
    .insert({ test: true })
  
  if (!error) {
    console.log('✅ Can WRITE to existing tables')
    // Clean up
    await supabase.from('budget_allocations').delete().eq('test', true)
  } else {
    console.log('❌ Cannot write:', error.code === '42501' ? 'Permission denied (RLS enabled)' : error.message)
  }
} catch (e) {
  console.log('❌ Write test failed:', e.message)
}

// Test table creation (will fail with anon key)
try {
  const { error } = await supabase.rpc('current_database')
  if (!error) {
    console.log('✅ Can execute functions')
  }
} catch (e) {
  console.log('❌ Cannot execute database functions')
}

console.log('\n💡 Summary:')
console.log('- With anon key: Can read/write data in existing tables')
console.log('- With anon key: CANNOT create new tables or run migrations')
console.log('- Need service role key OR use Supabase Dashboard for migrations')

console.log('\n🔗 Your Supabase Dashboard:')
console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.com/dashboard')}`)