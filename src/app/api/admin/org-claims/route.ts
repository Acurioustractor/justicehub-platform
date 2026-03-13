import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient() as any;
    const status = request.nextUrl.searchParams.get('status');

    let query = supabase
      .from('organization_claims')
      .select('*, organizations(name, slug)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: claims, error } = await query;

    if (error) throw error;

    return NextResponse.json({ claims: claims || [] });
  } catch (error) {
    console.error('Error listing org claims:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient() as any;
    const body = await request.json();
    const { claim_id, status, admin_notes, abn } = body;

    if (!claim_id || !status) {
      return NextResponse.json(
        { error: 'claim_id and status are required' },
        { status: 400 }
      );
    }

    if (!['verified', 'rejected', 'revoked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the claim
    const updateData: Record<string, unknown> = {
      status,
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString(),
    };

    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = admin.user.id;
    }

    const { data: claim, error: claimError } = await supabase
      .from('organization_claims')
      .update(updateData)
      .eq('id', claim_id)
      .select('*, organizations(name, slug)')
      .single();

    if (claimError) throw claimError;

    // If verified, update the organization
    if (status === 'verified' && claim) {
      const orgUpdate: Record<string, unknown> = {
        verification_status: 'verified',
      };
      if (abn) {
        orgUpdate.abn = abn;
      }
      await supabase
        .from('organizations')
        .update(orgUpdate)
        .eq('id', claim.organization_id);
    }

    return NextResponse.json({ claim });
  } catch (error) {
    console.error('Error updating org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
