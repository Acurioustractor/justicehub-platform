/**
 * Projects API Endpoint
 * 
 * Handles project listing and management in the Empathy Ledger database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStorytellerService } from '@/lib/empathy-ledger/storyteller-service';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    const result = await storytellerService.getProjects(organizationId || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: result.projects,
      message: 'Projects retrieved successfully'
    });

  } catch (error: any) {
    console.error('Projects API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}