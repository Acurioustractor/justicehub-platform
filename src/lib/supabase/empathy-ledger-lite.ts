import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * Empathy Ledger Lite Client
 *
 * Read operations now prefer v2 API. Supabase clients kept for write operations.
 */

const empathyLedgerUrl = process.env.EMPATHY_LEDGER_URL;
const empathyLedgerApiKey = process.env.EMPATHY_LEDGER_API_KEY;
const empathyLedgerServiceKey = process.env.EMPATHY_LEDGER_SERVICE_KEY;
export const EMPATHY_LEDGER_ENV_ERROR =
  'Missing required env: EMPATHY_LEDGER_URL and EMPATHY_LEDGER_API_KEY';

type EmpathyLedgerLiteClient = SupabaseClient<any, 'public', any>;

const configuredEmpathyLedgerClient: EmpathyLedgerLiteClient | null =
  empathyLedgerUrl && empathyLedgerApiKey
    ? createClient<any>(empathyLedgerUrl, empathyLedgerApiKey)
    : null;

const configuredEmpathyLedgerServiceClient: EmpathyLedgerLiteClient | null =
  empathyLedgerUrl && empathyLedgerServiceKey
    ? createClient<any>(empathyLedgerUrl, empathyLedgerServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export const isEmpathyLedgerConfigured = isV2Configured || Boolean(configuredEmpathyLedgerClient);
export const isEmpathyLedgerWriteConfigured = Boolean(configuredEmpathyLedgerServiceClient);
export const empathyLedgerServiceClient = configuredEmpathyLedgerServiceClient;

export const empathyLedgerClient = (configuredEmpathyLedgerClient ??
  new Proxy(
    {},
    {
      get() {
        throw new Error(EMPATHY_LEDGER_ENV_ERROR);
      },
    }
  )) as EmpathyLedgerLiteClient;

