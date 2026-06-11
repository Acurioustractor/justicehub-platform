-- ============================================================================
-- Consolidated migration: create the eight campaign/capture tables that live
-- API routes write to and read from, but which were never applied to
-- production. Audited against CURRENT code in src/ on 2026-06-11, and
-- cross-referenced with the unapplied repo migrations:
--   20260106000002_week_sprint.sql
--   20260106000003_week_sprint_tables.sql
--   20260111000001_add_metadata_to_registrations.sql
--   20260303000001_contact_submissions_and_inquiry_type.sql
--   20260306000004_project_backers.sql / 20260306000005_backer_enhancements.sql
--   20260307000001_campaign_nominations.sql
--   20260307000002_tour_infrastructure.sql
--   20260307000003_tour_stories.sql
--   20260316000003_community_reflections.sql
--   20260318000001_device_enrollment.sql (community_reflections.device_session_id)
--
-- Where code and the old migrations disagree, the CODE wins:
--   * event_registrations.event_id NULLABLE (/api/ghl/register sends null when
--     no event row matches; 20260106000003 had NOT NULL)
--   * NO UNIQUE(event_id, email) on event_registrations (route does a plain
--     .insert(); the 20260106000003 unique would 500 a re-registration)
--   * event_registrations.metadata JSONB (register route writes it; webhook
--     route updates it)
--   * newsletter_subscriptions gains source, metadata, created_at,
--     last_campaign_sent_at (register/newsletter/crm/momentum/send-campaign/
--     welcome-drip routes read or write all four; absent from 20260106000003)
--   * tour_stories.project_id NULLABLE (/api/contained/tour-stories inserts
--     without it; 20260307000003 had NOT NULL)
--   * project_backers gains amount (admin CRM route selects it)
--   * tour_reactions gains comment (/admin/contained page selects it)
--
-- RLS: enabled on every table. Policies are added ONLY where a non-service
-- client touches the table (cookie/server client or browser client):
--   * admin SELECT on all six contact-bearing tables — /api/admin/contained/crm
--     and the /admin pages query through the cookie client as an admin user
--   * tour_stories: anon SELECT (approved+public) and anon INSERT (pending)
--     — /api/contained/tour-stops/[slug] and /api/contained/tour-stories use
--     the ANON server client; plus admin ALL for the moderation routes
--   * contact_submissions: admin ALL — /admin/inbox/inbox-table.tsx updates
--     and deletes through the BROWSER client
-- All public-facing inserts elsewhere go through the service-role client and
-- need no anon policies.
--
-- Every statement is idempotent (IF NOT EXISTS / DO guards), so this file is
-- safe both on production (tables absent) and on any environment where the
-- old migrations were partially applied.
-- ============================================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. event_registrations
--    Writes: /api/ghl/register (service) — insert
--            /api/ghl/webhook (service) — update metadata by ghl_contact_id
--    Reads:  /api/admin/contained/crm (cookie admin), /admin/inbox (service,
--            embeds event:events(title) via the event_id FK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  organization TEXT,
  ghl_contact_id TEXT,
  registration_status TEXT NOT NULL DEFAULT 'registered'
    CHECK (registration_status IN ('registered', 'confirmed', 'cancelled', 'attended')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Converge environments where an older variant of the table exists
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
  -- Code sends event_id: null — drop NOT NULL if a prior migration set it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_registrations'
      AND column_name = 'event_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE event_registrations ALTER COLUMN event_id DROP NOT NULL;
  END IF;
  -- Code does a plain insert — a unique(event_id, email) would break re-registration
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.event_registrations'::regclass
      AND conname = 'event_registrations_event_id_email_key'
  ) THEN
    ALTER TABLE event_registrations DROP CONSTRAINT event_registrations_event_id_email_key;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_ghl ON event_registrations(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created ON event_registrations(created_at DESC);

DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_registrations'
      AND policyname = 'Admins can read event registrations'
  ) THEN
    CREATE POLICY "Admins can read event registrations" ON event_registrations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 2. newsletter_subscriptions
--    Writes: /api/ghl/register, /api/ghl/newsletter, /api/ghl/signup (all
--            service) — UPSERT onConflict: 'email' (requires UNIQUE(email));
--            /api/ghl/webhook, /api/admin/send-campaign,
--            /api/cron/newsletter/welcome-drip (service) — updates
--    Reads:  /api/admin/contained/crm (cookie admin), /admin/inbox (service),
--            /api/admin/campaign-alignment/momentum (service, filters
--            created_at), /api/contained/social-proof (service),
--            /api/cron/campaign/engagement-scoring (service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  organization TEXT,
  subscription_type TEXT DEFAULT 'general'
    CHECK (subscription_type IN ('general', 'steward', 'researcher', 'youth')),
  source TEXT,
  ghl_contact_id TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_campaign_sent_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Converge environments where the 20260106000003 variant exists
ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS last_campaign_sent_at TIMESTAMPTZ;
ALTER TABLE newsletter_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- The upsert onConflict('email') requires this unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.newsletter_subscriptions'::regclass
      AND contype = 'u'
      AND conkey = (
        SELECT ARRAY[attnum] FROM pg_attribute
        WHERE attrelid = 'public.newsletter_subscriptions'::regclass AND attname = 'email'
      )
  ) THEN
    ALTER TABLE newsletter_subscriptions ADD CONSTRAINT newsletter_subscriptions_email_key UNIQUE (email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_newsletter_ghl ON newsletter_subscriptions(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON newsletter_subscriptions(created_at DESC);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'newsletter_subscriptions'
      AND policyname = 'Admins can read newsletter subscriptions'
  ) THEN
    CREATE POLICY "Admins can read newsletter subscriptions" ON newsletter_subscriptions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 3. campaign_nominations
--    Writes: /api/projects/[slug]/nominations POST (service) — insert
--    Reads:  same route GET (service), /api/contained/social-proof (service),
--            /api/cron/contained/post-experience (service),
--            /api/cron/campaign/engagement-scoring (service),
--            /api/admin/contained/crm + /admin pages (cookie admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES art_innovation(id),
  nominee_name TEXT NOT NULL,
  nominee_title TEXT,
  nominee_org TEXT,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  nominator_name TEXT,
  nominator_email TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nominations_project ON campaign_nominations(project_id);
CREATE INDEX IF NOT EXISTS idx_nominations_category ON campaign_nominations(category);
CREATE INDEX IF NOT EXISTS idx_nominations_created ON campaign_nominations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nominations_nominator_email ON campaign_nominations(nominator_email);

ALTER TABLE campaign_nominations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campaign_nominations'
      AND policyname = 'Admins can read campaign nominations'
  ) THEN
    CREATE POLICY "Admins can read campaign nominations" ON campaign_nominations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. tour_reactions
--    Writes: /api/projects/[slug]/reactions POST (service) — insert
--    Reads:  same route GET (service), /api/admin/campaign-alignment/momentum
--            (service), /api/admin/contained/crm + /admin/contained (cookie
--            admin; the page selects a `comment` column — kept nullable so the
--            query does not error)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tour_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES art_innovation(id),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  reaction TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN DEFAULT true,
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tour_reactions ADD COLUMN IF NOT EXISTS comment TEXT;

CREATE INDEX IF NOT EXISTS idx_tour_reactions_project ON tour_reactions(project_id);
CREATE INDEX IF NOT EXISTS idx_tour_reactions_event ON tour_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_tour_reactions_created ON tour_reactions(created_at DESC);

ALTER TABLE tour_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour_reactions'
      AND policyname = 'Admins can read tour reactions'
  ) THEN
    CREATE POLICY "Admins can read tour reactions" ON tour_reactions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 5. tour_stories
--    Writes: /api/projects/[slug]/tour-stories POST (service) — insert with
--            project_id; /api/contained/tour-stories POST (ANON server
--            client) — insert WITHOUT project_id, status='pending';
--            /api/admin/contained/stories/[id] PATCH (cookie admin) — update
--            status + reviewed_at
--    Reads:  /api/projects/[slug]/tour-stories GET (service);
--            /api/contained/tour-stops/[slug] GET (ANON server client,
--            approved + public only); /api/admin/contained/stories +
--            /api/admin/contained/crm + /admin/contained (cookie admin);
--            /api/admin/stories/unified (service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tour_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES art_innovation(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  tour_stop TEXT NOT NULL,
  story TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Converge environments where 20260307000003 (project_id NOT NULL) was applied
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tour_stories'
      AND column_name = 'project_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE tour_stories ALTER COLUMN project_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tour_stories_project_status ON tour_stories(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tour_stories_status ON tour_stories(status);
CREATE INDEX IF NOT EXISTS idx_tour_stories_created ON tour_stories(created_at DESC);

ALTER TABLE tour_stories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- /api/contained/tour-stops/[slug] reads with the anon client
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour_stories'
      AND policyname = 'Public can read approved tour stories'
  ) THEN
    CREATE POLICY "Public can read approved tour stories" ON tour_stories
      FOR SELECT USING (status = 'approved' AND is_public = true);
  END IF;

  -- /api/contained/tour-stories inserts with the anon client; constrain to
  -- pending so anonymous submissions can never self-approve
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour_stories'
      AND policyname = 'Anyone can submit tour stories'
  ) THEN
    CREATE POLICY "Anyone can submit tour stories" ON tour_stories
      FOR INSERT WITH CHECK (status = 'pending');
  END IF;

  -- Admin moderation routes use the cookie client (select all statuses, update)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tour_stories'
      AND policyname = 'Admins can manage tour stories'
  ) THEN
    CREATE POLICY "Admins can manage tour stories" ON tour_stories
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 6. project_backers
--    Writes: /api/projects/[slug]/backers POST (service) — UPSERT
--            onConflict: 'project_id,email' (requires UNIQUE(project_id, email))
--    Reads:  same route GET (service), /api/admin/contained/crm (cookie
--            admin; selects `amount`), /admin/contained (cookie admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_backers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES art_innovation(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  amount NUMERIC,
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, email)
);

