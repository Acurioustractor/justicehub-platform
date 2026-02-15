-- JusticeHub Platform - Seed Data
-- This file contains initial data for development and testing

-- =====================================
-- SEED ORGANIZATIONS
-- =====================================

INSERT INTO organizations (id, name, slug, type, description, verification_status, is_active, settings) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'JusticeHub Platform',
    'justicehub',
    'nonprofit',
    'The main JusticeHub platform organization for managing cross-project initiatives and the Empathy Ledger.',
    'verified',
    true,
    '{"empathy_ledger_enabled": true, "cross_project_analytics": true}'
),
(
    '00000000-0000-0000-0000-000000000002',
    'Youth Justice Service Finder',
    'yjsf',
    'government',
    'Government initiative to help young people find appropriate justice services and support programs.',
    'verified',
    true,
    '{"service_finder_enabled": true, "public_directory": true}'
),
(
    '00000000-0000-0000-0000-000000000003',
    'BackTrack Youth Works',
    'backtrack',
    'nonprofit',
    'Community organization providing mentorship and skills training through innovative programs.',
    'verified',
    true,
    '{"success_rate": 87, "program_type": "mentorship_skills"}'
),
(
    '00000000-0000-0000-0000-000000000004',
    'Groote Eylandt Community',
    'groote-eylandt',
    'community',
    'Indigenous community organization focused on cultural healing and youth engagement.',
    'verified',
    true,
    '{"success_rate": 95, "program_type": "cultural_healing"}'
);

-- =====================================
-- SEED SERVICES
-- =====================================

INSERT INTO services (id, name, slug, organization_id, description, program_type, service_category, target_age_min, target_age_max, delivery_method, capacity_total, is_accepting_referrals, success_rate, is_featured) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'BackTrack Mentorship Program',
    'backtrack-mentorship',
    '00000000-0000-0000-0000-000000000003',
    'Intensive mentorship program combining life skills, vocational training, and animal therapy. Participants work with rescue dogs while developing job-ready skills.',
    'mentorship',
    ARRAY['mentorship', 'vocational_training', 'animal_therapy'],
    14,
    25,
    ARRAY['in_person', 'hybrid'],
    50,
    true,
    87.0,
    true
),
(
    '10000000-0000-0000-0000-000000000002',
    'Cultural Healing Circles',
    'cultural-healing-circles',
    '00000000-0000-0000-0000-000000000004',
    'Traditional healing and mentorship program connecting young Aboriginal people with elders and cultural practices.',
    'cultural_program',
    ARRAY['cultural_healing', 'mentorship', 'traditional_knowledge'],
    12,
    30,
    ARRAY['in_person'],
    30,
    true,
    95.0,
    true
),
(
    '10000000-0000-0000-0000-000000000003',
    'Youth Justice Navigation',
    'youth-justice-navigation',
    '00000000-0000-0000-0000-000000000002',
    'Comprehensive support service helping young people navigate the justice system and connect with appropriate services.',
    'case_management',
    ARRAY['case_management', 'legal_support', 'service_coordination'],
    10,
    25,
    ARRAY['in_person', 'phone', 'online'],
    100,
    true,
    78.0,
    true
);

-- =====================================
-- SEED OPPORTUNITIES
-- =====================================

