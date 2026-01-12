# ALMA Database Schema

## Source Registry

```sql
CREATE TABLE alma_source_registry (
  id UUID PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  name TEXT,
  organization TEXT,
  source_type TEXT, -- government, indigenous, research, media, advocacy
  jurisdiction TEXT, -- VIC, QLD, NSW, NT, SA, WA, TAS, ACT, National

  -- Learning metrics
  last_scraped_at TIMESTAMPTZ,
  scrape_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  avg_entities_extracted DECIMAL(5,2),
  quality_score DECIMAL(5,2), -- 0-10

  -- Discovery
  discovered_from TEXT,
  discovered_at TIMESTAMPTZ,
  child_links TEXT[],

  -- Priority
  priority_score DECIMAL(5,2),
  next_scrape_at TIMESTAMPTZ,

  -- Cultural
  cultural_authority BOOLEAN DEFAULT FALSE,

  metadata JSONB
);
```

## Extraction Patterns

```sql
CREATE TABLE alma_extraction_patterns (
  id UUID PRIMARY KEY,
  source_type TEXT,
  pattern_name TEXT,
  extraction_prompt TEXT,
  success_rate DECIMAL(5,2),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Discovered Links

```sql
CREATE TABLE alma_discovered_links (
  id UUID PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  discovered_from TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, scraped, rejected, error
  priority INTEGER DEFAULT 0,
  rejection_reason TEXT,
  metadata JSONB
);
```
