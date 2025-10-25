# Quick Start: Adding Community Programs

## The Simple Way (Web Form) ✨

### Step 1: Run Database Migration (One-Time Setup)

```bash
# Open Supabase Dashboard
# Go to SQL Editor
# Copy the contents of: supabase/migrations/link-programs-and-stories.sql
# Paste and run

# This adds:
# - program_id column to articles table
# - featured_storyteller fields to programs
# - programs_with_stories view for easy querying
```

### Step 2: Add a Program via Web Form

1. **Navigate to the form:**
   ```
   http://localhost:3003/community-programs/add
   ```

2. **Fill out the form** (all fields have helpful descriptions):
   - Basic Info: Name, organization, location, state, approach
   - Details: Description, impact summary
   - Metrics: Success rate, participants served, years operating
   - Contact: Phone, email, website (optional)
   - Tags: Select from 30+ options or add custom
   - Storyteller: Optionally feature someone's story

3. **Click "Add Program"** → Automatically redirects to new program page

### Step 3: Link Stories to Programs (Later)

When you have stories about the program:

**Option A: Via Supabase Dashboard**
```sql
UPDATE articles
SET program_id = '<program-uuid>'
WHERE slug = 'story-slug';
```

**Option B: Via Future Story Editor**
- Select program from dropdown when creating/editing story
- Auto-suggests based on tags and location

## Example: Adding CAMPFIRE

Let's add your CAMPFIRE program as an example:

### 1. Navigate to Form
```
http://localhost:3003/community-programs/add
```

### 2. Fill Out Form

**Basic Information:**
```
Program Name: CAMPFIRE Youth Mentorship
Organization: CAMPFIRE Brisbane
Location: Brisbane
State: QLD
Approach: Community-based
☑ Incorporates Indigenous Knowledge: No (unless it does?)
```

**Program Details:**
```
Description:
CAMPFIRE is a peer-led youth mentorship program that connects young people who have overcome challenges with others currently facing similar struggles. Through one-on-one mentorship, group workshops, and community events, young people build resilience, confidence, and practical life skills.

Impact Summary:
Young people mentoring young people - 82% report improved wellbeing and life skills
```

**Impact Metrics:**
```
Success Rate: 82 (%)
Participants Served: 150
Years Operating: 7
Founded Year: 2018
Community Connection Score: 85
```

**Contact Information:**
```
Phone: (fill in if you have it)
Email: (fill in if you have it)
Website: (fill in if you have it)
```

**Tags:** (select relevant ones)
```
☑ Peer Support
☑ Mentorship
☑ Mental Health
☑ Youth Leadership
☑ Community Organizing
☑ Trauma Recovery
☑ Social Justice
```

**Featured Storyteller:** (optional - add later when you have a story)
```
Storyteller Name: [Leave blank for now]
Story Quote: [Leave blank for now]
```

### 3. Click "Add Program"

The form will:
- Validate all required fields
- Save to database
- Show success message
- Auto-redirect to: `/community-programs/<new-uuid>`

### 4. View Your Program

You'll see:
- Full program details beautifully displayed
- All metrics in cards
- Contact information
- Tags
- Related stories section (empty initially)

## That's It! 🎉

You've added a program. No CLI, no SQL, just a simple form.

## Next: Link a Story

Once you have a story about CAMPFIRE:

### Option 1: Quick SQL Update
```sql
-- Get the CAMPFIRE program ID first
SELECT id, name FROM community_programs WHERE name LIKE '%CAMPFIRE%';

-- Copy the UUID, then:
UPDATE articles
SET program_id = '<campfire-uuid>'
WHERE slug = 'your-story-slug';
```

### Option 2: Wait for Story Editor
We'll build a web form for adding stories with a program picker dropdown.

## Viewing Connected Content

### Programs with Stories
```
/community-programs → Shows all programs with story counts
/community-programs/<id> → Shows program + related stories
```

### Stories with Programs
```
/stories → Shows all stories
/stories/<slug> → Will show story + related program (coming soon)
```

## Tips

### Good Program Names
- ✅ BackTrack Youth Works
- ✅ Healing Circles Program
- ✅ CAMPFIRE Youth Mentorship
- ❌ Program 1
- ❌ New Initiative

### Good Impact Summaries
- ✅ "Young people mentoring young people - 82% report improved wellbeing"
- ✅ "Transforms lives through dogs, welding, and mentorship - 87% never reoffend"
- ✅ "Cultural connection and healing through ancient wisdom"
- ❌ "This is a good program"
- ❌ "We help youth"

### Choosing Tags
**Be Specific:**
- ✅ "Vocational Training", "Animal Therapy", "Welding"
- ❌ "General Support", "Helping Youth"

**Match Your Approach:**
- Indigenous-led → Include "Traditional Knowledge", "Cultural Healing"
- Community-based → Include "Community Organizing", "Grassroots"
- Skills-focused → Include specific skills like "Digital Skills", "Creative Arts"

### Metrics Tips
**Success Rate:** What you measure as success (completion, reoffending reduction, employment, etc.)
**Participants Served:** Total since founding (or annually if you specify)
**Community Connection Score:** Subjective 0-100 scale of how embedded in community

## Troubleshooting

### Form Won't Submit
- Check all required fields (marked with *)
- Ensure numbers are positive integers
- Check that website URL starts with http:// or https://

### Program Not Showing
- Wait a few seconds for database sync
- Refresh the /community-programs page
- Check browser console for errors

### Can't Find Program UUID
```sql
-- Run in Supabase SQL Editor:
SELECT id, name, organization, location
FROM community_programs
ORDER BY created_at DESC
LIMIT 10;
```

## Cheat Sheet

```bash
# 1. Run migration (one time)
Open Supabase Dashboard → SQL Editor → Run link-programs-and-stories.sql

# 2. Add program
Navigate to: http://localhost:3003/community-programs/add
Fill form → Submit → Done!

# 3. Link story to program
UPDATE articles SET program_id = '<uuid>' WHERE slug = '<story-slug>';

# 4. View results
/community-programs → See all programs
/community-programs/<id> → See program + stories
```

## What's Next?

After adding programs:
1. **Link existing stories** to programs where relevant
2. **Create new stories** about program participants
3. **Update program pages** to showcase stories
4. **Build story editor** with program picker
5. **Add more programs** as you discover them!

---

**The system is designed to be simple and grow organically.** Start with what you know, add programs as you encounter them, link stories as they're written. The connections build naturally over time.