-- Converge environments where 20260306000004/5 were applied without amount
ALTER TABLE project_backers ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE project_backers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE project_backers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- The upsert onConflict('project_id,email') requires this unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.project_backers'::regclass
      AND contype = 'u'
      AND conname = 'project_backers_project_id_email_key'
  ) THEN
    ALTER TABLE project_backers ADD CONSTRAINT project_backers_project_id_email_key UNIQUE (project_id, email);
  END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN
  NULL; -- constraint already exists under the inline-created name
END $$;

CREATE INDEX IF NOT EXISTS idx_project_backers_created ON project_backers(created_at DESC);

ALTER TABLE project_backers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_backers'
      AND policyname = 'Admins can read project backers'
  ) THEN
    CREATE POLICY "Admins can read project backers" ON project_backers
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 7. contact_submissions
--    Writes: /api/contact, /api/contained/host, /api/contained/connect (all
--            service) — inserts; /admin/inbox/inbox-table.tsx (BROWSER client,
--            admin user) — UPDATE status + DELETE
--    Reads:  /admin/inbox (service), /admin (cookie admin counts),
--            /api/cron/campaign/engagement-scoring (service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  organization TEXT,
  organization_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_org_id ON contact_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- /admin/inbox status updates + deletes run through the browser client as
  -- an authenticated admin; /admin dashboard counts run through the cookie
  -- client. FOR ALL covers select/update/delete (inserts come via service).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_submissions'
      AND policyname = 'Admins can manage contact submissions'
  ) THEN
    CREATE POLICY "Admins can manage contact submissions" ON contact_submissions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 8. community_reflections
