# JusticeHub Program Management Guide

## Overview

This guide explains how to:
1. Add new community programs
2. Link profiles to programs correctly
3. Fix incorrect linkages
4. Understand the profile-program relationship system

---

## Understanding the System

### Two Types of Content

**1. Community Programs (in JusticeHub database)**
- Stored in `community_programs` table
- Created/managed by JusticeHub admins
- Examples: BackTrack Youth Works, Healing Circles Program, Logan Youth Collective

**2. Profiles (from Empathy Ledger)**
- Stored in separate Empathy Ledger database
- People's stories and experiences
- Can be linked to JusticeHub programs via `profile_appearances` table

### The Linking Table: `profile_appearances`

This table connects Empathy Ledger profiles to JusticeHub content:

```typescript
{
  id: string;                      // Unique appearance ID
  empathy_ledger_profile_id: string;  // Profile from Empathy Ledger
  appears_on_type: string;         // 'program', 'service', or 'article'
  appears_on_id: string;           // ID of the program/service/article
  role: string;                    // Their role (e.g., "Program Participant", "Staff Member")
  story_excerpt: string;           // Short quote from their story
  featured: boolean;               // Show prominently on the page
}
```

---

## Part 1: Adding a New Program

### Method 1: Direct Database Insert (Recommended)

Create a SQL file or use Supabase UI:

```sql
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
  gen_random_uuid(),  -- Auto-generate ID
  'Youth Arts Collective',
  'Community Arts Inc',
  'Brisbane',
  'QLD',
  'Community-based',  -- Options: 'Indigenous-led', 'Community-based', 'Grassroots', 'Culturally-responsive'
  'Empowering young people through creative expression and cultural arts programs',
  'Reduced recidivism by 65% through arts-based intervention',
  65,  -- success_rate (percentage)
  120,  -- participants_served
  5,   -- years_operating
  '+61 7 1234 5678',
  'contact@youtharts.org.au',
  'https://youtharts.org.au',
  false,  -- is_featured (true for homepage)
  false,  -- indigenous_knowledge
  8.5,   -- community_connection_score (0-10)
  ARRAY['arts', 'creativity', 'mentorship', 'youth development'],
  2019   -- founded_year
);
```

### Method 2: Using the add-community-program Script

```bash
npx tsx src/scripts/add-community-program.ts
```

Then follow the prompts to enter program details.

---

## Part 2: Linking Profiles to Programs

### IMPORTANT: Who Should Be Linked?

**✅ Link profiles of:**
- Program participants who have shared their stories
- People whose lives were directly impacted by the program
- Community members who experienced the program firsthand

