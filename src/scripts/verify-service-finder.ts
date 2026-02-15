// Simple test to verify the Service Finder widget can connect to Supabase
import { createClient } from '@supabase/supabase-js'

// Test function that mimics what the ServiceFinderWidget does
async function testServiceFinder() {
  console.log('🧪 Testing Service Finder connection...')
  
  // Use the service key directly
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Test a simple query to check connection
    console.log('🔍 Testing basic connection with service key...')
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.log('❌ Connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Basic connection successful!')
    console.log('📋 Sample organization:', data?.[0] || 'No organizations found')
    
    // Test the services table (will fail until created)
    console.log('🔍 Testing services table...')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .limit(1)
    
    if (servicesError) {
      console.log('❌ Services table test failed (expected if table not created):', servicesError.message)
      if (servicesError.message.includes('relation "services" does not exist')) {
        console.log('💡 Tip: Create the services table using the SQL commands provided in the setup instructions')
      }
      return true // This is expected
    }
    
    console.log('✅ Services table exists and is accessible!')
    console.log('📋 Sample service:', services?.[0] || 'No services found')
    
    return true
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return false
  }
}

// Run the test
testServiceFinder().then(success => {
  if (success) {
    console.log('\n🎉 Service Finder connection test completed!')
    console.log('✅ Basic Supabase connection is working')
    console.log('⚠️  Services table needs to be created for full functionality')
    console.log('\n📋 Next steps:')
    console.log('1. Create the services table using the SQL commands from setup instructions')
    console.log('2. Run: npx tsx src/scripts/insert-sample-data.ts')
    console.log('3. Start your app: npm run dev')
    console.log('4. Visit: http://localhost:3000/services')
  } else {
    console.log('\n❌ Service Finder connection test failed')
    console.log('Please check your Supabase configuration')
  }
})