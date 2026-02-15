# 📊 Supabase Database Schema Analysis

## Connection Details
- **Project ID:** yvnuayzslukamizrlhwb
- **Total Stories:** 252
- **Status:** ✅ Connected Successfully

## Key Tables

### 1. `stories` Table (252 records)

#### Identity & Core Fields
- `id` (UUID) - Primary key
- `title` - Story title
- `content` - Full story text (markdown format)
- `summary` - AI-generated summary
- `created_at` / `updated_at` - Timestamps
- `status` - Story status
- `published_at` - Publication timestamp

#### Media Fields
- `media_url` - Main media URL
- `media_urls` - Array of media URLs
- `media_attachments` - Attachment metadata
- `media_metadata` - Media file information
- `story_image_url` - Story cover image
- `story_image_file` - Image file reference
- `video_embed_code` - Embedded video HTML
- `source_links` - External source links

#### Storyteller References
- `author_id` (UUID) - References profiles table
- `storyteller_id` (UUID) - Storyteller profile reference
- `legacy_storyteller_id` - Migration reference
- `legacy_author` - Legacy author name

#### Transcripts
- `transcription` - Full transcript text
- `transcript_id` - Reference to transcripts table

#### Privacy & Consent  ⚠️ IMPORTANT
- `has_explicit_consent` (Boolean) - **Primary consent flag**
- `consent_details` (JSONB) - Consent metadata
- `privacy_level` - Privacy setting
- `is_public` (Boolean) - Public visibility
- `sharing_permissions` - How story can be shared
- `ai_processing_consent_verified` (Boolean) - AI processing consent

#### Cultural Sensitivity 🎭
- `cultural_sensitivity_level` - Sensitivity rating
- `cultural_sensitivity_flag` (Boolean) - Requires special handling
- `cultural_warnings` - Warnings for cultural content
- `traditional_knowledge_flag` (Boolean) - Contains traditional knowledge
- `cultural_themes` - Cultural themes/topics
- `requires_elder_approval` (Boolean) - Needs elder review
- `elder_approved_by` / `elder_approved_at` - Elder approval tracking

#### Categories & Classification
- `story_category` - Category type
- `story_type` - Type of story
- `themes` - Story themes
- `story_stage` - Production stage
- `video_stage` - Video production stage
- `fellowship_phase` - Fellowship cohort phase
- `is_featured` (Boolean) - Featured story

#### Multi-tenancy
- `tenant_id` (UUID) - Organization/tenant
- `cross_tenant_visibility` - Cross-organization sharing
- `organization_id` - Organization reference
- `project_id` - Project reference

#### Location
- `location_id` - Location reference
- `location_text` - Location name
- `latitude` / `longitude` - GPS coordinates

#### AI Processing
- `ai_processed` (Boolean) - Has been AI processed
- `ai_confidence_scores` - AI confidence metrics
- `ai_generated_summary` - AI summary
- `ai_enhanced_content` - AI-enhanced version
- `embedding` - Vector embedding for search
- `search_vector` - Full-text search vector

#### Review & Moderation
- `community_status` - Community review status
- `reviewed_by` / `reviewed_at` - Review tracking
- `review_notes` - Reviewer notes

#### Migration Fields
- `legacy_story_id` - Old system ID
- `airtable_record_id` - Airtable migration ID
- `migrated_at` - Migration timestamp
- `migration_quality_score` - Migration quality

### 2. `profiles` Table

#### Basic Info
- `id` (UUID) - Primary key
- `tenant_id` - Organization
- `full_name` - Full name
- `display_name` - Public display name
- `email` - Email address
- `phone_number` - Phone number
- `bio` - Biography
- `personal_statement` - Personal statement
- `life_motto` - Life motto

#### Profile Images
- `profile_image_url` - Profile photo
- `profile_image_alt_text` - Alt text for image
- `avatar_url` - Avatar image

#### Demographics
- `date_of_birth` / `age_range` - Age information
- `preferred_pronouns` - Pronouns
- `cultural_background` - Cultural identity

#### Consent & Privacy 🔐
- `consent_given` (Boolean) - General consent
- `consent_date` / `consent_version` - Consent tracking
- `privacy_preferences` - Privacy settings
- `story_visibility_level` - Story visibility preference
- `quote_sharing_consent` (Boolean) - Quote sharing allowed
- `impact_story_promotion` (Boolean) - Allow promotion
- `wisdom_sharing_level` - Wisdom sharing preference
- `narrative_ownership_level` - Ownership preferences
- `attribution_preferences` - How to attribute
- `story_use_permissions` - Usage permissions

#### AI Consent 🤖
- `ai_processing_consent` (Boolean) - **AI processing consent**
- `ai_consent_date` - When consent given
- `ai_consent_scope` - Scope of AI consent
- `allow_ai_analysis` (Boolean) - Allow AI analysis
- `ai_enhanced_bio` - AI-enhanced biography
- `ai_personality_insights` - AI insights

