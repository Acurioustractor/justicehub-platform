# Connected Programs & Stories System

## Overview

JusticeHub now has a fully connected system linking **Community Programs** and **Stories** throughout the platform. This creates a rich, interconnected experience where visitors can:

- Discover programs through stories
- Find stories related to programs
- See the real human impact of community work
- Navigate seamlessly between related content

## System Architecture

### Database Structure

```
community_programs
├── id (UUID)
├── name, organization, location, state
├── approach, indigenous_knowledge
├── description, impact_summary
├── metrics (success_rate, participants_served, etc.)
├── contact info (phone, email, website)
├── tags (array)
├── featured_storyteller_name      ← NEW
└── featured_storyteller_story     ← NEW

articles (stories)
├── id (UUID)
├── slug, title, excerpt, content
├── featured_image_url
├── program_id → community_programs.id  ← NEW LINK
└── other article fields...

programs_with_stories (view)
├── All program fields
├── story_count
└── stories (JSON array of related stories)
```

### The Connection

**Program ← Story**: Each story can be linked to ONE program via `program_id`
**Program → Stories**: Each program can have MANY stories through the view

## How to Use

### 1. Adding a New Program

**Simple Web Form** (Recommended)
- Navigate to `/community-programs/add`
- Fill out the intuitive form
- All fields validated and explained
- Instant preview of your program
- Auto-redirects to new program page

**Form Sections:**
1. **Basic Information** - Name, organization, location, state, approach
2. **Program Details** - Description, impact summary
3. **Impact Metrics** - Success rate, participants served, years operating
4. **Contact Information** - Phone, email, website (all optional)
5. **Tags** - Select from 30+ suggested tags or add custom ones
6. **Featured Storyteller** - Optionally feature a youth story

**Example:**
```
Name: CAMPFIRE Youth Mentorship
Organization: CAMPFIRE Brisbane
Location: Brisbane
State: QLD
Approach: Community-based
Description: Peer-led mentorship program connecting young people...
Impact Summary: Young people mentoring young people - 82% report improved wellbeing
Success Rate: 82%
Participants Served: 150
Years Operating: 7
Tags: ["Peer Support", "Mentorship", "Mental Health"]
```

### 2. Linking Stories to Programs

**When creating/editing a story in Supabase:**

```sql
-- Link existing story to program
UPDATE articles
SET program_id = '14602373-546b-4466-8867-8b44f16c649c'
WHERE slug = 'from-prison-to-purpose';

-- Or when inserting new story
INSERT INTO articles (title, slug, content, program_id, ...)
VALUES ('Marcus's Story', 'marcus-story', '...', '14602373...', ...);
```

**In the future web story editor:**
- Dropdown to select related program
- Auto-suggests programs based on tags/location
- Shows program preview

### 3. How Connections Display

**On Program Detail Pages:**
```
[Program Header]
↓
[Impact Metrics]
↓
[Related Stories Section]  ← Automatically populated
  → Story 1: Marcus's Journey
  → Story 2: Finding Hope Through Community
  → Story 3: A Second Chance
```

**On Story Pages:**
```
[Story Header]
↓
[Story Content]
↓
[Related Program Card]  ← Shows linked program
  → "This story is part of BackTrack Youth Works"
  → Quick program stats
  → Link to full program page
```

**On Programs Listing:**
```
[Program Card]
├── Program name & details
├── Impact metrics
└── Story count badge: "3 stories" ← Shows # of linked stories
```

## Examples of Connections

### Example 1: BackTrack Youth Works

**Program Details:**
- Name: BackTrack Youth Works
- Location: Armidale, NSW
- Approach: Community-based

**Linked Stories:**
1. "From Prison to Purpose: Marcus's Welding Journey"
2. "How Dogs Saved My Life: A BackTrack Story"
3. "Finding My Path Through Mentorship"

**Visitor Experience:**
- Visitor reads Marcus's story
- Sees "Part of BackTrack Youth Works" at bottom
- Clicks through to program
- Discovers 2 more inspiring stories from BackTrack
- Learns about the full program model
- Can contact BackTrack if they want to get involved

### Example 2: Healing Circles Program

**Program Details:**
- Name: Healing Circles Program
- Location: Alice Springs, NT
- Approach: Indigenous-led
- Featured Storyteller: "Jayden" (featured on program page)

**Linked Stories:**
1. "Culture Saved My Life: Jayden's Healing Journey" (featured)
2. "Finding Identity Through Traditional Knowledge"
3. "Connection to Country: A Healing Story"

