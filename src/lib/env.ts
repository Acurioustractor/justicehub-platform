const missing = (name: string) =>
  `Missing environment variable ${name}. Set it in .env.local (see .env.example).`;

export const env = {
  notionToken: process.env.NOTION_API_TOKEN,
  nominationDatabaseId: process.env.NOTION_NOMINATION_DB_ID,
  bookingDatabaseId: process.env.NOTION_BOOKING_DB_ID,
  campaignEndDate: process.env.CAMPAIGN_END_DATE ?? "2025-10-22",
  initialNominationCount: Number(process.env.INITIAL_NOMINATION_COUNT ?? 1247),
  initialSlotTotal: Number(process.env.INITIAL_SLOT_TOTAL ?? 24),
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  ENABLE_WEB_SCRAPING: process.env.ENABLE_WEB_SCRAPING === "true",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

export function assertServerEnv() {
  if (!env.notionToken) {
    throw new Error(missing("NOTION_API_TOKEN"));
  }
  if (!env.nominationDatabaseId) {
    throw new Error(missing("NOTION_NOMINATION_DB_ID"));
  }
  if (!env.bookingDatabaseId) {
    throw new Error(missing("NOTION_BOOKING_DB_ID"));
  }
}
