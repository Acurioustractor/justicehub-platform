DO $$ BEGIN
 CREATE TYPE "apprenticeship_status" AS ENUM('pending', 'active', 'completed', 'terminated', 'on_hold');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('youth', 'mentor', 'org_admin', 'platform_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "source" AS ENUM('local', 'airtable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "story_type" AS ENUM('reflection', 'milestone', 'challenge', 'achievement', 'goal', 'update');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "visibility" AS ENUM('private', 'mentors_only', 'organization', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mentor_status" AS ENUM('pending', 'approved', 'active', 'inactive', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mentorship_status" AS ENUM('pending', 'active', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "match_status" AS ENUM('suggested', 'interested', 'applied', 'interviewed', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "opportunity_type" AS ENUM('job', 'internship', 'apprenticeship', 'volunteer', 'education', 'workshop');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apprenticeships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youth_profile_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "apprenticeship_status" DEFAULT 'pending' NOT NULL,
	"contract_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"availability" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "mentor_status" DEFAULT 'pending' NOT NULL,
	"background_check" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mentors_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"email" varchar(255) NOT NULL,
	"auth0_id" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'youth' NOT NULL,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"privacy_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_auth0_id_unique" UNIQUE("auth0_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "youth_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"demographics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"journey_timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skills_interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"achievements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"privacy_controls" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "youth_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"contact_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"airtable_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "airtable_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"sync_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youth_profile_id" uuid NOT NULL,
	"airtable_record_id" varchar(255),
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"story_type" "story_type" DEFAULT 'reflection' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"source" "source" DEFAULT 'local' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"airtable_attachment_id" varchar(255),
	"file_type" varchar(50) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentorship_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"youth_profile_id" uuid NOT NULL,
	"status" "mentorship_status" DEFAULT 'pending' NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "opportunity_type" NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"youth_profile_id" uuid NOT NULL,
	"match_score" real DEFAULT 0 NOT NULL,
	"match_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "match_status" DEFAULT 'suggested' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apprenticeships" ADD CONSTRAINT "apprenticeships_youth_profile_id_youth_profiles_id_fk" FOREIGN KEY ("youth_profile_id") REFERENCES "youth_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apprenticeships" ADD CONSTRAINT "apprenticeships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "youth_profiles" ADD CONSTRAINT "youth_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airtable_sync_log" ADD CONSTRAINT "airtable_sync_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stories" ADD CONSTRAINT "stories_youth_profile_id_youth_profiles_id_fk" FOREIGN KEY ("youth_profile_id") REFERENCES "youth_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_media" ADD CONSTRAINT "story_media_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_youth_profile_id_youth_profiles_id_fk" FOREIGN KEY ("youth_profile_id") REFERENCES "youth_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_youth_profile_id_youth_profiles_id_fk" FOREIGN KEY ("youth_profile_id") REFERENCES "youth_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
