#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkStructure() {
  console.log('🔍 Checking youth_statistics table structure...')
  
  try {
    const { data, error } = await supabase
      .from('youth_statistics')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('Error:', error.message)
    } else {
      console.log('✅ Sample data from youth_statistics:')
      console.log(data)
    }
  } catch (error) {
    console.log('Error:', error.message)
  }
}

checkStructure()