const missing = (name: string) =>
  `Missing environment variable ${name}. Set it in .env.local (see .env.example).`;

export const env = {
  notionToken: process.env.NOTION_API_TOKEN,
  nominationDatabaseId: process.env.NOTION_NOMINATION_DB_ID,
  bookingDatabaseId: process.env.NOTION_BOOKING_DB_ID,
  campaignEndDate: process.env.CAMPAIGN_END_DATE ?? "2025-10-22",
  initialNominationCount: Number(process.env.INITIAL_NOMINATION_COUNT ?? 1247),
  initialSlotTotal: Number(process.env.INITIAL_SLOT_TOTAL ?? 24),
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
