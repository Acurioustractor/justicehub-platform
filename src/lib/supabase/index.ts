/**
 * Supabase Client Module
 *
 * This module provides properly configured Supabase clients for different contexts:
 *
 * - **Client Components**: Use `createClient` from `@/lib/supabase/client`
 * - **Server Components/API Routes**: Use `createClient` from `@/lib/supabase/server`
 * - **Admin Operations**: Use `createAdminClient` from `@/lib/supabase/server`
 * - **Empathy Ledger**: Use `empathyLedgerClient` from `@/lib/supabase/empathy-ledger`
 *
 * ## Quick Start
 *
 * ### In Client Components ('use client')
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase client...
 * }
 * ```
 *
 * ### In Server Components
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('posts').select('*')
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 *
 * ### In API Routes
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 * import { NextResponse } from 'next/server'
 *
 * export async function GET() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('posts').select('*')
 *   return NextResponse.json(data)
 * }
 * ```
 *
 * ## Environment Variables Required
 *
 * ```bash
 * # Required for all Supabase operations
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *
 * # Required for admin operations (optional)
 * SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *
 * # Required for Empathy Ledger (optional)
 * EMPATHY_LEDGER_URL=https://your-empathy-ledger.supabase.co
 * EMPATHY_LEDGER_ANON_KEY=your-empathy-ledger-anon-key
 * ```
 *
 * @module
 */

// Re-export client components (for 'use client' components)
export { createClient as createBrowserClient } from './client'

// Re-export server components (for Server Components, API Routes, Server Actions)
export { createClient as createServerClient, createAdminClient } from './server'

// Re-export Empathy Ledger client (for multi-tenant features)
export {
  empathyLedgerClient,
  type EmpathyLedgerOrganization,
  type EmpathyLedgerStory,
  type EmpathyLedgerProfile,
  type EmpathyLedgerProject,
} from './empathy-ledger'

// Re-export Database types
export type { Database } from '@/types/supabase'