#### Collaboration & Networking
- `open_to_mentoring` (Boolean) - Mentoring availability
- `available_for_collaboration` (Boolean) - Collaboration interest
- `seeking_organizational_connections` (Boolean) - Seeking connections
- `interested_in_peer_support` (Boolean) - Peer support interest
- `mentor_availability` / `speaking_availability` - Availability flags
- `network_visibility` - Network visibility setting
- `recommendation_opt_in` (Boolean) - Recommendations opt-in

#### Professional Info
- `current_role` / `current_organization` - Current position
- `years_of_experience` - Experience years
- `professional_summary` - Professional background
- `industry_sectors` - Industry sectors
- `expertise_areas` - Areas of expertise
- `resume_url` / `linkedin_profile_url` / `website_url` - Links

#### Cultural Identity
- `cultural_communities_visibility` - Cultural community visibility
- `language_communities_visibility` - Language visibility
- `is_elder` (Boolean) - Elder status
- `requires_elder_review` (Boolean) - Needs elder review
- `traditional_knowledge_flag` (Boolean) - Holds traditional knowledge
- `cultural_protocol_level` - Cultural protocol adherence
- `cultural_protocol_score` - Cultural protocol rating

#### Storyteller Status
- `is_storyteller` (Boolean) - **Is a storyteller**
- `is_featured` (Boolean) - Featured profile
- `storyteller_ranking` - Storyteller ranking
- `onboarding_completed` (Boolean) - Completed onboarding
- `profile_status` - Profile status

#### Video Content
- `video_introduction_url` - Video introduction
- `video_portfolio_urls` - Portfolio videos
- `featured_video_url` - Featured video
- `video_metadata` - Video metadata

#### Impact & Analytics
- `total_impact_insights` - Impact insights count
- `primary_impact_type` - Main impact type
- `impact_confidence_score` - Impact confidence
- `impact_score` - Overall impact score
- `impact_focus_areas` - Focus areas
- `community_leadership_score` - Leadership score
- `knowledge_transmission_score` - Knowledge sharing score
- `healing_integration_score` - Healing integration score
- `relationship_building_score` - Relationship building score
- `system_navigation_score` - System navigation score
- `last_impact_analysis` - Last analysis timestamp
- `impact_badges` - Earned badges

#### Visibility Settings
- `profile_visibility` - Overall profile visibility
- `basic_info_visibility` - Basic info visibility
- `professional_visibility` - Professional info visibility
- `cultural_identity_visibility` - Cultural identity visibility
- `stories_visibility` - Stories visibility
- `transcripts_visibility` - Transcripts visibility
- `media_visibility` - Media visibility
- `analytics_preferences` - Analytics preferences

#### Legacy Fields
- `legacy_storyteller_id` / `legacy_user_id` / `legacy_airtable_id` - Migration IDs
- `migrated_at` - Migration timestamp
- `migration_quality_score` - Migration quality

### 3. Consent Structure (Embedded in profiles)

Consent is NOT in a separate table - it's embedded in profiles:
- `consent_given` - Main consent flag
- `consent_date` - When consent was given
- `consent_version` - Version of consent form
- `ai_processing_consent` - Specific AI consent
- `quote_sharing_consent` - Quote sharing allowed
- Various `*_visibility` fields - What can be shown

## 🔒 Key Privacy/Consent Fields for JusticeHub

### Must Check Before Displaying Stories:
1. **`stories.has_explicit_consent`** - Must be TRUE
2. **`stories.is_public`** - Should be TRUE for public site
3. **`stories.privacy_level`** - Check privacy setting
4. **`stories.status`** - Should be 'published' or equivalent
5. **`profiles.consent_given`** - Storyteller has consented
6. **`profiles.story_visibility_level`** - Check visibility preference

### Cultural Sensitivity Checks:
1. **`stories.cultural_sensitivity_flag`** - Handle carefully
2. **`stories.traditional_knowledge_flag`** - May need special handling
3. **`stories.requires_elder_approval`** - Must have elder approval if TRUE
4. **`stories.elder_approved_by`** - Check elder approval exists

## 📝 Recommended Query for Public Stories

```sql
SELECT 
  s.*,
  p.full_name,
  p.display_name,
  p.profile_image_url,
  p.bio,
  p.cultural_background
FROM stories s
LEFT JOIN profiles p ON s.author_id = p.id
WHERE 
  s.has_explicit_consent = true
  AND s.is_public = true
  AND s.status = 'published'  -- verify actual status value
  AND p.consent_given = true
  AND p.story_visibility_level != 'private'  -- verify actual values
  AND (
    s.requires_elder_approval = false 
    OR s.elder_approved_by IS NOT NULL
  )
ORDER BY s.published_at DESC NULLS LAST;
```

## 🎯 Next Steps

1. Create TypeScript types for stories and profiles
2. Build query functions with proper consent filtering
3. Create UI components that respect privacy settings
4. Add cultural sensitivity warnings where appropriate
5. Implement elder approval badges/indicators

