-- State procurement tenders (NSW eTendering, VIC Buying for Victoria, QLD QTenders)
CREATE TABLE IF NOT EXISTS state_tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'nsw_etender', 'vic_buying', 'qld_qtenders'
  source_id TEXT, -- original tender ID from the portal
  title TEXT NOT NULL,
  description TEXT,
  contract_value NUMERIC,
  currency TEXT DEFAULT 'AUD',
  status TEXT, -- 'open', 'closed', 'awarded'
  category TEXT,
  state TEXT NOT NULL, -- 'NSW', 'VIC', 'QLD'

  -- Buyer (government agency)
  buyer_name TEXT,
  buyer_department TEXT,

  -- Supplier (if awarded)
  supplier_name TEXT,
  supplier_abn TEXT,

  -- Dates
  published_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  awarded_date TIMESTAMPTZ,

  -- Justice relevance
  is_justice_related BOOLEAN DEFAULT false,
  justice_keywords TEXT[], -- which keywords matched
  alma_organization_id UUID REFERENCES organizations(id),

  -- Source
  source_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_state_tenders_source ON state_tenders(source);
CREATE INDEX IF NOT EXISTS idx_state_tenders_state ON state_tenders(state);
CREATE INDEX IF NOT EXISTS idx_state_tenders_justice ON state_tenders(is_justice_related) WHERE is_justice_related = true;
CREATE INDEX IF NOT EXISTS idx_state_tenders_supplier_abn ON state_tenders(supplier_abn) WHERE supplier_abn IS NOT NULL;
