import { createClient } from '@supabase/supabase-js'

// Use the service role key for admin access
const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
)

async function testConnection() {
  try {
    // Test the connection by querying the database
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)

    if (error) {
      console.log('Error connecting to Supabase:', error.message)
      if (error.message.includes('relation "organizations" does not exist')) {
        console.log('Tables do not exist yet. This is expected on first run.')
        return true
      }
      return false
    }
    
    console.log('Successfully connected to Supabase!')
    console.log('Data:', data)
    return true
  } catch (error) {
    console.error('Failed to connect to Supabase:', error)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ Connection test passed')
  } else {
    console.log('❌ Connection test failed')
  }
})