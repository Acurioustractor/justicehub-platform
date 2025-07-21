export const budgetTrackerConfig = {
  supabase: {
    url: process.env.QJT_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey: process.env.QJT_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.QJT_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  apis: {
    firecrawl: {
      apiKey: process.env.QJT_FIRECRAWL_API_KEY,
      baseUrl: 'https://api.firecrawl.dev/v0',
    },
    parliament: {
      apiKey: process.env.QJT_PARLIAMENT_API_KEY,
      baseUrl: 'https://www.parliament.qld.gov.au/api',
    },
  },
  scraping: {
    userAgent: process.env.SCRAPER_USER_AGENT || 'JusticeHub-BudgetTracker/1.0',
    delay: parseInt(process.env.SCRAPER_DELAY_MS || '1000'),
    timeout: parseInt(process.env.SCRAPER_TIMEOUT_MS || '30000'),
    headless: process.env.NODE_ENV === 'production',
    sources: {
      treasury: 'https://budget.qld.gov.au',
      parliament: 'https://www.parliament.qld.gov.au',
      courts: 'https://www.courts.qld.gov.au',
      police: 'https://www.police.qld.gov.au',
    },
  },
  scheduling: {
    enabled: process.env.NODE_ENV === 'production',
    dailyScrape: '0 6 * * *', // 6 AM daily
    weeklyReport: '0 8 * * 1', // 8 AM Monday
  },
  features: {
    enabled: process.env.ENABLE_BUDGET_TRACKER === 'true',
    autoScraping: process.env.ENABLE_WEB_SCRAPING === 'true',
    realTimeAlerts: true,
    dataExport: true,
    visualization: true,
  },
  alerts: {
    budgetThreshold: 1000000, // Alert on $1M+ changes
    emailNotifications: process.env.NODE_ENV === 'production',
    webhookUrl: process.env.QJT_WEBHOOK_URL,
  },
} as const;

export type BudgetTrackerConfig = typeof budgetTrackerConfig;