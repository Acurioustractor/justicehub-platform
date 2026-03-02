import { NextRequest, NextResponse } from 'next/server';
import {
  createCommunityOutcomeValidation,
  createFundingOutcomeUpdate,
  fundingOsErrorResponse,
} from '@/lib/funding/funding-operating-system';
import { createServiceClient } from '@/lib/supabase/service';

const CONTRIBUTION_RATE_LIMIT = 8;
const CONTRIBUTION_RATE_WINDOW_MS = 60_000;
const contributionRateState = new Map<string, { count: number; resetAt: number }>();

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = String(request.headers.get('user-agent') || 'unknown').slice(0, 80);
  const ip = String(forwardedFor?.split(',')[0] || realIp || '').trim();
  return ip ? ip : `unknown:${userAgent}`;
}

function getRateLimitState(request: NextRequest) {
  const now = Date.now();
  const key = getClientIdentifier(request);
  const existing = contributionRateState.get(key);
  const active =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + CONTRIBUTION_RATE_WINDOW_MS,
        };

  active.count += 1;
  contributionRateState.set(key, active);

  const remaining = Math.max(CONTRIBUTION_RATE_LIMIT - active.count, 0);

  return {
    limited: active.count > CONTRIBUTION_RATE_LIMIT,
    headers: {
      'X-RateLimit-Limit': String(CONTRIBUTION_RATE_LIMIT),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(active.resetAt / 1000)),
      ...(active.count > CONTRIBUTION_RATE_LIMIT
        ? {
            'Retry-After': String(
              Math.max(Math.ceil((active.resetAt - now) / 1000), 1)
            ),
          }
        : {}),
    },
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  return NextResponse.json(body, {
    status: init.status,
    headers: init.headers,
  });
}

function parseOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function parseOptionalStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength))
    .filter((item) => /^https?:\/\//i.test(item));
}

