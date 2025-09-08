/**
 * Empathy Ledger Sync API Endpoint
 * 
 * Handles synchronization requests between JusticeHub and the Empathy Ledger system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { empathyLedgerService } from '@/lib/empathy-ledger/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only org_admin and platform_admin can sync
    if (!['org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { organizationId, syncType, filters } = body;

    if (!organizationId || !syncType) {
      return NextResponse.json(
        { error: 'organizationId and syncType are required' },
        { status: 400 }
      );
    }

    if (!['import', 'export', 'full_sync'].includes(syncType)) {
      return NextResponse.json(
        { error: 'syncType must be import, export, or full_sync' },
        { status: 400 }
      );
    }

    // Check if user has access to the organization
    if (user.role !== 'platform_admin') {
      const { data: membership, error: membershipError } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('organization_id', organizationId)
        .single();

      if (membershipError || !membership || !['admin', 'owner'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'You do not have permission to sync this organization' },
          { status: 403 }
        );
      }
    }

    // Perform sync based on type
    let result;
    
    switch (syncType) {
      case 'import':
        result = await empathyLedgerService.importStories({
          organizationId,
          syncType: 'import',
          filters
        });
        break;
        
      case 'export':
        result = await empathyLedgerService.exportStories({
          organizationId,
          syncType: 'export',
          filters
        });
        break;
        
      case 'full_sync':
        const fullSyncResult = await empathyLedgerService.fullSync({
          organizationId,
          filters
        });
        result = {
          success: fullSyncResult.overall.success,
          message: fullSyncResult.overall.message,
          records_processed: fullSyncResult.import.records_processed + fullSyncResult.export.records_processed,
          records_successful: fullSyncResult.import.records_successful + fullSyncResult.export.records_successful,
          records_failed: fullSyncResult.import.records_failed + fullSyncResult.export.records_failed,
          syncLogId: `${fullSyncResult.import.syncLogId},${fullSyncResult.export.syncLogId}`,
          duration: fullSyncResult.overall.duration,
          details: {
            import: fullSyncResult.import,
            export: fullSyncResult.export
          }
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid sync type' },
          { status: 400 }
        );
    }

    // Update cross-project metrics after successful sync
    if (result.success && (syncType === 'import' || syncType === 'full_sync')) {
      try {
        await empathyLedgerService.updateCrossProjectMetrics(organizationId);
      } catch (error) {
        console.error('Failed to update cross-project metrics:', error);
        // Don't fail the sync if metrics update fails
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Empathy Ledger sync error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Get user role and check permissions
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the organization
    if (user.role !== 'platform_admin') {
      const { data: membership, error: membershipError } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('organization_id', organizationId)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'You do not have permission to view this organization' },
          { status: 403 }
        );
      }
    }

    // Get sync history
    const syncHistory = await empathyLedgerService.getSyncHistory(organizationId, limit);

    return NextResponse.json({
      success: true,
      syncHistory,
      total: syncHistory.length
    });

  } catch (error: any) {
    console.error('Error fetching sync history:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}