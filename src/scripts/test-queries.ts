import { createClient } from '@supabase/supabase-js'

// Use the service role key for admin access
const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
)

async function testQueries() {
  console.log('Testing database queries...')
  
  // Test organizations query
  console.log('Testing organizations query...')
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(3)
    
  if (orgsError) {
    console.error('Organizations query error:', orgsError.message)
  } else {
    console.log('Organizations query successful:', orgs)
  }
  
  // Test services query (will fail until table is created)
  console.log('Testing services query...')
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name')
    .limit(3)
    
  if (servicesError) {
    console.log('Services query error (expected if table not created yet):', servicesError.message)
  } else {
    console.log('Services query successful:', services)
  }
  
  console.log('Test completed!')
}

testQueries()