--    Writes: /api/authority/reflections POST (service) — insert name/location/
--              reflection/city_nomination, is_approved=false
--            /api/contained/reflections POST (service) — insert with
--              device_session_id (from device_sessions via enrolled auth user)
--            /api/contained/reaction POST (service) — insert with metadata
--              {type:'contained_reaction', email, feelings, would_nominate}
--            /api/contained/mp-letter POST (service) — insert with metadata
--              {type:'mp_letter', mp_name, ...}; reflection holds the full
--              letter body
--            /api/cron/contained/post-experience (service) — updates metadata
--              (post_experience_sent drip markers)
--    Reads:  /api/authority/reflections GET (service, approved only, paginated)
--            /api/contained/reflections GET (service, approved only)
--            /api/contained/social-proof (service) — counts by
--              metadata->>type ('contained_reaction' / 'mp_letter'); feeds the
--              /contained/what-now live counters
--            /api/contained/mp-letter (service) — counts by metadata->>type
--              + metadata->>mp_name
--            /api/cron/campaign/engagement-scoring (service) —
--              metadata->>email / metadata->>type
--
-- Where code and 20260316000003 disagree, the CODE wins:
--   * metadata JSONB added — reaction/mp-letter/social-proof/post-experience/
--     engagement-scoring all write or filter on it; absent from the old
--     migration
--   * NO CHECK (char_length(reflection) <= 500) — /api/contained/mp-letter
--     stores the full filled letter template and /api/contained/reaction
--     stores feelings + up-to-1000-char response, both routinely over 500
--     chars; the old check would 500 those routes. The 500-char limit is
--     enforced in the two routes that want it (authority + contained
--     reflections validate before insert).
--   * device_session_id (20260318000001) folded in, guarded so the FK is only
--     created when device_sessions exists in the target environment
--
-- RLS: enabled, NO policies. Every read and write path above runs through the
-- service-role client (including /api/authority/reflections, which builds a
-- raw service-key client). The old migration's anon SELECT/INSERT policies are
-- deliberately NOT carried over: no anon client touches this table, and the
-- old INSERT WITH CHECK (true) would let anyone holding the publishable anon
-- key write rows (including is_approved=true spam) directly.
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  reflection TEXT NOT NULL,
  city_nomination TEXT,
  is_approved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Converge environments where the 20260316000003 variant exists
ALTER TABLE community_reflections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
-- Drop the old 500-char check if a prior migration created it (code inserts
-- letter bodies and reaction composites well over 500 chars)
ALTER TABLE community_reflections DROP CONSTRAINT IF EXISTS community_reflections_reflection_check;

-- device_session_id (from 20260318000001): FK only when device_sessions exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'device_sessions'
  ) THEN
    ALTER TABLE community_reflections
      ADD COLUMN IF NOT EXISTS device_session_id UUID REFERENCES device_sessions(id);
  ELSE
    ALTER TABLE community_reflections
      ADD COLUMN IF NOT EXISTS device_session_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_reflections_approved
  ON community_reflections (is_approved, created_at DESC);
-- social-proof / mp-letter / engagement-scoring all filter on metadata->>'type'
CREATE INDEX IF NOT EXISTS idx_community_reflections_meta_type
  ON community_reflections ((metadata->>'type'));

ALTER TABLE community_reflections ENABLE ROW LEVEL SECURITY;
