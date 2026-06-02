/**
 * Empathy Ledger SDK Client — accountability + consent + AI run logging.
 *
 * Per FY27 launch ops plan §7.2, the `/api/v1/accountability/*` endpoints
 * may not be live yet. This client stubs realistic responses when the
 * endpoint is unset or the breaker is open, so a JusticeHub render is never
 * blocked by an Empathy Ledger outage.
 *
 * Env:
 *   EMPATHY_LEDGER_ACCOUNTABILITY_URL  — base, e.g. https://empathy-ledger-v2.vercel.app/api/v1/accountability
 *   EL_ACCOUNTABILITY_TOKEN            — service token (per brief)
 *
 * TODO(post-launch): drop stub fallbacks when EL accountability endpoints ship.
 */

import { resilientFetch } from './clients/http-resilient';

function baseUrl(): string | null {
  return (
    process.env.EMPATHY_LEDGER_ACCOUNTABILITY_URL ??
    process.env.EMPATHY_LEDGER_URL ??
    null
  );
}

function authHeaders(): Record<string, string> {
  const token = process.env.EL_ACCOUNTABILITY_TOKEN ?? process.env.EMPATHY_LEDGER_SERVICE_KEY;
  return token
    ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
    : { 'content-type': 'application/json' };
}

export type EmpathyLedgerProduct =
  | 'justicehub-atlas'
  | 'justicehub-practice'
  | 'civicgraph'
  | 'goods'
  | 'act-core';

export interface AccountabilityEventInput {
  product: EmpathyLedgerProduct;
  eventType: string;
  actorId: string;
  subjectId?: string | null;
  /** Hash of the payload, not the payload itself — accountability log is metadata-only. */
  payloadHash?: string | null;
  /** ISO timestamp; defaults to now if omitted. */
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AccountabilityEventResult {
  ok: boolean;
  id?: string;
  degraded: boolean;
  error?: string;
}

export interface ConsentVerifyResult {
  ok: boolean;
  consentGranted: boolean;
  consentLevel?: 'public_commons' | 'community_controlled' | 'strictly_private' | 'unknown';
  subjectId?: string | null;
  expiresAt?: string | null;
  degraded: boolean;
  error?: string;
}

export interface AiRunLogInput {
  product: EmpathyLedgerProduct;
  runId: string;
  model: string;
  promptHash: string;
  responseHash?: string;
  tokensIn?: number;
  tokensOut?: number;
  costAud?: number;
  startedAt: string;
  finishedAt?: string;
  /** Free-form metadata for replay. Keep small — hashes preferred over raw text. */
  metadata?: Record<string, unknown>;
}

export const empathyLedgerClient = {
  /**
   * Log an accountability event into the Empathy Ledger sink. Best-effort:
   * if the sink is unreachable the call returns `{ ok: false, degraded: true }`
   * so callers can fall back to a local audit table without breaking flow.
   */
  async logEvent(input: AccountabilityEventInput): Promise<AccountabilityEventResult> {
    const base = baseUrl();
    if (!base) {
      return { ok: false, degraded: true, error: 'EMPATHY_LEDGER_ACCOUNTABILITY_URL unset' };
    }

    const result = await resilientFetch<{ id: string }>({
      url: `${base.replace(/\/$/, '')}/events`,
      init: {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          product: input.product,
          event_type: input.eventType,
          actor_id: input.actorId,
          subject_id: input.subjectId ?? null,
          payload_hash: input.payloadHash ?? null,
          occurred_at: input.occurredAt ?? new Date().toISOString(),
          metadata: input.metadata ?? {},
        }),
      },
      timeoutMs: 4_000,
    });

    return {
      ok: result.ok,
      id: result.data?.id,
      degraded: result.degraded,
      error: result.error,
    };
  },

  /**
   * Verify a consent token. When the sink is unreachable we DEFAULT TO DENY
   * (consentGranted: false) — refusing to render private data is safer than
   * leaking it. Callers must check `.degraded` before drawing conclusions.
   */
  async verifyConsent(token: string): Promise<ConsentVerifyResult> {
    const base = baseUrl();
    if (!base) {
      return {
        ok: false,
        consentGranted: false,
        degraded: true,
        error: 'EMPATHY_LEDGER_ACCOUNTABILITY_URL unset',
      };
    }
    if (!token) {
      return { ok: false, consentGranted: false, degraded: false, error: 'missing token' };
    }

    const result = await resilientFetch<{
      consent_granted: boolean;
      consent_level: ConsentVerifyResult['consentLevel'];
      subject_id: string;
      expires_at: string | null;
    }>({
      url: `${base.replace(/\/$/, '')}/consent/verify?token=${encodeURIComponent(token)}`,
      init: { headers: authHeaders() },
      cacheTtlMs: 60_000, // 1 minute — consent state must be fresh
      timeoutMs: 3_000,
    });

    if (!result.ok || !result.data) {
      return {
        ok: false,
        consentGranted: false, // fail closed
        degraded: result.degraded,
        error: result.error,
      };
    }

    return {
      ok: true,
      consentGranted: Boolean(result.data.consent_granted),
      consentLevel: result.data.consent_level,
      subjectId: result.data.subject_id,
      expiresAt: result.data.expires_at,
      degraded: false,
    };
  },

  /**
   * Append an AI run record (model + hashed prompt + cost) to the EL sink.
   * Used so any decision traceable to an AI call can be audited later.
   */
  async logAiRun(input: AiRunLogInput): Promise<AccountabilityEventResult> {
    const base = baseUrl();
    if (!base) {
      return { ok: false, degraded: true, error: 'EMPATHY_LEDGER_ACCOUNTABILITY_URL unset' };
    }

    const result = await resilientFetch<{ id: string }>({
      url: `${base.replace(/\/$/, '')}/ai-runs`,
      init: {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          product: input.product,
          run_id: input.runId,
          model: input.model,
          prompt_hash: input.promptHash,
          response_hash: input.responseHash ?? null,
          tokens_in: input.tokensIn ?? null,
          tokens_out: input.tokensOut ?? null,
          cost_aud: input.costAud ?? null,
          started_at: input.startedAt,
          finished_at: input.finishedAt ?? null,
          metadata: input.metadata ?? {},
        }),
      },
      timeoutMs: 4_000,
    });

    return {
      ok: result.ok,
      id: result.data?.id,
      degraded: result.degraded,
      error: result.error,
    };
  },
};
