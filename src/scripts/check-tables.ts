import { createClient } from '@supabase/supabase-js'

// Use the service role key for admin access
const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
)

async function checkTables() {
  try {
    // Check if organizations table exists
    console.log('Checking organizations table...')
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)

    if (orgError) {
      console.log('Organizations table error:', orgError.message)
    } else {
      console.log('Organizations table exists with', orgData[0].count, 'records')
    }
    
    // Check if services table exists
    console.log('Checking services table...')
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('count')
      .limit(1)

    if (serviceError) {
      console.log('Services table error:', serviceError.message)
      if (serviceError.message.includes('relation "services" does not exist')) {
        console.log('Services table does not exist yet.')
      }
    } else {
      console.log('Services table exists with', serviceData[0].count, 'records')
    }
    
    return true
  } catch (error) {
    console.error('Error checking tables:', error)
    return false
  }
}

checkTables().then(success => {
  if (success) {
    console.log('✅ Table check completed')
  } else {
    console.log('❌ Table check failed')
  }
})