INSERT INTO opportunities (id, title, slug, organization_id, description, opportunity_type, industry, location_type, location_city, location_state, duration_weeks, requirements, skills_required, benefits, is_active, is_featured) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'Animal Care Apprenticeship',
    'animal-care-apprenticeship',
    '00000000-0000-0000-0000-000000000003',
    'Learn animal care and veterinary assistance skills while working with rescue dogs. Includes mentorship and life skills development.',
    'apprenticeship',
    'Animal Care',
    'on_site',
    'Armidale',
    'NSW',
    52,
    ARRAY['Aged 16-25', 'Commitment to 12-month program', 'Willingness to work with animals'],
    ARRAY['Basic literacy', 'Physical fitness', 'Empathy for animals'],
    ARRAY['Certificate III in Animal Care', 'Mentorship support', 'Job placement assistance'],
    true,
    true
),
(
    '20000000-0000-0000-0000-000000000002',
    'Cultural Mentor Training',
    'cultural-mentor-training',
    '00000000-0000-0000-0000-000000000004',
    'Training program for young Aboriginal people to become cultural mentors and community leaders.',
    'program',
    'Community Services',
    'on_site',
    'Groote Eylandt',
    'NT',
    26,
    ARRAY['Aboriginal or Torres Strait Islander', 'Aged 18-30', 'Community connection'],
    ARRAY['Cultural knowledge', 'Communication skills', 'Leadership potential'],
    ARRAY['Mentorship certification', 'Community leadership role', 'Ongoing support'],
    true,
    true
),
(
    '20000000-0000-0000-0000-000000000003',
    'Youth Advocate Internship',
    'youth-advocate-internship',
    '00000000-0000-0000-0000-000000000002',
    'Paid internship supporting young people in the justice system. Gain experience in case management and advocacy.',
    'internship',
    'Social Services',
    'hybrid',
    'Brisbane',
    'QLD',
    12,
    ARRAY['Aged 18-25', 'Studying social work or related field', 'Lived experience preferred'],
    ARRAY['Communication skills', 'Empathy', 'Basic computer skills'],
    ARRAY['$25/hour', 'Professional development', 'Reference for future employment'],
    true,
    true
);

-- =====================================
-- SAMPLE STORIES (for demonstration)
-- =====================================

-- Note: These would typically be created by actual users
-- Including a few examples for development/testing purposes

INSERT INTO stories (id, title, slug, content, excerpt, source, story_type, visibility, status, is_featured, published_at, tags) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    'From Detention to Dog Training: My BackTrack Journey',
    'detention-to-dog-training-backtrack',
    'I was 16 when I first got locked up. Everyone said I was a lost cause, that I''d be back in detention within months. They were wrong, but not because of anything the system did for me. It was because of BackTrack, and a dog named Rex.

When I first heard about the program, I thought it was a joke. "You want me to train dogs?" I laughed. But I was desperate. Three months in detention had shown me where my life was heading, and I didn''t like it.

The first day at BackTrack was intimidating. Bernie Shakeshaft, the founder, looked me straight in the eye and said, "This isn''t about the dogs, mate. It''s about you." I didn''t understand what he meant then.

Rex was a rescue dog, just like me in a way. He''d been abandoned, mistreated, and had trust issues. Sound familiar? Working with Rex taught me patience, consistency, and responsibility. But more than that, it taught me that broken things can be fixed with the right care and attention.

The program wasn''t easy. We had to be there every day, rain or shine. We learned welding, mechanics, and animal care. But the real learning happened in the quiet moments with the dogs, and in the conversations with Bernie and the other mentors.

Three years later, I''m a qualified welder and animal trainer. I''ve got my own place, a steady job, and I''m mentoring other young people who remind me of myself at 16. Rex is still with me – I adopted him when he was ready for a forever home.

