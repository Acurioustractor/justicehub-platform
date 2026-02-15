/**
 * Grant admin access to a user
 * Usage: node scripts/grant-admin-access.mjs <email>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const email = process.argv[2] || 'test@justicehub.au'

console.log(`\n🔐 Granting admin access to: ${email}\n`)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function grantAdmin() {
  // First, find the user by email in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error listing users:', authError.message)
    process.exit(1)
  }

  const user = authData.users.find(u => u.email === email)

  if (!user) {
    console.error(`❌ User not found: ${email}`)
    console.log('\n📋 Available users:')
    authData.users.slice(0, 5).forEach(u => console.log(`   - ${u.email}`))
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.id}`)

  // Step 1: Add is_super_admin column and create/update profile using exec_sql
  console.log('📋 Adding is_super_admin column and setting admin access...')

  const sql = `
    -- Add column if it doesn't exist
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

    -- Insert profile if not exists, or update if exists
    INSERT INTO profiles (id, email, is_super_admin)
    VALUES ('${user.id}'::uuid, '${email}', true)
    ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
  `

  // Try exec_sql with 'query' parameter
  const { error: rpcError } = await supabase.rpc('exec_sql', { query: sql })

  if (rpcError) {
    console.log('⚠️  exec_sql failed:', rpcError.message)

    // Try execute_sql with 'sql_query' parameter
    console.log('   Trying execute_sql...')
    const { error: rpcError2 } = await supabase.rpc('execute_sql', { sql_query: sql })

    if (rpcError2) {
      console.log('⚠️  execute_sql failed:', rpcError2.message)

      // Try exec with 'sql' parameter
      console.log('   Trying exec...')
      const { error: rpcError3 } = await supabase.rpc('exec', { sql: sql })

      if (rpcError3) {
        console.error('❌ All RPC methods failed:', rpcError3.message)
        console.log('\n📋 Manual fix required. Run this SQL in Supabase dashboard:')
        console.log('─'.repeat(60))
        console.log(sql)
        console.log('─'.repeat(60))
        console.log('\n👉 Dashboard: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new')
        process.exit(1)
      }
    }
  }

  console.log('✅ SQL executed successfully!')
  console.log('\n🎉 Admin access granted!')
  console.log(`\n👉 Now visit: http://localhost:3000/admin/organizations\n`)
}

grantAdmin().catch(console.error)