**❌ DO NOT link:**
- Staff members or program managers (unless they're also sharing their own transformation story)
- People telling stories ABOUT the program (not their own experience)
- Researchers or evaluators

### Example: Kristy Bloomfield Issue

**INCORRECT Linkage:**
```
Kristy Bloomfield → Logan Youth Collective (as "program effectiveness")
```

**Why it's wrong:**
- Kristy is a staff member/leader at Oonchiumpa
- She's telling stories ABOUT program outcomes, not her own personal story
- The "program effectiveness" story is data/research, not a participant narrative

**Correct approach:**
- Don't link Kristy to programs she manages
- Only link participants whose stories appear in Empathy Ledger

---

## Part 3: Using the Management Tools

### List All Programs and Their Links

```bash
npx tsx src/scripts/manage-programs.ts list
```

This shows:
- All programs
- Who's linked to each program
- Their roles
- Appearance IDs (for deletion)

### Search for Profiles

```bash
npx tsx src/scripts/manage-programs.ts search "Name"

# Examples:
npx tsx src/scripts/manage-programs.ts search "Kirsty"
npx tsx src/scripts/manage-programs.ts search "Graham"
```

### View All Profile Appearances

```bash
npx tsx src/scripts/manage-programs.ts appearances
```

Shows all profile-to-program links across the entire system.

### Delete an Incorrect Link

```bash
npx tsx src/scripts/manage-programs.ts delete <appearance-id>

# Example (to fix Kristy's incorrect links):
npx tsx src/scripts/manage-programs.ts delete 2aa9b6f8-1bc0-451c-8eb1-c61e173b52dd
```

### Link a Profile to a Program

```bash
npx tsx src/scripts/manage-programs.ts link <profile-id> <program-id> <role> [excerpt] [featured]

# Example:
npx tsx src/scripts/manage-programs.ts link \
  "afe23d46-fd60-43df-994f-bf7e70384e9e" \
  "14602373-546b-4466-8867-8b44f16c649c" \
  "Program Participant" \
  "Working with rescue dogs changed my entire outlook on life" \
  true
```

Parameters:
- `profile-id`: From Empathy Ledger (use `search` command to find)
- `program-id`: From JusticeHub (use `list` command to find)
- `role`: Their role (e.g., "Program Participant", "Youth Mentor", "Former Participant")
- `excerpt`: Optional quote from their story
- `featured`: `true` or `false` - show prominently on program page

---

## Part 4: Fixing the Kristy Bloomfield Issue

Based on your report, here's how to fix it:

### Step 1: Identify the Incorrect Links

```bash
npx tsx src/scripts/manage-programs.ts list
```

You mentioned Kristy is linked to the wrong program. From our investigation, she's linked to:
1. BackTrack Youth Works
2. Creative Futures Collective
3. Logan Youth Collective

### Step 2: Determine Which (If Any) Are Correct

Review Kristy's actual connection:
- She's a leader at **Oonchiumpa** (Alice Springs youth service)
- Her stories are about Oonchiumpa's programs, not personal transformation
- She should likely NOT be linked to any of these programs as a participant

### Step 3: Delete Incorrect Links

```bash
# Delete Kristy from BackTrack
npx tsx src/scripts/manage-programs.ts delete 6f6f4134-1c74-4cb5-bdd8-619c21d18d75

# Delete Kristy from Creative Futures
npx tsx src/scripts/manage-programs.ts delete 78e0098c-6d48-467c-b3b5-9baa41671caf

# Delete Kristy from Logan Youth Collective
npx tsx src/scripts/manage-programs.ts delete 2aa9b6f8-1bc0-451c-8eb1-c61e173b52dd
```

### Step 4: Verify

```bash
npx tsx src/scripts/manage-programs.ts list
```

Kristy should no longer appear under any programs.

---

## Part 5: Best Practices

### When Creating Profile Links

1. **Read the actual story first** - Make sure it's about their personal experience
2. **Check the role** - Are they a participant or staff?
3. **Verify the program match** - Does the story explicitly mention this program?
4. **Use accurate excerpts** - Pull quotes directly from their story
5. **Feature sparingly** - Only feature the most impactful stories

### Role Guidelines

Use these standard roles:
- `"Program Participant"` - Went through the program
- `"Former Participant"` - Completed the program
- `"Youth Mentor"` - Young person who now mentors others
- `"Community Member"` - Impacted by program in their community
- `"Family Member"` - Family affected by the program

**Avoid:**
- `"program effectiveness"` - Too vague, sounds like research
- `"mental health outcomes"` - Too clinical
- `"staff member"` - Don't link staff unless sharing transformation story

### Excerpt Guidelines

Good excerpts:
- ✅ "Working with the dogs taught me patience and responsibility"
- ✅ "This program saved my life when I had nowhere else to turn"
- ✅ "I went from sleeping rough to managing my own place"

Bad excerpts:
- ❌ "The program showed 65% reduction in recidivism"
- ❌ "independent living success"
- ❌ "educational values"

---

## Part 6: Automated Linking Scripts

### From Stories to Services (Existing)

```bash
npx tsx src/scripts/link-stories-to-services.ts
```

This finds stories that mention services and creates profile appearances.

### From Stories to Programs (Existing)

```bash
npx tsx src/scripts/link-stories-to-programs.ts
```

This finds stories that mention programs and creates profile appearances.

**⚠️ Warning:** These automated scripts may create incorrect links if:
- The story mentions a program but isn't about personal experience
- The storyteller is staff, not a participant
- Always review and clean up automated links!

---

## Part 7: Quick Reference Commands

```bash
# View all programs
npx tsx src/scripts/manage-programs.ts list

# Search for a profile
npx tsx src/scripts/manage-programs.ts search "Name"

# View all links
npx tsx src/scripts/manage-programs.ts appearances

# Delete a link
npx tsx src/scripts/manage-programs.ts delete <appearance-id>

# Create a link
npx tsx src/scripts/manage-programs.ts link <profile-id> <program-id> "Role" "Excerpt" true
```

---

## Questions?

- Check Empathy Ledger profile data: Look at their bio and stories
- Check program data: Review what the program actually does
- Ask: "Is this person a participant sharing their transformation, or someone talking ABOUT the program?"

When in doubt, don't link. It's better to have fewer, accurate links than many incorrect ones.