The statistics say 84.5% of young people reoffend after detention. I''m part of the 15.5% who don''t, but not because of detention. I''m here because someone saw potential in me when I couldn''t see it in myself.',
    'A young person''s journey from detention to becoming a mentor through the BackTrack program, highlighting the power of animal-assisted therapy and mentorship.',
    'local',
    'personal',
    'public',
    'published',
    true,
    NOW() - INTERVAL '30 days',
    ARRAY['backtrack', 'mentorship', 'animal_therapy', 'success_story', 'detention_alternative']
),
(
    '30000000-0000-0000-0000-000000000002',
    'Finding My Culture, Finding Myself',
    'finding-culture-finding-myself',
    'Growing up in Darwin, I felt disconnected from my Aboriginal heritage. My family had been part of the Stolen Generations, and that trauma echoed through our lives. By 15, I was angry, lost, and heading down a dangerous path.

Everything changed when I was invited to join the Cultural Healing Circles on Groote Eylandt. At first, I was skeptical. What could some old stories and traditional practices do for me? I was dealing with real problems – family dysfunction, substance abuse, and run-ins with the law.

But the elders saw something in me that I couldn''t see in myself. They didn''t lecture me about my behavior or try to fix me with programs and interventions. Instead, they shared stories. They taught me about country, about my ancestors, about the strength that runs in my bloodline.

Learning traditional hunting and fishing techniques taught me patience and respect for the land. Participating in ceremonies connected me to something bigger than my immediate problems. Most importantly, hearing the stories of other young people who had walked similar paths showed me that healing was possible.

The transformation wasn''t instant. It took months of consistent participation, of building relationships with elders and peers, of slowly rebuilding my sense of identity and purpose. But gradually, the anger that had been consuming me transformed into something else – pride, connection, and a desire to help others find their way.

Now I''m 21, and I''ve been clean for three years. I''m training to become a cultural mentor myself, working with young Aboriginal people who are where I was six years ago. The cycle of trauma that seemed inevitable in my family has been broken, not through punishment or programs, but through connection to culture and community.

The statistics about Aboriginal young people in detention are heartbreaking – we''re 24 times more likely to be locked up than non-Indigenous kids. But programs like the Cultural Healing Circles are proving that there''s another way. When we connect young people to their culture and community, when we address the root causes of their pain rather than just the symptoms, transformation is possible.',
    'A young Aboriginal person''s journey from disconnection and anger to cultural pride and community leadership through traditional healing practices.',
    'local',
    'journey',
    'public',
    'published',
    true,
    NOW() - INTERVAL '45 days',
    ARRAY['cultural_healing', 'aboriginal', 'groote_eylandt', 'traditional_knowledge', 'community_healing']
),
(
    '30000000-0000-0000-0000-000000000003',
    'The System That Failed Me, The Community That Saved Me',
    'system-failed-community-saved',
    'I spent my 17th birthday in a youth detention center. The cake was stale, the candles were imaginary, and the only gift I got was another court date. The system had labeled me a "high-risk offender" and seemed determined to prove that label right.

What the system didn''t understand was that my "criminal behavior" was actually survival behavior. I was stealing food because we didn''t have enough at home. I was fighting because I was being bullied and had no other way to protect myself. I was skipping school because I was working to help pay rent.

But the system doesn''t see context. It sees actions and applies consequences. Three strikes and you''re out, regardless of why you were swinging in the first place.

Detention was supposed to teach me a lesson. The lesson I learned was that the system saw me as a problem to be managed, not a person to be helped. The programs were one-size-fits-all, the staff were overworked and underpaid, and the other young people were just as lost and angry as I was.

When I was released, I was given a bus ticket and a list of services I was supposed to access. No follow-up, no support, no real plan. Within six weeks, I was back inside. The statistics had claimed another victim.

It was during my second stint in detention that I met Sarah, a youth worker from a community organization I''d never heard of. She didn''t come with forms to fill out or programs to enroll in. She came with questions: "What do you need? What are your dreams? How can we help you get there?"

For the first time, someone was asking what I wanted, not telling me what I should want.

When I was released the second time, Sarah was there. Not with a bus ticket, but with a plan we''d developed together. Housing support, educational opportunities, job training, and most importantly, ongoing mentorship and community connection.

The difference was night and day. Instead of being managed, I was supported. Instead of being labeled, I was seen as an individual with unique strengths and challenges. Instead of being processed through a system, I was welcomed into a community.

That was four years ago. I''m now studying social work and working part-time as a peer mentor with the same organization that helped me. I want to be for other young people what Sarah was for me – proof that someone believes in them and that change is possible.

The youth justice system has a 84.5% recidivism rate. Community-based programs like the one that helped me have success rates of 70-80%. The difference isn''t in the programs themselves – it''s in the approach. One sees young people as problems to be solved. The other sees them as people to be supported.',
    'A powerful account of how the traditional justice system failed a young person, while community-based support provided the foundation for transformation and success.',
    'local',
    'reflection',
    'public',
    'published',
    true,
    NOW() - INTERVAL '15 days',
    ARRAY['youth_justice', 'detention', 'community_support', 'system_reform', 'peer_mentorship']
);

-- =====================================
-- CROSS-PROJECT METRICS (Sample Data)
-- =====================================