function buildCommunityContextBlock(input: {
  contributorRole?: string | null;
  communityConnection?: string | null;
  communityLocation?: string | null;
  allowFollowUpContact?: boolean | null;
  followUpContactPreference?: string | null;
}) {
  const role = parseOptionalString(input.contributorRole, 120);
  const connection = parseOptionalString(input.communityConnection, 300);
  const location = parseOptionalString(input.communityLocation, 160);
  const followUpPreference = parseOptionalString(input.followUpContactPreference, 240);
  const parts = [
    role ? `Role: ${role}` : null,
    connection ? `Connection: ${connection}` : null,
    location ? `Location: ${location}` : null,
    input.allowFollowUpContact === true ? 'Follow-up contact: Yes' : null,
    input.allowFollowUpContact === false ? 'Follow-up contact: No' : null,
    input.allowFollowUpContact === true && followUpPreference
      ? `Follow-up preference: ${followUpPreference}`
      : null,
  ].filter(Boolean) as string[];

  if (parts.length === 0) {
    return {
      block: null,
      hasContext: false,
    };
  }

  return {
    block: `[Community context]\n${parts.join('\n')}`,
    hasContext: true,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ commitmentId: string }> }
) {
  const rateLimit = getRateLimitState(request);

  if (rateLimit.limited) {
    return jsonResponse(
      {
        error: 'Rate limit exceeded. Please wait a minute before submitting again.',
        category: 'rate_limit',
      },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const { commitmentId } = await context.params;
    const normalizedCommitmentId = String(commitmentId || '').trim();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const mode = String(body.mode || '').trim().toLowerCase();
    const honeypot = parseOptionalString(body.website, 200);

    if (!normalizedCommitmentId) {
      throw new Error('Validation: commitmentId is required');
    }

    if (honeypot) {
      return jsonResponse(
        {
          success: true,
          accepted: true,
          reviewState: 'screened_out',
        },
        { headers: rateLimit.headers }
      );
    }

    const serviceClient = createServiceClient() as any;

    const { data: commitment, error: commitmentError } = await serviceClient
      .from('funding_outcome_commitments')
      .select('id')
      .eq('id', normalizedCommitmentId)
      .maybeSingle();

    if (commitmentError) {
      throw new Error(commitmentError.message || 'Failed to load commitment');
    }

    if (!commitment) {
      throw new Error('Validation: Outcome commitment not found');
    }

    if (mode === 'update') {
      const normalizedUpdateType = String(body.updateType || '').trim().toLowerCase();
      const updateType = (
        ['baseline', 'progress', 'milestone', 'final', 'correction'].includes(
          normalizedUpdateType
        )
          ? normalizedUpdateType
          : 'progress'
      ) as 'baseline' | 'progress' | 'milestone' | 'final' | 'correction';
      const reportedValue = parseOptionalNumber(body.reportedValue);
      const confidenceScore = parseOptionalNumber(body.confidenceScore);
      const narrative = parseOptionalString(body.narrative, 2000);
      const evidenceUrls = parseOptionalStringArray(body.evidenceUrls, 6, 500);
      const communityContext = buildCommunityContextBlock({
        contributorRole:
          typeof body.contributorRole === 'string' || body.contributorRole === null
            ? (body.contributorRole as string | null)
            : null,
        communityConnection:
          typeof body.communityConnection === 'string' || body.communityConnection === null
            ? (body.communityConnection as string | null)
            : null,
        communityLocation:
          typeof body.communityLocation === 'string' || body.communityLocation === null
            ? (body.communityLocation as string | null)
            : null,
        allowFollowUpContact:
          typeof body.allowFollowUpContact === 'boolean'
            ? (body.allowFollowUpContact as boolean)
            : null,
        followUpContactPreference:
          typeof body.followUpContactPreference === 'string' ||
          body.followUpContactPreference === null
            ? (body.followUpContactPreference as string | null)
            : null,
      });
      const normalizedNarrative = communityContext.block
        ? [communityContext.block, narrative].filter(Boolean).join('\n\n')
        : narrative;

      if (
        confidenceScore !== null &&
        (confidenceScore < 0 || confidenceScore > 100)
      ) {
        throw new Error('Validation: confidenceScore must be between 0 and 100');
      }

      if (
        reportedValue === null &&
        !normalizedNarrative &&
        evidenceUrls.length === 0
      ) {
        throw new Error(
          'Validation: Provide a numeric value, narrative, or evidence link'
        );
      }

      const result = await createFundingOutcomeUpdate(
        {
          commitmentId: normalizedCommitmentId,
          updateType,
          reportedValue,
          reportedAt: typeof body.reportedAt === 'string' ? body.reportedAt : null,
          reportingPeriodStart:
            typeof body.reportingPeriodStart === 'string' ? body.reportingPeriodStart : null,
          reportingPeriodEnd:
            typeof body.reportingPeriodEnd === 'string' ? body.reportingPeriodEnd : null,
          narrative: normalizedNarrative,
          evidenceUrls,
          confidenceScore,
        },
        null
      );

      return jsonResponse(
        {
          success: true,
          mode,
          reviewState: 'community_submitted',
          ...result,
        },
        { headers: rateLimit.headers }
      );
    }

    if (mode === 'validation') {
      const updateId = String(body.updateId || '').trim();

      if (!updateId) {
        throw new Error('Validation: updateId is required');
      }

      const { data: update, error: updateError } = await serviceClient
        .from('funding_outcome_updates')
        .select('id, commitment_id')
        .eq('id', updateId)
        .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message || 'Failed to load outcome update');
      }

      if (!update || String(update.commitment_id || '') !== normalizedCommitmentId) {
        throw new Error('Validation: Outcome update does not belong to this commitment');
      }

      const normalizedValidatorKind = String(body.validatorKind || '')
        .trim()
        .toLowerCase();
      const validatorKind = (
        [
          'community_member',
          'community_board',
          'elder',
          'participant',
          'independent_evaluator',
          'funder',
        ].includes(normalizedValidatorKind)
          ? normalizedValidatorKind
          : 'community_member'
      ) as
        | 'community_member'
        | 'community_board'
        | 'elder'
        | 'participant'
        | 'independent_evaluator'
        | 'funder';
      const validationStatus = (
        ['confirmed', 'contested', 'mixed', 'needs_follow_up'].includes(
          String(body.validationStatus || '').trim().toLowerCase()
        )
          ? String(body.validationStatus || '').trim().toLowerCase()
          : 'confirmed'
      ) as 'confirmed' | 'contested' | 'mixed' | 'needs_follow_up';
      const validatorName = parseOptionalString(body.validatorName, 120);
      const validationNotes = parseOptionalString(body.validationNotes, 1500);
      const impactRating = parseOptionalNumber(body.impactRating);
      const trustRating = parseOptionalNumber(body.trustRating);
      const communityContext = buildCommunityContextBlock({
        contributorRole:
          typeof body.contributorRole === 'string' || body.contributorRole === null
            ? (body.contributorRole as string | null)
            : null,
        communityConnection:
          typeof body.communityConnection === 'string' || body.communityConnection === null
            ? (body.communityConnection as string | null)
            : null,
        communityLocation:
          typeof body.communityLocation === 'string' || body.communityLocation === null
            ? (body.communityLocation as string | null)
            : null,
        allowFollowUpContact:
          typeof body.allowFollowUpContact === 'boolean'
            ? (body.allowFollowUpContact as boolean)
            : null,
        followUpContactPreference:
          typeof body.followUpContactPreference === 'string' ||
          body.followUpContactPreference === null
            ? (body.followUpContactPreference as string | null)
            : null,
      });
      const normalizedValidationNotes = communityContext.block
        ? [communityContext.block, validationNotes].filter(Boolean).join('\n\n')
        : validationNotes;

      if (impactRating !== null && (impactRating < 1 || impactRating > 5)) {
        throw new Error('Validation: impactRating must be between 1 and 5');
      }

      if (trustRating !== null && (trustRating < 1 || trustRating > 5)) {
        throw new Error('Validation: trustRating must be between 1 and 5');
      }

      if (
        !validatorName &&
        !normalizedValidationNotes &&
        trustRating === null &&
        impactRating === null
      ) {
        throw new Error(
          'Validation: Provide a note, name, trust rating, or impact rating'
        );
      }

      const result = await createCommunityOutcomeValidation(
        {
          updateId,
          validatorKind,
          validatorName,
          validationStatus,
          validationNotes: normalizedValidationNotes,
          impactRating,
          trustRating,
          validatedAt: typeof body.validatedAt === 'string' ? body.validatedAt : null,
        },
        null
      );

      return jsonResponse(
        {
          success: true,
          mode,
          reviewState: 'community_submitted',
          ...result,
        },
        { headers: rateLimit.headers }
      );
    }

    throw new Error('Validation: mode must be update or validation');
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return jsonResponse(
      { error: response.error, category: response.status === 429 ? 'rate_limit' : undefined },
      { status: response.status, headers: rateLimit.headers }
    );
  }
}
