/**
 * Type definitions for the scraping system
 */

export interface ScrapedService {
  // Essential fields
  name: string;
  description: string;
  categories: string[];

  // Organization
  organization_name: string;

  // Contact information
  contact_phone?: string;
  contact_email?: string;
  website_url?: string;

  // Location
  street_address?: string;
  locality?: string;
  city?: string;
  region?: string;
  state?: string;
  postcode?: string;

  // Service details
  eligibility_criteria?: string[];
  target_age_min?: number;
  target_age_max?: number;
  cost?: 'free' | 'subsidized' | 'fee_based' | 'unknown';
  delivery_method?: string[];
  operating_hours?: Record<string, string>;
  keywords?: string[];

  // Metadata
  youth_specific?: boolean;
  indigenous_specific?: boolean;
  languages_supported?: string[];

  // Quality assurance
  data_source: string;
  data_source_url: string;
  scrape_confidence_score: number;
  extraction_notes?: string;
}

export interface ScrapeResult {
  success: boolean;
  services: ScrapedService[];
  errors?: string[];
  metadata: {
    source_url: string;
    scraped_at: string;
    total_found: number;
    total_extracted: number;
  };
}

export interface ScraperConfig {
  url: string;
  name: string;
  selectors?: {
    container?: string;
    title?: string;
    description?: string;
    contact?: string;
  };
  useAI: boolean;
  headless: boolean;
}
