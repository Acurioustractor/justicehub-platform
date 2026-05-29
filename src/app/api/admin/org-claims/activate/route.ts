import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

function isMissingColumnError(error: { message?: string; code?: string } | null | undefined, column: string) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes(column.toLowerCase());
}

/**
 * POST /api/admin/org-claims/activate
 * Called after approving a claim — creates org membership + starts 14-day trial.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { claim_id, organization_id, user_id } = await request.json();

    if (!organization_id || !user_id) {
      return NextResponse.json(
        { error: 'organization_id and user_id are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient() as any;

    // Create organization_members entry (admin role, active)
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert(
        {
          user_id,
          organization_id,
          role: 'admin',
          status: 'active',
        },
        { onConflict: 'user_id,organization_id' }
      );

    if (memberError) {
      console.error('Failed to create org membership:', memberError);
      // Continue anyway — the claim was already approved
    }

    // Set 14-day trial + update plan and billing status
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        plan: 'organisation',
        billing_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .eq('id', organization_id);

    if (orgError) {
      if (isMissingColumnError(orgError, 'trial_ends_at')) {
        console.warn('trial_ends_at is missing; activating org without persisted trial end until migration is applied.');
        const { error: fallbackError } = await supabase
          .from('organizations')
          .update({
            plan: 'organisation',
            billing_status: 'trialing',
          })
          .eq('id', organization_id);

        if (fallbackError) {
          console.error('Failed to update org plan after trial_ends_at fallback:', fallbackError);
          return NextResponse.json(
            { error: 'Membership created but plan setup failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          trial_ends_at: null,
          trial_warning: 'trial_ends_at column missing; migration must be applied to persist trial expiry.',
        });
      }

      console.error('Failed to update org trial:', orgError);
      return NextResponse.json(
        { error: 'Membership created but trial setup failed' },
        { status: 500 }
      );
    }

    console.log(`Org claim activated: org=${organization_id} user=${user_id} trial_ends=${trialEndsAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      trial_ends_at: trialEndsAt.toISOString(),
    });
  } catch (error) {
    console.error('Error activating org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
