import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCapabilityProfile,
  fundingOsErrorResponse,
  listCapabilityProfiles,
  requireAdminUser,
  upsertCapabilityProfile,
  type CapabilityProfileInput,
  type CapabilitySignalInput,
} from '@/lib/funding/funding-operating-system';

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function parseSignals(value: unknown): CapabilitySignalInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((signal) => {
    const record = signal as Record<string, unknown>;
    return {
      signalType: String(record.signalType || ''),
      signalName: String(record.signalName || ''),
      signalScore:
        typeof record.signalScore === 'number' ? record.signalScore : undefined,
      signalWeight:
        typeof record.signalWeight === 'number' ? record.signalWeight : undefined,
      sourceKind:
        typeof record.sourceKind === 'string' ? record.sourceKind : undefined,
      evidenceUrl:
        typeof record.evidenceUrl === 'string' ? record.evidenceUrl : undefined,
      evidenceNote:
        typeof record.evidenceNote === 'string' ? record.evidenceNote : undefined,
      recordedAt:
        typeof record.recordedAt === 'string' ? record.recordedAt : undefined,
      expiresAt:
        typeof record.expiresAt === 'string' ? record.expiresAt : undefined,
    };
  });
}

function toCapabilityProfileInput(body: Record<string, unknown>): CapabilityProfileInput {
  return {
    organizationId: String(body.organizationId || ''),
    serviceGeographies: parseStringArray(body.serviceGeographies),
    priorityPopulations: parseStringArray(body.priorityPopulations),
    capabilityTags: parseStringArray(body.capabilityTags),
    operatingModels: parseStringArray(body.operatingModels),
    livedExperienceLed: body.livedExperienceLed === true,
    firstNationsLed: body.firstNationsLed === true,
    annualRevenueBand:
      typeof body.annualRevenueBand === 'string' ? body.annualRevenueBand : null,
    fundingReadinessScore:
      typeof body.fundingReadinessScore === 'number' ? body.fundingReadinessScore : undefined,
    complianceReadinessScore:
      typeof body.complianceReadinessScore === 'number'
        ? body.complianceReadinessScore
        : undefined,
    deliveryConfidenceScore:
      typeof body.deliveryConfidenceScore === 'number'
        ? body.deliveryConfidenceScore
        : undefined,
    communityTrustScore:
      typeof body.communityTrustScore === 'number' ? body.communityTrustScore : undefined,
    evidenceMaturityScore:
      typeof body.evidenceMaturityScore === 'number'
        ? body.evidenceMaturityScore
        : undefined,
    reportingToCommunityScore:
      typeof body.reportingToCommunityScore === 'number'
        ? body.reportingToCommunityScore
        : undefined,
    unrestrictedFundingNeed:
      typeof body.unrestrictedFundingNeed === 'number'
        ? body.unrestrictedFundingNeed
        : undefined,
    dgrStatus: typeof body.dgrStatus === 'string' ? body.dgrStatus : null,
    abn: typeof body.abn === 'string' ? body.abn : null,
    canManageGovernmentContracts: body.canManageGovernmentContracts === true,
    canManagePhilanthropicGrants: body.canManagePhilanthropicGrants !== false,
    lastCapabilityReviewAt:
      typeof body.lastCapabilityReviewAt === 'string'
        ? body.lastCapabilityReviewAt
        : null,
    nextCapabilityReviewAt:
      typeof body.nextCapabilityReviewAt === 'string'
        ? body.nextCapabilityReviewAt
        : null,
    capabilityNotes:
      typeof body.capabilityNotes === 'string' ? body.capabilityNotes : null,
    supportingEvidence:
      body.supportingEvidence && typeof body.supportingEvidence === 'object'
        ? (body.supportingEvidence as Record<string, unknown>)
        : {},
    metadata:
      body.metadata && typeof body.metadata === 'object'
        ? (body.metadata as Record<string, unknown>)
        : {},
    signals: parseSignals(body.signals),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);
    const profiles = await listCapabilityProfiles({
      organizationId: url.searchParams.get('organizationId') || undefined,
      includeSignals: url.searchParams.get('includeSignals') !== 'false',
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: profiles,
      count: profiles.length,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const profile = await upsertCapabilityProfile(toCapabilityProfileInput(body), admin.id);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const profile = await upsertCapabilityProfile(toCapabilityProfileInput(body), admin.id);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const url = new URL(request.url);
    const result = await deleteCapabilityProfile(
      {
        profileId: url.searchParams.get('id') || undefined,
        organizationId: url.searchParams.get('organizationId') || undefined,
      },
      admin.id
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
