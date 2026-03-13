import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { assemblePlaceGovernedProofBundle } from '@/lib/governed-proof/place-assembler';
import { createGovernedProofService } from '@/lib/governed-proof/service';

function getPlaceKey(request: NextRequest): string | null {
  const placeKey = request.nextUrl.searchParams.get('placeKey')?.trim() ?? null;
  return placeKey && /^\d{4}$/.test(placeKey) ? placeKey : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const placeKey = getPlaceKey(request);
    if (!placeKey) {
      return NextResponse.json(
        { error: 'placeKey query param must be a valid 4-digit postcode' },
        { status: 400 }
      );
    }

    const governedProofService = createGovernedProofService();
    const bundle = await governedProofService.getBundleByKey(`place:${placeKey}`);
    const records = bundle
      ? await governedProofService.listBundleRecords(bundle.id)
      : [];
    const densitySummary = await governedProofService.listDensitySummary();

    return NextResponse.json({
      success: true,
      placeKey,
      bundle,
      records,
      densitySummary: densitySummary.filter((row) => row.subjectType === 'place'),
    });
  } catch (error) {
    console.error('Failed to fetch governed proof place bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch place bundle' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const placeKey = typeof body.placeKey === 'string' ? body.placeKey.trim() : '';
    if (!/^\d{4}$/.test(placeKey)) {
      return NextResponse.json(
        { error: 'placeKey must be a valid 4-digit postcode' },
        { status: 400 }
      );
    }

    const result = await assemblePlaceGovernedProofBundle({
      placeKey,
      actorId: admin.user.id,
      persist: body.persist !== false,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Failed to assemble governed proof place bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assemble place bundle' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const placeKey = typeof body.placeKey === 'string' ? body.placeKey.trim() : '';
    const action = typeof body.action === 'string' ? body.action.trim() : '';

    if (!/^\d{4}$/.test(placeKey)) {
      return NextResponse.json(
        { error: 'placeKey must be a valid 4-digit postcode' },
        { status: 400 }
      );
    }

    if (action !== 'queue_repair_refresh') {
      return NextResponse.json(
        { error: 'action must be queue_repair_refresh' },
        { status: 400 }
      );
    }

    const governedProofService = createGovernedProofService();
    const bundle = await governedProofService.getBundleByKey(`place:${placeKey}`);

    if (!bundle) {
      return NextResponse.json(
        { error: `No governed-proof bundle found for place:${placeKey}` },
        { status: 404 }
      );
    }

    const queuedTask = await governedProofService.queueRepairRefreshTask({
      targetType: 'place',
      targetId: placeKey,
      actorId: admin.user.id,
      bundleId: bundle.id,
      overallConfidence: bundle.overallConfidence,
      currentReviewStatus: bundle.reviewStatus,
      reason: typeof body.reason === 'string' ? body.reason.trim() : undefined,
    });

    const updatedBundle = await governedProofService.updateBundleStatus({
      bundleId: bundle.id,
      reviewStatus: 'pending',
      promotionStatus: 'internal',
    });

    return NextResponse.json({
      success: true,
      action,
      placeKey,
      bundle: updatedBundle,
      task: queuedTask.task,
      reusedExistingTask: queuedTask.reusedExistingTask,
    });
  } catch (error) {
    console.error('Failed to queue governed proof repair refresh:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to queue repair refresh' },
      { status: 500 }
    );
  }
}
