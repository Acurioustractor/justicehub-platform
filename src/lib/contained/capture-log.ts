/**
 * Durable-first capture spine for the CONTAINED funnel.
 *
 * Every capture route (signup / connect / host) writes a contained_capture_log
 * row BEFORE it calls GoHighLevel, so a GHL failure (outage, 504, API error)
 * can never lose the lead — the 12 June 2026 loss this closes. After GHL and
 * the receipt succeed, the route backfills the row.
 *
 * Tolerance: if the table does not exist yet (migration not applied), writeCaptureLog
 * returns { captureId: null, tableMissing: true } WITHOUT throwing, so the routes
 * keep working in the pre-migration window. Any OTHER failure throws so the caller
 * can fail loud (HTTP 500) and the visitor is told their details were not saved.
 */

export interface CaptureLogInput {
  route: 'signup' | 'connect' | 'host';
  email: string;
  name?: string | null;
  role?: string | null;
  payload?: Record<string, unknown>;
}

export interface CaptureLogResult {
  captureId: string | null;
  tableMissing: boolean;
}

const UNDEFINED_TABLE = '42P01'; // Postgres: relation does not exist (pre-migration)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeCaptureLog(supabase: any, input: CaptureLogInput): Promise<CaptureLogResult> {
  const { data, error } = await supabase
    .from('contained_capture_log')
    .insert({
      route: input.route,
      email: input.email,
      name: input.name ?? null,
      role: input.role ?? null,
      payload: input.payload ?? {},
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === UNDEFINED_TABLE) {
      console.warn('[capture-log] contained_capture_log absent; skipping durable capture (apply the migration)');
      return { captureId: null, tableMissing: true };
    }
    throw error;
  }

  return { captureId: data.id as string, tableMissing: false };
}

/**
 * Backfill the GHL/receipt result onto a capture row. Best-effort: a failed
 * backfill never blocks the response. Uses await + try/catch (never .catch on a
 * Supabase builder, which silently no-ops).
 */
export async function backfillCaptureSync(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  captureId: string | null,
  fields: { ghl_contact_id?: string | null; ghl_synced?: boolean; receipt_sent?: boolean }
): Promise<void> {
  if (!captureId) return;
  try {
    await supabase.from('contained_capture_log').update(fields).eq('id', captureId);
  } catch (err) {
    console.error('[capture-log] backfill failed:', err);
  }
}
