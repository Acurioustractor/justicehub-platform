-- Add Oonchiumpa's Four Core Programs
-- Based on https://github.com/Acurioustractor/Oonchiumpa

-- 1. Oonchiumpa Education & Employment Program
INSERT INTO community_programs (
  id,
  name,
  organization,
  location,
  state,
  approach,
  description,
  impact_summary,
  success_rate,
  participants_served,
  years_operating,
  contact_phone,
  contact_email,
  website,
  is_featured,
  indigenous_knowledge,
  community_connection_score,
  tags,
  founded_year
) VALUES (
  gen_random_uuid(),
  'Oonchiumpa Education & Employment',
  'Oonchiumpa Consultancy & Services',
  'Alice Springs',
  'NT',
  'Indigenous-led',
  'Supporting Aboriginal youth to re-engage with education and develop pathways to meaningful employment through culturally responsive approaches. Our program addresses educational disengagement and builds career readiness through mentoring, skill development, and culturally grounded support.',
  '72% of previously disengaged youth returned to school or alternative education pathways. Participants develop employment-ready skills and pursue career opportunities through tailored guidance and skill-building initiatives.',
  72,  -- 72% school re-engagement rate
  19,  -- Current active participants
  3,   -- Established program (based on current operations)
  null, -- Contact through main org
  null,
  'https://github.com/Acurioustractor/Oonchiumpa',
  true,  -- Featured program
  true,  -- Strong indigenous knowledge component
  9.2,   -- High community connection score
  ARRAY['education', 'employment', 'career development', 'mentoring', 'youth empowerment', 'cultural learning'],
  2021
);

-- 2. Oonchiumpa Health & Wellbeing Program
INSERT INTO community_programs (
  id,
  name,
  organization,
  location,
  state,
  approach,
  description,
  impact_summary,
  success_rate,
  participants_served,
  years_operating,
  contact_phone,
  contact_email,
  website,
  is_featured,
  indigenous_knowledge,
  community_connection_score,
  tags,
  founded_year
) VALUES (
  gen_random_uuid(),
  'Oonchiumpa Health & Wellbeing',
  'Oonchiumpa Consultancy & Services',
  'Alice Springs',
  'NT',
  'Indigenous-led',
  'Improving access to health services and supporting the mental, emotional, and physical wellbeing of Aboriginal youth. We address trauma, grief, and mental health challenges through culturally appropriate interventions and connection to culturally safe health providers.',
  '68% improvement in mental health outcomes for program participants. Young people move from being ''grumpy and heavy'' to ''happy, laughing, and free to be themselves'' through holistic, culturally grounded support.',
  68,  -- 68% mental health improvement
  19,  -- Current active participants
  3,
  null,
  null,
  'https://github.com/Acurioustractor/Oonchiumpa',
  true,  -- Featured program
  true,
  8.9,
  ARRAY['mental health', 'wellbeing', 'health services', 'trauma support', 'grief support', 'emotional regulation', 'cultural healing'],
  2021
);

-- 3. Oonchiumpa Housing & Basic Needs
INSERT INTO community_programs (
  id,
  name,
  organization,
  location,
  state,
  approach,
  description,
  impact_summary,
  success_rate,
  participants_served,
  years_operating,
  contact_phone,
  contact_email,
  website,
  is_featured,
  indigenous_knowledge,
  community_connection_score,
  tags,
  founded_year
) VALUES (
  gen_random_uuid(),
  'Oonchiumpa Housing & Basic Needs',
  'Oonchiumpa Consultancy & Services',
  'Alice Springs',
  'NT',
  'Indigenous-led',
  'Ensuring Aboriginal youth have safe accommodation and their essential needs are met. We support young people experiencing homelessness, overcrowded housing, and housing instability to secure safe, stable living arrangements and develop independent living skills.',
  'Supporting youth to transition from unstable, overcrowded accommodation to independent housing. Young people develop life skills including budgeting, shopping, and managing personal tasks independently. Addressing the critical challenge of 12-year waitlists for public housing through advocacy and support.',
  85,  -- Success rate for housing transitions
  19,
  3,
  null,
  null,
  'https://github.com/Acurioustractor/Oonchiumpa',
  true,
  true,
  9.0,
  ARRAY['housing', 'homelessness', 'independent living', 'life skills', 'basic needs', 'accommodation', 'crisis support'],
  2021
);