**Visitor Experience:**
- Visitor browses programs, sees Indigenous-led filter
- Finds Healing Circles
- Sees Jayden's quote featured on program page
- Reads full story via link
- Discovers the power of cultural healing
- Finds 2 other stories about cultural connection

## Technical Implementation

### Database Migration

Run this to enable the connections:

```bash
# Apply the migration
psql -h <supabase-host> -U postgres -d postgres < supabase/migrations/link-programs-and-stories.sql

# Or through Supabase Dashboard:
# SQL Editor → New Query → Paste migration → Run
```

### Querying Connected Data

**Get program with all stories:**
```typescript
const { data } = await supabase
  .from('programs_with_stories')
  .select('*')
  .eq('id', programId)
  .single();

console.log(data.story_count); // 3
console.log(data.stories);      // Array of story objects
```

**Get story with related program:**
```typescript
const { data } = await supabase
  .from('articles')
  .select(`
    *,
    program:community_programs(*)
  `)
  .eq('slug', storySlug)
  .single();

console.log(data.program.name);    // "BackTrack Youth Works"
```

## Benefits

### For Visitors
- **Discovery**: Find programs through compelling stories
- **Context**: Understand the human impact of programs
- **Trust**: See real testimonials and outcomes
- **Navigation**: Seamlessly explore related content

### For Programs
- **Visibility**: Stories amplify program awareness
- **Credibility**: Youth voices validate the work
- **Recruitment**: Attract participants and supporters
- **Impact**: Demonstrate real transformation

### For Storytellers
- **Platform**: Their story connects to broader movement
- **Context**: Readers understand the full program
- **Community**: Join others sharing similar journeys
- **Legacy**: Story helps others find the same support

## Content Strategy

### Suggested Workflow

1. **Launch program database** with initial 6 programs ✅
2. **Link existing stories** to programs where appropriate
3. **Add CAMPFIRE** as first new program via web form
4. **Create new story** about CAMPFIRE participant
5. **Link story to CAMPFIRE** program
6. **Promote connected content** on social media
7. **Continue cycle**: Programs → Stories → Programs

### Content Ideas

**For Each Program:**
- Featured storyteller quote on program page
- 2-3 full stories from participants
- Mix of story types (overcoming challenges, skill development, community impact)

**Story Types:**
- **Personal Journey**: "How X Program Changed My Life"
- **Skill Development**: "Learning Y Through Z Program"
- **Community Impact**: "Giving Back After Finding Help"
- **Cultural Connection**: "Finding Identity Through Program"

## Next Steps

### Immediate (Done ✅)
- [x] Database migration for links
- [x] Web form for adding programs
- [x] Program pages fetch from database
- [x] Documentation system

### Phase 2 (Next)
- [ ] Update story pages to show linked program
- [ ] Update program pages to show related stories
- [ ] Add story count badges to program cards
- [ ] Create web form for adding stories with program picker

### Phase 3 (Future)
- [ ] Auto-suggest program links based on story content
- [ ] Tag-based program recommendations on stories
- [ ] Geographic clustering (show nearby programs)
- [ ] Impact dashboard (stories per program, reach metrics)
- [ ] Email notifications when new story links to program

## API Examples

### Adding a Program (via form)
```typescript
// User fills out form at /community-programs/add
// Form submits to Supabase
const { data, error } = await supabase
  .from('community_programs')
  .insert([{
    name: formData.name,
    organization: formData.organization,
    // ... all fields
  }])
  .select()
  .single();

// Auto-redirects to /community-programs/{data.id}
```

### Linking a Story to Program
```typescript
// When editing story
const { error } = await supabase
  .from('articles')
  .update({ program_id: selectedProgramId })
  .eq('id', storyId);
```

### Fetching Connected Content
```typescript
// Get all programs with story counts
const { data: programs } = await supabase
  .from('programs_with_stories')
  .select('*');

programs.forEach(p => {
  console.log(`${p.name}: ${p.story_count} stories`);
});
```

## Maintenance

### Regular Tasks
- **Review new programs** added via form for quality
- **Link new stories** to programs when published
- **Update metrics** as programs grow
- **Feature new storytellers** on program pages

### Quality Checks
- All programs have at least 1 story (goal)
- All stories link to programs where applicable
- Tags are consistent and meaningful
- Contact info is current and accurate

## Support

For questions about:
- **Adding programs**: See `/community-programs/add` form
- **Database structure**: See migration SQL file
- **Technical issues**: Check Supabase logs
- **Content strategy**: Review this guide

---

**The system is designed to be simple, intuitive, and powerful.**

Anyone can add a program via the web form. Stories naturally connect. The platform grows organically through real community experiences.
