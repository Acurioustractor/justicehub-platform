-- Migration: Seed Mount Druitt Campaign Data (The "Golden Record")
-- Description: Consolidates scattered data into a single definitive source for Mounty Yarns.

DO $$
DECLARE
  v_org_id UUID := '11111111-1111-1111-1111-111111111003';
  v_program_id UUID;
  v_isaiah_id UUID;
  v_video_story_id UUID;
BEGIN
  -- 0. Schema Repair: Ensure organizations table has required columns
  -- The local DB schema seems to have drifted from initial_schema.sql
  
  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'updated_at') THEN
    ALTER TABLE organizations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- slug
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'slug') THEN
    ALTER TABLE organizations ADD COLUMN slug TEXT;
    -- Populate slug for existing rows to avoid unique constraint failure
    UPDATE organizations SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g')) WHERE slug IS NULL;
    ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
    ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
  END IF;

  -- type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'type') THEN
    ALTER TABLE organizations ADD COLUMN type TEXT DEFAULT 'community';
  END IF;

  -- description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'description') THEN
    ALTER TABLE organizations ADD COLUMN description TEXT;
  END IF;

  -- city
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'city') THEN
    ALTER TABLE organizations ADD COLUMN city TEXT;
  END IF;

  -- state
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'state') THEN
    ALTER TABLE organizations ADD COLUMN state TEXT;
  END IF;

  -- latitude
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'latitude') THEN
    ALTER TABLE organizations ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  -- longitude
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'longitude') THEN
    ALTER TABLE organizations ADD COLUMN longitude DECIMAL(11, 8);
  END IF;

  -- is_active
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_active') THEN
    ALTER TABLE organizations ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- verification_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'verification_status') THEN
    ALTER TABLE organizations ADD COLUMN verification_status TEXT DEFAULT 'pending';
  END IF;

  -- 0b. Schema Repair: Public Profiles
  -- full_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public_profiles ADD COLUMN full_name TEXT;
  END IF;

  -- bio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_profiles' AND column_name = 'bio') THEN
    ALTER TABLE public_profiles ADD COLUMN bio TEXT;
  END IF;

  -- role_tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_profiles' AND column_name = 'role_tags') THEN
    ALTER TABLE public_profiles ADD COLUMN role_tags TEXT[];
  END IF;

  -- is_public
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_profiles' AND column_name = 'is_public') THEN
    ALTER TABLE public_profiles ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;

  -- is_featured
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_profiles' AND column_name = 'is_featured') THEN
    ALTER TABLE public_profiles ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;


  -- 0c. Schema Repair: Community Programs
  -- approach
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_programs' AND column_name = 'approach') THEN
    ALTER TABLE community_programs ADD COLUMN approach TEXT;
  END IF;

  -- impact_summary
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_programs' AND column_name = 'impact_summary') THEN
    ALTER TABLE community_programs ADD COLUMN impact_summary TEXT;
  END IF;

  -- success_rate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_programs' AND column_name = 'success_rate') THEN
    ALTER TABLE community_programs ADD COLUMN success_rate INTEGER;
  END IF;

  -- tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_programs' AND column_name = 'tags') THEN
    ALTER TABLE community_programs ADD COLUMN tags TEXT[];
  END IF;

  -- is_featured
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_programs' AND column_name = 'is_featured') THEN
    ALTER TABLE community_programs ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;


  -- 0d. Schema Repair: Profile Connections
  -- public_profile_id in intersection table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_programs_profiles' AND column_name = 'public_profile_id') THEN
    ALTER TABLE community_programs_profiles ADD COLUMN public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE;
  END IF;

  -- Unique Constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_programs_profiles_program_public_profile_key') THEN
    ALTER TABLE community_programs_profiles ADD CONSTRAINT community_programs_profiles_program_public_profile_key UNIQUE (program_id, public_profile_id);
  END IF;


  -- 0e. Schema Repair: Stories (Comprehensive)
  -- excerpt
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'excerpt') THEN
    ALTER TABLE stories ADD COLUMN excerpt TEXT;
  END IF;

  -- story_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'story_type') THEN
    ALTER TABLE stories ADD COLUMN story_type TEXT DEFAULT 'personal';
  END IF;

  -- visibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'visibility') THEN
    ALTER TABLE stories ADD COLUMN visibility TEXT DEFAULT 'public';
  END IF;

  -- published_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'published_at') THEN
    ALTER TABLE stories ADD COLUMN published_at TIMESTAMPTZ;
  END IF;

  -- is_featured
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'is_featured') THEN
    ALTER TABLE stories ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  -- organization_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'organization_id') THEN
    ALTER TABLE stories ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'status') THEN
    ALTER TABLE stories ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;

  -- slug
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'slug') THEN
    ALTER TABLE stories ADD COLUMN slug TEXT;
    ALTER TABLE stories ADD CONSTRAINT stories_slug_key UNIQUE (slug);
  END IF;

  -- featured_image_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'featured_image_url') THEN
    ALTER TABLE stories ADD COLUMN featured_image_url TEXT;
  END IF;

  -- source_platform
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'source_platform') THEN
    ALTER TABLE stories ADD COLUMN source_platform TEXT DEFAULT 'empathy_ledger';
  END IF;

  -- participant_name (User environment has NOT NULL constraint)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'participant_name') THEN
    ALTER TABLE stories ADD COLUMN participant_name TEXT;
  END IF;


  -- 1. Upsert Organization (Mounty Yarns)
  INSERT INTO organizations (id, name, slug, type, description, city, state, latitude, longitude, is_active, verification_status)
  VALUES (
    v_org_id,
    'Mounty Yarns',
    'mounty-yarns',
    'community',
    'Mounty Yarns is a youth-led initiative in Mount Druitt, Western Sydney, on Darug Country. Operating through Just Reinvest NSW, Mounty Yarns amplifies lived-experience stories and collective solutions shared by Aboriginal young people to create a safer, fairer future for their community.',
    'Mount Druitt',
    'NSW',
    -33.7684,
    150.8205,
    true,
    'verified'
  )
  ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    city = EXCLUDED.city,
    updated_at = NOW();

  -- 2. Upsert Public Profile (Isaiah)
  -- We don't have a real Auth User for him yet, so we create a Managed Profile (no user_id initially)
  INSERT INTO public_profiles (full_name, bio, role_tags, is_public, is_featured)
  VALUES (
    'Isaiah',
    'Home. It brings everyone together. We''re all from different places, but close. Mount Druitt is home for a lot of us—non-Indigenous people and Indigenous people. It''s really diverse.',
    ARRAY['Youth Leader', 'Storyteller', 'Mounty Yarns'],
    true,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    bio = EXCLUDED.bio,
    is_featured = true
  RETURNING id INTO v_isaiah_id;

  -- 3. Upsert Community Program
  INSERT INTO community_programs (
    name,
    organization,
    location,
    state,
    approach,
    description,
    impact_summary,
    success_rate,
    is_featured,
    tags
  )
  VALUES (
    'Mounty Yarns Youth Justice Initiative',
    'Mounty Yarns',
    'Mount Druitt',
    'NSW',
    'Indigenous-led',
    'A youth-led movement building a "backyard campus" for community connection, storytelling, and justice reinvestment. The initiative focuses on diverting young people from the justice system through culture and connection.',
    'Grown from a single storyteller to a team of 20 young leaders. Successfully advocating for a dedicated Youth Justice Reinvestment site in Western Sydney.',
    95, -- High success/engagement
    true,
    ARRAY['Youth Justice', 'Storytelling', 'Place-Based', 'Darug Country']
  )
  -- No stable ID for programs usually, so we check by name or just insert. 
  -- Ideally we'd have a slug, but schema says name/org/location. 
  -- Let's check if exists by name to avoid duplicates.
  ON CONFLICT DO NOTHING;
  
  -- Retrieve ID (whether inserted or existing)
  SELECT id INTO v_program_id FROM community_programs WHERE name = 'Mounty Yarns Youth Justice Initiative' LIMIT 1;

  -- 4. Link Isaiah to Program
  INSERT INTO community_programs_profiles (program_id, public_profile_id, role, role_description, is_featured)
  VALUES (v_program_id, v_isaiah_id, 'Youth Leader', 'Founding member and key storyteller', true)
  ON CONFLICT (program_id, public_profile_id) DO UPDATE SET is_featured = true;

  -- 5. Seed Documentary Story (Using Dynamic SQL to handle schema drift safely)
  -- We use EXECUTE to correctly handle columns like 'participant_name' which might just have been added.
  EXECUTE format('
    INSERT INTO stories (
      organization_id,
      title,
      slug,
      content,
      excerpt,
      story_type,
      visibility,
      status,
      featured_image_url,
      is_featured,
      published_at,
      source_platform,
      participant_name
    )
    VALUES (
      %L, -- v_org_id
      ''Mounty Yarns: The Documentary'',
      ''mounty-yarns-documentary'',
      ''Full 24-minute documentary showcasing the journey of Mounty Yarns.'',
      ''A powerful look at youth-led justice reinvestment in Western Sydney.'',
      ''program_impact'',
      ''public'',
      ''published'',
      ''https://img.youtube.com/vi/placeholder/maxresdefault.jpg'',
      true,
      NOW(),
      ''empathy_ledger'',
      ''Mounty Yarns Community'' -- Satisfy NOT NULL constraint
    )
    ON CONFLICT (slug) DO UPDATE SET
      is_featured = true
    RETURNING id
  ', v_org_id) INTO v_video_story_id;

  -- 6. Link Story to Program
  -- Note: We assume story_related_programs schema is stable or handled by basic seed repairs
  INSERT INTO story_related_programs (story_id, program_id, relevance_note)
  VALUES (v_video_story_id, v_program_id, 'Official Documentary')
  ON CONFLICT (story_id, program_id) DO NOTHING;

  RAISE NOTICE '✅ Mount Druitt Campaign Data Seeded Successfully';
  RAISE NOTICE '   - Org ID: %', v_org_id;
  RAISE NOTICE '   - Program ID: %', v_program_id;
  RAISE NOTICE '   - Isaiah ID: %', v_isaiah_id;

END $$;