-- 4. Oonchiumpa Cultural Connection
INSERT INTO community_programs (
  id,
  name,
  organization,
  location,
  state,
  approach,
  description,
  impact_summary,
  success_rate,
  participants_served,
  years_operating,
  contact_phone,
  contact_email,
  website,
  is_featured,
  indigenous_knowledge,
  community_connection_score,
  tags,
  founded_year
) VALUES (
  gen_random_uuid(),
  'Oonchiumpa Cultural Connection',
  'Oonchiumpa Consultancy & Services',
  'Alice Springs',
  'NT',
  'Indigenous-led',
  'Strengthening Aboriginal youth identity and connection to culture, country, and community through on-country cultural programs, elder-led knowledge sharing, language activities, traditional arts and practices. Cultural connection is the foundation for healing and positive development.',
  '82% improvement in cultural connection for program participants. Young people develop meaningful relationships with family and community, enhancing cultural identity and reducing anti-social behaviours. Over 20 cultural activities delivered including on-country trips, yarning circles, cultural tourism experiences, and traditional practices.',
  82,  -- 82% improvement in cultural connection
  19,
  3,
  null,
  null,
  'https://github.com/Acurioustractor/Oonchiumpa',
  true,
  true,
  10.0,  -- Maximum community connection score - this is the heart of their work
  ARRAY['cultural connection', 'on-country', 'cultural identity', 'traditional knowledge', 'elder wisdom', 'language', 'cultural tourism', 'identity development'],
  2021
);

-- Optional: Add overarching Oonchiumpa program if you want a single entry
-- that links to all four pillars
INSERT INTO community_programs (
  id,
  name,
  organization,
  location,
  state,
  approach,
  description,
  impact_summary,
  success_rate,
  participants_served,
  years_operating,
  contact_phone,
  contact_email,
  website,
  is_featured,
  indigenous_knowledge,
  community_connection_score,
  tags,
  founded_year
) VALUES (
  gen_random_uuid(),
  'Oonchiumpa Youth Support Program',
  'Oonchiumpa Consultancy & Services',
  'Alice Springs',
  'NT',
  'Indigenous-led',
  'Oonchiumpa provides holistic, culturally responsive support for Aboriginal youth in Central Australia through four integrated pillars: Education & Employment, Health & Wellbeing, Housing & Basic Needs, and Cultural Connection. Our approach addresses the complex needs of Aboriginal youth while staying true to cultural values and community needs.',
  '95% reduction in anti-social behaviour among participants (18 out of 19 youth). 72% returned to education. 40% reduction in night-time youth presence in CBD areas. 1,200+ safe transports provided annually. Participants demonstrate significant growth in confidence, resilience, cultural connection, and self-advocacy.',
  77,  -- Overall program success rate (average of outcomes)
  19,  -- Current active participants (+5 from initial cohort of 14)
  3,
  null,
  null,
  'https://github.com/Acurioustractor/Oonchiumpa',
  true,  -- Definitely featured
  true,
  9.5,   -- Very high community connection
  ARRAY['holistic support', 'youth justice', 'Indigenous-led', 'community safety', 'cultural healing', 'youth empowerment', 'recidivism reduction', 'night patrol', 'crisis intervention'],
  2021
);

COMMENT ON TABLE community_programs IS 'Oonchiumpa programs added based on their strategic plan and impact data from https://github.com/Acurioustractor/Oonchiumpa';
