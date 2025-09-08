/**
 * Test Empathy Ledger Connection API Endpoint
 * 
 * Tests the connection to the Empathy Ledger database and verifies required tables exist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { testEmpathyLedgerConnection } from '@/lib/empathy-ledger/test-connection';

export async function GET(request: NextRequest) {
  try {
    const result = await testEmpathyLedgerConnection();
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });

  } catch (error: any) {
    console.error('Test connection API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}