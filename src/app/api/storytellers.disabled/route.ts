/**
 * Storytellers API Endpoint
 * 
 * Handles storyteller registration, profile management, and listing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStorytellerService } from '@/lib/empathy-ledger/storyteller-service';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get Empathy Ledger database credentials from environment
    const empathyLedgerUrl = env.SUPABASE_URL; // Use your Empathy Ledger Supabase URL
    const empathyLedgerKey = env.SUPABASE_ANON_KEY; // Use your Empathy Ledger key

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // For now, return basic info - in production you'd implement proper filtering
    const result = await storytellerService.getOrganizations();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organizations: result.organizations,
      message: 'Organizations retrieved successfully'
    });

  } catch (error: any) {
    console.error('Storytellers API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      age,
      location,
      bio,
      projectId,
      organizationId,
      privacySettings,
      consentGranted
    } = body;

    // Validate required fields
    if (!name || !projectId || !organizationId) {
      return NextResponse.json(
        { error: 'Name, projectId, and organizationId are required' },
        { status: 400 }
      );
    }

    if (!consentGranted) {
      return NextResponse.json(
        { error: 'Consent must be granted to create storyteller profile' },
        { status: 400 }
      );
    }

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Create storyteller profile
    const result = await storytellerService.createStoryteller({
      name,
      email,
      age,
      location,
      bio,
      project_id: projectId,
      organization_id: organizationId,
      consent_status: 'granted',
      privacy_settings: privacySettings || {
        show_name: true,
        show_location: false,
        show_age: false,
        allow_contact: false
      },
      metadata: {
        created_via: 'justicehub',
        created_at: new Date().toISOString()
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Grant consent if storyteller was created successfully
    if (result.storyteller) {
      await storytellerService.grantConsent(result.storyteller.id!, {
        consent_type: 'storytelling',
        granted_at: new Date().toISOString(),
        granted_via: 'justicehub_registration',
        terms_version: '1.0',
        privacy_acknowledged: true
      });
    }

    return NextResponse.json({
      success: true,
      storyteller: result.storyteller,
      message: 'Storyteller profile created successfully'
    });

  } catch (error: any) {
    console.error('Create storyteller error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}