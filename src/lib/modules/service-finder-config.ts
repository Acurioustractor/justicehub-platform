export const serviceFinderConfig = {
  database: {
    url: process.env.YJSF_DATABASE_URL || process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
  },
  elasticsearch: {
    url: process.env.YJSF_ELASTICSEARCH_URL || 'http://localhost:9200',
    index: 'youth_services',
  },
  redis: {
    url: process.env.YJSF_REDIS_URL || process.env.REDIS_URL,
    keyPrefix: 'yjsf:',
  },
  apis: {
    firecrawl: {
      apiKey: process.env.YJSF_FIRECRAWL_API_KEY,
      baseUrl: 'https://api.firecrawl.dev/v0',
    },
    geocoding: {
      apiKey: process.env.YJSF_GEOCODING_API_KEY,
      provider: 'mapbox', // or 'google'
    },
  },
  scraping: {
    userAgent: process.env.SCRAPER_USER_AGENT || 'JusticeHub-ServiceFinder/1.0',
    delay: parseInt(process.env.SCRAPER_DELAY_MS || '1000'),
    timeout: parseInt(process.env.SCRAPER_TIMEOUT_MS || '30000'),
    headless: process.env.NODE_ENV === 'production',
  },
  features: {
    enabled: process.env.ENABLE_SERVICE_FINDER === 'true',
    autoScraping: process.env.ENABLE_WEB_SCRAPING === 'true',
    geolocation: true,
    caching: true,
  },
} as const;

export type ServiceFinderConfig = typeof serviceFinderConfig;