INSERT INTO cross_project_metrics (project_name, organization_id, metric_type, metric_value, metric_date, metadata) VALUES
('BackTrack Youth Works', '00000000-0000-0000-0000-000000000003', 'success_rate', 87.0, CURRENT_DATE - INTERVAL '1 month', '{"participants": 156, "completed": 136}'),
('BackTrack Youth Works', '00000000-0000-0000-0000-000000000003', 'story_count', 45.0, CURRENT_DATE - INTERVAL '1 month', '{"published": 45, "draft": 12}'),
('BackTrack Youth Works', '00000000-0000-0000-0000-000000000003', 'engagement_rate', 78.5, CURRENT_DATE - INTERVAL '1 month', '{"avg_views": 234, "avg_likes": 18}'),

('Groote Eylandt Community', '00000000-0000-0000-0000-000000000004', 'success_rate', 95.0, CURRENT_DATE - INTERVAL '1 month', '{"participants": 89, "completed": 85}'),
('Groote Eylandt Community', '00000000-0000-0000-0000-000000000004', 'story_count', 32.0, CURRENT_DATE - INTERVAL '1 month', '{"published": 32, "draft": 8}'),
('Groote Eylandt Community', '00000000-0000-0000-0000-000000000004', 'engagement_rate', 92.3, CURRENT_DATE - INTERVAL '1 month', '{"avg_views": 456, "avg_likes": 42}'),

('Youth Justice Service Finder', '00000000-0000-0000-0000-000000000002', 'service_connections', 234.0, CURRENT_DATE - INTERVAL '1 month', '{"successful_referrals": 234, "total_searches": 1456}'),
('Youth Justice Service Finder', '00000000-0000-0000-0000-000000000002', 'story_count', 67.0, CURRENT_DATE - INTERVAL '1 month', '{"published": 67, "draft": 23}'),
('Youth Justice Service Finder', '00000000-0000-0000-0000-000000000002', 'engagement_rate', 65.8, CURRENT_DATE - INTERVAL '1 month', '{"avg_views": 189, "avg_likes": 12}');

-- =====================================
-- DEVELOPMENT USER (for testing)
-- =====================================

-- Note: This would typically be created through the authentication flow
-- Including for development/testing purposes only

-- The actual user creation will happen through Supabase Auth
-- This is just the profile data that would be created after auth

-- INSERT INTO users (id, email, display_name, first_name, last_name, role, profile_completed) VALUES
-- ('dev-user-id-here', 'dev@justicehub.org', 'Dev User', 'Dev', 'User', 'platform_admin', true);

-- =====================================
-- INDEXES AND PERFORMANCE OPTIMIZATIONS
-- =====================================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_stories_organization_published ON stories(organization_id, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_featured ON opportunities(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_cross_project_metrics_date ON cross_project_metrics(metric_date DESC);

-- =====================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================

-- Function to get story engagement metrics
CREATE OR REPLACE FUNCTION get_story_engagement(story_uuid UUID)
RETURNS TABLE(
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    bookmarks INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.view_count,
        s.like_count,
        s.comment_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM story_interactions si 
            WHERE si.story_id = story_uuid AND si.interaction_type = 'bookmark'
        ), 0) as bookmarks
    FROM stories s
    WHERE s.id = story_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization metrics
CREATE OR REPLACE FUNCTION get_organization_metrics(org_uuid UUID)
RETURNS TABLE(
    total_stories INTEGER,
    published_stories INTEGER,
    total_services INTEGER,
    active_services INTEGER,
    total_opportunities INTEGER,
    active_opportunities INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM stories WHERE organization_id = org_uuid),
        (SELECT COUNT(*)::INTEGER FROM stories WHERE organization_id = org_uuid AND status = 'published'),
        (SELECT COUNT(*)::INTEGER FROM services WHERE organization_id = org_uuid),
        (SELECT COUNT(*)::INTEGER FROM services WHERE organization_id = org_uuid AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM opportunities WHERE organization_id = org_uuid),
        (SELECT COUNT(*)::INTEGER FROM opportunities WHERE organization_id = org_uuid AND is_active = true);
END;
$$ LANGUAGE plpgsql;