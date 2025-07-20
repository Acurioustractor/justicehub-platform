import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { syncAirtableStories } from '@/lib/airtable/sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Only org_admin and platform_admin can sync
    if (!user || (user.role !== 'org_admin' && user.role !== 'platform_admin')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    // Get organization ID from request body
    const { organizationId } = await request.json()
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }
    
    // Check if user belongs to the organization
    if (user.role !== 'platform_admin') {
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('organization_id', organizationId)
        .single()
      
      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have permission to sync this organization' },
          { status: 403 }
        )
      }
    }
    
    // Perform sync
    const result = await syncAirtableStories(organizationId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}