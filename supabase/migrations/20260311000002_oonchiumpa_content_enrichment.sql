-- =============================================================================
-- Oonchiumpa Content Enrichment
-- Seeds partner_storytellers, partner_photos, partner_videos, partner_stories,
-- and blog_posts with rich content from the Oonchiumpa source repository.
-- =============================================================================

-- Add display_order to partner_stories if not exists
ALTER TABLE partner_stories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Get the Oonchiumpa organization ID
DO $$
DECLARE
  v_org_id UUID;
  v_base_storage TEXT := 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public';
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'oonchiumpa' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Oonchiumpa organization not found. Ensure it exists with slug = oonchiumpa';
  END IF;

  -- =========================================================================
  -- 1. PARTNER STORYTELLERS (6 Oonchiumpa people only)
  -- =========================================================================
  DELETE FROM partner_storytellers WHERE organization_id = v_org_id;

  INSERT INTO partner_storytellers (organization_id, empathy_ledger_profile_id, display_name, role_at_org, bio_excerpt, avatar_url, is_featured, is_public, consent_level) VALUES
  (v_org_id, gen_random_uuid(), 'Kristy Bloomfield', 'Co-Founder & Director',
   'Kristy Bloomfield is a visionary leader and passionate advocate for Indigenous empowerment. As an Eastern Arrernte Traditional Owner, she brings cultural authority and deep connection to country into everything Oonchiumpa does.',
   '/images/orgs/oonchiumpa/team/kristy.jpg', true, true, 'public'),

  (v_org_id, gen_random_uuid(), 'Tanya Turner', 'Co-Founder & Director',
   'Tanya Turner is a proud Aboriginal woman from Central Australia whose journey reflects resilience and determination. She brings expertise in Indigenous justice, legal practice, and community development.',
   '/images/orgs/oonchiumpa/team/tanya.jpg', true, true, 'public'),

  (v_org_id, gen_random_uuid(), 'Aunty Bev and Uncle Terry', 'Cultural Advisors',
   'Aunty Bev and Uncle Terry are cherished custodians of Alice Springs'' vibrant history, deeply rooted in community resilience and cultural heritage.',
   NULL, true, true, 'public'),

  (v_org_id, gen_random_uuid(), 'Professor Helen Milroy', 'True Justice Partner - ANU',
   'Professor Helen Milroy leads the True Justice Initiative partnership with Oonchiumpa, focusing on deep listening and restorative justice approaches since 2022.',
   NULL, true, true, 'public'),

  (v_org_id, gen_random_uuid(), 'Max Bloomfield', 'Traditional Owner - Atnarpa Station',
   'Max Bloomfield is a Traditional Owner of Atnarpa (Loves Creek Station). His father Henry grew up at Atnarpa, and the family has maintained connection to this land through generations of cultural practice and ceremony.',
   NULL, true, true, 'public'),

  (v_org_id, gen_random_uuid(), 'Patricia Ann Miller AO', 'Traditional Owner',
   'Patricia Ann Miller AO is a Traditional Owner who has made significant contributions to Aboriginal rights, community development, and cultural preservation in Central Australia.',
   NULL, true, true, 'public');

  -- =========================================================================
  -- 2. PARTNER PHOTOS
  -- =========================================================================
  DELETE FROM partner_photos WHERE organization_id = v_org_id;

  -- Existing local photos
  INSERT INTO partner_photos (organization_id, title, photo_url, photo_type, location_name, is_featured, is_public, display_order) VALUES
  (v_org_id, 'Oonchiumpa Hero', '/images/orgs/oonchiumpa/hero.jpg', 'hero', 'Central Australia', true, true, 1),
  (v_org_id, 'Atnarpa Homestead', '/images/orgs/oonchiumpa/homestead.jpg', 'gallery', 'Atnarpa Station', true, true, 2),
  (v_org_id, 'ANU Law Students at Anzac Hill', '/images/orgs/oonchiumpa/law-students.jpg', 'gallery', 'Anzac Hill, Alice Springs', true, true, 3),
  (v_org_id, 'Mentoring Session', '/images/orgs/oonchiumpa/mentoring.jpg', 'gallery', 'Alice Springs', true, true, 4),

  -- Team photos
  (v_org_id, 'Kristy Bloomfield', '/images/orgs/oonchiumpa/team/kristy.jpg', 'profile', 'Alice Springs', false, true, 10),
  (v_org_id, 'Tanya Turner', '/images/orgs/oonchiumpa/team/tanya.jpg', 'profile', 'Alice Springs', false, true, 11),

  -- Atnarpa originals
  (v_org_id, 'Aerial view of Atnarpa Station', '/images/orgs/oonchiumpa/atnarpa/originals/20251103-DJI_0271.jpg', 'gallery', 'Atnarpa Station', true, true, 20),
  (v_org_id, 'Atnarpa landscape', '/images/orgs/oonchiumpa/atnarpa/originals/img-001.jpg', 'gallery', 'Atnarpa Station', false, true, 21),
  (v_org_id, 'Station surroundings', '/images/orgs/oonchiumpa/atnarpa/originals/img-004.jpg', 'gallery', 'Atnarpa Station', false, true, 22),
  (v_org_id, 'Red earth country', '/images/orgs/oonchiumpa/atnarpa/originals/img-009.jpg', 'gallery', 'Atnarpa Station', false, true, 23),
  (v_org_id, 'MacDonnell Ranges view', '/images/orgs/oonchiumpa/atnarpa/originals/img-013.jpg', 'gallery', 'Atnarpa Station', false, true, 24),
  (v_org_id, 'Station heritage', '/images/orgs/oonchiumpa/atnarpa/originals/img-018.jpg', 'gallery', 'Atnarpa Station', false, true, 25),
  (v_org_id, 'Atnarpa vista', '/images/orgs/oonchiumpa/atnarpa/originals/img-023.jpg', 'gallery', 'Atnarpa Station', false, true, 26),
  (v_org_id, 'Country view', '/images/orgs/oonchiumpa/atnarpa/originals/img-030.jpg', 'gallery', 'Atnarpa Station', false, true, 27),

  -- Campsite photos
  (v_org_id, 'Campsite at Atnarpa', '/images/orgs/oonchiumpa/atnarpa/campsite/20251103-1E5A4798.jpg', 'gallery', 'Atnarpa Campground', false, true, 30),
  (v_org_id, 'Campground facilities', '/images/orgs/oonchiumpa/atnarpa/campsite/20251103-1E5A4803.jpg', 'gallery', 'Atnarpa Campground', false, true, 31),
  (v_org_id, 'Accommodation at Atnarpa', '/images/orgs/oonchiumpa/atnarpa/campsite/20251103-1E5A4816.jpg', 'gallery', 'Atnarpa Campground', false, true, 32),
  (v_org_id, 'Camp gathering area', '/images/orgs/oonchiumpa/atnarpa/campsite/20251103-1E5A4819.jpg', 'gallery', 'Atnarpa Campground', false, true, 33),
  (v_org_id, 'Homestead map area', '/images/orgs/oonchiumpa/atnarpa/campsite/homestead-additional-map.jpg', 'gallery', 'Atnarpa Campground', false, true, 34),
  (v_org_id, 'Campsite overview', '/images/orgs/oonchiumpa/atnarpa/campsite/IMG_9412.jpg', 'gallery', 'Atnarpa Campground', false, true, 35),

  -- Good News Story images (Supabase-hosted)
  (v_org_id, 'Youth at Standley Chasm', v_base_storage || '/story-images/stories/084fcde5-0941-4f6e-9966-ec9c4b7116b3/2.png', 'event', 'Standley Chasm', true, true, 40),
  (v_org_id, 'Girls day at Standley Chasm', v_base_storage || '/story-images/stories/084fcde5-0941-4f6e-9966-ec9c4b7116b3/3.png', 'event', 'Standley Chasm', false, true, 41),
  (v_org_id, 'Basketball team', v_base_storage || '/story-images/stories/2c7a2131-c371-4ff5-8d83-b7707f412404/2.png', 'event', 'Alice Springs', false, true, 42),
  (v_org_id, 'Young fellas on country', v_base_storage || '/story-images/stories/bfde4125-ec37-4456-a1c5-b3b61a32eec0/2.png', 'event', 'MacDonnell Ranges', true, true, 43);

  -- =========================================================================
  -- 3. PARTNER VIDEOS (8 self-hosted from Supabase Storage)
  -- =========================================================================
  DELETE FROM partner_videos WHERE organization_id = v_org_id;

  INSERT INTO partner_videos (organization_id, title, description, video_url, platform, thumbnail_url, duration_seconds, video_type, is_featured, is_public) VALUES
  (v_org_id, 'Atnarpa Station — Drone Flyover',
   'Aerial drone footage over Atnarpa Homestead and the surrounding MacDonnell Ranges, showcasing the beauty of country east of Alice Springs.',
   v_base_storage || '/media/oonchiumpa/videos/header-dji-0323-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/header-dji-0323-light.jpg',
   15, 'documentary', true, true),

  (v_org_id, 'Working on Station — Part 1',
   'Station activities at Atnarpa — the family continuing their connection to land through daily work on the homestead.',
   v_base_storage || '/media/oonchiumpa/videos/work-on-station-01-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/work-on-station-01-light.jpg',
   60, 'documentary', false, true),

  (v_org_id, 'Working on Station — Part 2',
   'More activities on Atnarpa Station — maintaining the homestead and surrounding country.',
   v_base_storage || '/media/oonchiumpa/videos/work-on-station-02-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/work-on-station-02-light.jpg',
   75, 'documentary', false, true),

  (v_org_id, 'Working on Station — Part 3',
   'Continued station work and family activities at Atnarpa Homestead.',
   v_base_storage || '/media/oonchiumpa/videos/work-on-station-03-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/work-on-station-03-light.jpg',
   72, 'documentary', false, true),

  (v_org_id, 'Working on Station — Part 4',
   'The homestead and land management at Atnarpa — preserving heritage while building for the future.',
   v_base_storage || '/media/oonchiumpa/videos/work-on-station-04-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/work-on-station-04-light.jpg',
   95, 'documentary', false, true),

  (v_org_id, 'Working on Station — Short Clip',
   'A brief glimpse of station life at Atnarpa.',
   v_base_storage || '/media/oonchiumpa/videos/work-on-station-05-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/work-on-station-05-light.jpg',
   8, 'documentary', false, true),

  (v_org_id, 'Camp Life at Atnarpa',
   'Camp footage showing cultural activities, yarning circles, and community gathering at Atnarpa Homestead campground.',
   v_base_storage || '/media/oonchiumpa/videos/camp-cut-20s-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/camp-cut-20s-light.jpg',
   20, 'documentary', true, true),

  (v_org_id, 'Drone Follow — Camp to Homestead',
   'Aerial drone footage following the path from the campground to the historic homestead at Atnarpa Station, revealing the landscape and connection between old and new.',
   v_base_storage || '/media/oonchiumpa/videos/camp-to-house-drone-follow-light.mp4',
   'other', '/images/orgs/oonchiumpa/video-posters/camp-to-house-drone-follow-light.jpg',
   120, 'documentary', true, true);

  -- =========================================================================
  -- 4. PARTNER STORIES (6 Good News Stories + 4 youth success stories)
  -- =========================================================================
  DELETE FROM partner_stories WHERE organization_id = v_org_id;

  -- Good News Stories
  INSERT INTO partner_stories (organization_id, empathy_ledger_story_id, title, excerpt, thumbnail_url, story_type, is_featured, is_public, display_order) VALUES
  (v_org_id, gen_random_uuid(),
   'Young People Experience Hospitality at McDonald''s',
   'Mat and Chloe from McDonald''s provided young Aboriginal people with a welcoming store tour and hands-on experience making their own lunch. The young fellas felt genuinely welcomed and enjoyed making their dessert.',
   NULL, 'community_story', true, true, 1),

  (v_org_id, gen_random_uuid(),
   'Girls Day Out: Cultural Empowerment at Standley Chasm',
   'Four young Aboriginal girls — July, Tyreena, Jonika and Henrisha — enjoyed a day trip to Standley Chasm to see the work of traditional owners on their land. The experience empowered them to believe they too can achieve similar goals.',
   v_base_storage || '/story-images/stories/084fcde5-0941-4f6e-9966-ec9c4b7116b3/2.png',
   'on_country_experience', true, true, 2),

  (v_org_id, gen_random_uuid(),
   'Young Fellas Experience Cultural Connection at Standley Chasm',
   'Fred and Tyrone took young men Darius and Jayden on a cultural journey to Standley Chasm on western Arrernte country. The young fellas heard from Aboriginal tour guides and saw Aboriginal staff leading the way in cultural tourism.',
   v_base_storage || '/story-images/stories/bfde4125-ec37-4456-a1c5-b3b61a32eec0/2.png',
   'on_country_experience', true, true, 3),

  (v_org_id, gen_random_uuid(),
   'Young Women Discover Basketball Community',
   'Young Aboriginal women attended their first basketball game at the local stadium. All participants expressed desire to play next season — this was the first time some had ever been inside the basketball stadium.',
   v_base_storage || '/story-images/stories/2c7a2131-c371-4ff5-8d83-b7707f412404/2.png',
   'youth_success', true, true, 4),

  (v_org_id, gen_random_uuid(),
   'Healing Journey to Country at Atnarpa Station',
   'Three young Aboriginal men traveled to Atnarpa Station for a healing experience. Malachi was inspired to reconnect with his family''s language preservation efforts and later returned to his own country to host visitors.',
   '/images/orgs/oonchiumpa/homestead.jpg',
   'on_country_experience', true, true, 5),

  (v_org_id, gen_random_uuid(),
   'Returning Home to Atnarpa: The Bloomfield Family Journey',
   'The Bloomfield/Wiltshire family shares the historic journey of reclaiming Atnarpa (Loves Creek Station) — from the 1896 cattle station through to receiving Native Title in 2012. The family is restoring the 1933 homestead and developing cultural tourism.',
   '/images/orgs/oonchiumpa/atnarpa/originals/20251103-DJI_0271.jpg',
   'community_story', true, true, 6),

  -- Selected youth success stories (Jul-Dec 2024)
  (v_org_id, gen_random_uuid(),
   'From Disconnected Youth to Future Tourism Entrepreneur',
   'MS transformed from a disconnected young person with an offending history to someone developing their own cultural tourism venture. Through family connections and on-country experiences, MS found their identity and purpose.',
   NULL, 'youth_success', false, true, 7),

  (v_org_id, gen_random_uuid(),
   'From Homelessness to Independent Living',
   'After losing her father, M was living in unstable accommodation. Through Oonchiumpa''s support, M and her mother secured independent housing and M gained her own income.',
   NULL, 'youth_success', false, true, 8),

  (v_org_id, gen_random_uuid(),
   'Operation Luna Success: 95% Reduction in Youth Offending',
   'Of 21 young people referred by Operation Luna, only 1 remained on the case management list by December 2024 — a 95% reduction demonstrating the program''s effectiveness.',
   NULL, 'program_outcome', true, true, 9),

  (v_org_id, gen_random_uuid(),
   'Educational Transformation: 72% Return to School',
   'Despite 95% of participants being disengaged from school initially, 72% returned to school or alternative education pathways. Teachers observed increased motivation and 3 young people are now asking about employment.',
   NULL, 'program_outcome', true, true, 10);

  -- =========================================================================
  -- 5. BLOG POSTS (2 articles)
  -- =========================================================================
  -- Use blog_posts table for rich blog content

  INSERT INTO blog_posts (title, slug, excerpt, content, featured_image_url, status, published_at, tags, categories)
  VALUES
  ('Learning Law from the Land',
   'learning-law-from-the-land',
   'How ANU law students are discovering that the best lessons about justice happen on country, not in lecture halls. Oonchiumpa''s annual law program is transforming how future lawyers understand justice in Aboriginal Australia.',
   E'# Learning Law from the Land: When Legal Education Meets Cultural Authority\n\n*How ANU law students are discovering that the best lessons about justice happen on country, not in lecture halls*\n\n---\n\nThere''s a moment that Chelsea Kenneally, a law student from ANU, keeps coming back to. She''s sitting on country in Central Australia, not in a formal lecture theater, and Traditional Owners are sharing knowledge with her cohort.\n\n"They''re not lecturing at us in this formal sense," Chelsea reflects. "They''re sitting on the same level, conversing with us. That''s so beautiful because it comes from their passion for knowledge being passed down to them and now passing it on to us."\n\nThis is Oonchiumpa''s annual law program - now in its fourth year - and it''s transforming how future lawyers, policymakers, and government officials understand justice in Aboriginal Australia.\n\n## A Different Kind of Legal Education\n\nFor Adelaide Hayes, coming to the end of her law degree, the choice to participate was deliberate: "I wanted an experience that was genuinely enriching, genuinely challenging, and genuinely subversive."\n\nWhat she found exceeded expectations. "Working with elders and hearing their call to action has been transformative."\n\nThe program brings law students from the Australian National University to Alice Springs and onto country. But this isn''t a tourist experience or a superficial "cultural awareness" training. It''s an invitation into genuine relationship and deep learning.\n\nKristy Bloomfield, who leads the program with Oonchiumpa, explains the vision: "These young students are passionate. These young students have been working within government in Canberra. A lot of those students are in roles now making decisions for Central Australia. So it is really meaningful to have these young lawyers hear firsthand from our perspective here and not listening to the media narrative."\n\n## Beyond the Categories\n\nSuzie Ma, in her fifth year studying law and accounting at ANU, puts her finger on something crucial: "The law reduces people to categories and makes things really simplistic when in reality they''re not. Being on this country with these stunning views and learning our true history changes everything."\n\nThis is the shift that Oonchiumpa facilitates - from abstract legal categories to complex relational understanding.\n\nAidan Harris, studying law and public policy, emphasizes the stakes: "Learning about Aboriginal conceptions of law and kinship systems has been incredible. This program is so important for anyone going into a policy or legal role in government."\n\n## A Unique Approach\n\nWhat makes Oonchiumpa''s program different from other cultural education initiatives is its foundation in cultural authority. Kristy and her family are Traditional Owners. They''re not intermediaries or translators - they''re speaking from their own authority about their own country.\n\n"Coming from a cultural authority perspective, we''re able to lead this youth space and lead most of our programs and services," Kristy explains.\n\nThe program doesn''t just teach students about Aboriginal perspectives - it invites them into relationship with Traditional Owners who are actively leading change in Central Australia.\n\n## The Fourth Year and Beyond\n\nThis year marks the fourth iteration of the program, and Kristy notes a significant shift from the early days. The success is evident. Students consistently describe the experience as transformative. More importantly, relationships are being built between future policymakers and the communities their decisions will affect.\n\n"We definitely wanna be able to continue this partnership with ANU," Kristy says. "Being in Canberra where parliament is, these young students are passionate and many of them are going into roles making decisions for Central Australia."\n\nThe vision extends beyond ANU. "We''ve been asked by students whose parents are part of other universities that are interested as well. We''ve also spoken to hosting the Aboriginal judges, judiciary as well."\n\n## The Real Lesson\n\nPerhaps the most important lesson isn''t about Aboriginal law or culture - it''s about listening. About sitting on country and receiving knowledge with humility.\n\nAs Kristy puts it: "We wanna change that narrative. We want people to hear firsthand from our perspective, not listening to the media narrative."\n\nOonchiumpa is filling that gap, one relationship at a time, one cohort of students at a time, on country where the most important lessons have always been taught.\n\n---\n\n*Oonchiumpa''s law program runs annually, bringing law students from universities to Central Australia for intensive cultural and legal education led by Traditional Owners.*',
   '/images/orgs/oonchiumpa/law-students.jpg',
   'published', NOW(), ARRAY['oonchiumpa', 'true-justice', 'anu', 'law', 'cultural-education', 'on-country'], ARRAY['stories', 'partnerships'])
  ON CONFLICT (slug) DO UPDATE SET
    content = EXCLUDED.content,
    excerpt = EXCLUDED.excerpt,
    featured_image_url = EXCLUDED.featured_image_url,
    tags = EXCLUDED.tags,
    updated_at = NOW();

  INSERT INTO blog_posts (title, slug, excerpt, content, featured_image_url, status, published_at, tags, categories)
  VALUES
  ('Atnarpa: Coming Home to Country',
   'atnarpa-coming-home-to-country',
   'A story of reclamation, healing, and building generational wealth on Aboriginal land. The Bloomfield/Wiltshire family''s journey to reclaim their ancestral lands at Loves Creek Station.',
   E'# Atnarpa: Coming Home to Country at Loves Creek Station\n\n*A story of reclamation, healing, and building generational wealth on Aboriginal land*\n\n---\n\nThere''s a place east of Alice Springs where the red earth meets the sky, where a homestead built in 1933 stands testament to over a century of Aboriginal connection to country. This is Atnarpa - also known as Loves Creek Station - and it represents something profound: the journey of the Bloomfield/Wiltshire family to reclaim their ancestral lands and their vision for the future.\n\n## The History Lives in the Land\n\nAtnarpa''s story begins long before the cattle station was established in 1896. This land has always been home to the Bloomfield/Wiltshire family - a connection maintained through cultural ceremonies and rituals even when they were pushed away from their own country.\n\nThe old homestead itself tells a story. Built with rocks from the local area and clay from the swamps around Loves Creek, mixed with spinifex grass as a binder, its 2-foot-thick walls keep the house cool in summer and warm in winter.\n\nAs Kristy Bloomfield shares: "There''s a lot of heartache around the old homestead - the heartache of our granny being a slave out on our own country, the heartache of our father being fed in the water yard with the rest of the stockmen, the heartache of all our old people being out there on rations."\n\n## The Long Walk Home\n\nIn 1994, the Traditional Owners lodged their land claim. For 18 years, the family fought to have their connection to country legally recognized. Max Bloomfield remembers that time with deep respect: "Being part of the 1994 land claim was a privilege and unique experience. Family members listened to stories about the land and its significance, with traditional songs and dances sung around the campfire each night showing great respect for their land and heritage."\n\nThen, in July 2012, the moment arrived. The Land Title was handed back to the Traditional Owners.\n\n"That day was remarkable for all Loves Creek families," Max recalls. "Though sadly many elders were not there to witness this historic moment. Our elders would have been very proud of achieving land rights."\n\n## A Vision for the Future\n\nToday, Kristy and her family are working to restore the homestead and build something their old people would be proud of.\n\n"We''re in a position to make change and bring that generational wealth to our families on Aboriginal land," Kristy explains. "We want to be part of the cattle industry, which is a multimillion-dollar business. We want meaningful training development programs for our young people to gain employment out on the stock camp."\n\nThe vision extends beyond cattle. Atnarpa is becoming a cultural tourism destination where the family can share their heritage with visitors from around the world.\n\n## Healing Through Connection\n\nFor the young people Oonchiumpa works with, Atnarpa has become a place of transformation. On one memorable trip, three young Aboriginal men traveled to the homestead for a healing and connection to country experience.\n\nOne young man, Malachi, was particularly moved. Encouraged by his peers around the fire pit while cooking kangaroo tails, he began to explore his own cultural connections. Following that experience, Malachi returned to his own country with extended family members and became involved in hosting visitors and teaching about his homeland.\n\n## A Complex Pride\n\nWhen Kristy speaks about the homestead, there''s both pain and pride in her voice. "We wanna be able to share both sides of our history out there. Yes, some history isn''t great, but our strength and where we''ve gotten to is that amazing history of our Aboriginal history out there."\n\nThis is what self-determination looks like on the ground - not just words in a policy document, but Traditional Owners rebuilding on their own land, creating employment for their young people, and sharing their culture on their own terms.\n\n## The Legacy Continues\n\n"We know what we wanna do on our land, and we know how to get there," Kristy says with quiet determination. "It''s just about having our land councils, our government supporting us in delivering this and having culturally led programs with our own generational wealth on our land."\n\nAt Atnarpa, that self-determination is taking root in the red earth, growing stronger with each passing season.\n\n---\n\n*Atnarpa Homestead is located east of Alice Springs on the Ross Highway. The family welcomes visitors who wish to learn about their culture and connection to country.*',
   '/images/orgs/oonchiumpa/atnarpa/originals/20251103-DJI_0271.jpg',
   'published', NOW(), ARRAY['oonchiumpa', 'atnarpa', 'loves-creek', 'native-title', 'cultural-tourism', 'on-country'], ARRAY['stories', 'on-country'])
  ON CONFLICT (slug) DO UPDATE SET
    content = EXCLUDED.content,
    excerpt = EXCLUDED.excerpt,
    featured_image_url = EXCLUDED.featured_image_url,
    tags = EXCLUDED.tags,
    updated_at = NOW();

END $$;
