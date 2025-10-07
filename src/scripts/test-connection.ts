import { createClient } from '@supabase/supabase-js'

// Test connection with anon key
const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNjY2MjksImV4cCI6MjAzNjk0MjYyOX0.jNE5fGFXKMLK6CQE3cSCHOQ8ZrfGj3ZaHXBhbvXFvX8'
)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test a simple query
    const { data, error, count } = await supabase
      .from('services')
      .select('count', { count: 'exact' })
      .eq('active', true)
    
    if (error) {
      console.log('Connection failed:', error.message)
      if (error.message.includes('Invalid API key')) {
        console.log('API key is invalid')
      }
      return
    }
    
    console.log('Connection successful!')
    console.log('Count:', count)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testConnection()