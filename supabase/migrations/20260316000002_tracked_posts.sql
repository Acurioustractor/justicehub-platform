-- Tracked LinkedIn posts for continuous monitoring
CREATE TABLE IF NOT EXISTS campaign_tracked_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_url text UNIQUE NOT NULL,
  campaign_slug text DEFAULT 'contained',
  last_scraped_at timestamptz,
  total_comments integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
