import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

export const isEmpathyLedgerConfigured = Boolean(configuredEmpathyLedgerClient);
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

export async function getFeaturedJusticeStories(limit = 6) {
  const { data, error } = await empathyLedgerClient
    .from('stories')
    .select('id, title, summary, content, story_image_url, story_category, is_featured, published_at, themes')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .eq('is_featured', true)
    .or('themes.cs.{youth-justice},themes.cs.{justice},themes.cs.{community}')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured justice stories:', error);
    return [];
  }

  return data || [];
}
