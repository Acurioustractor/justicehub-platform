# Quick Start: Managing Programs & Profiles

## ✅ All Fixes Complete

### Issues Fixed:
1. ✅ Community Programs page showing 0 → **FIXED** (CSP policy updated)
2. ✅ Profile-organization query errors → **FIXED** (Relationship specifications added)
3. ✅ Kristy Bloomfield incorrect linkages → **FIXED** (Removed from 3 programs)

---

## 🚀 Quick Commands Reference

### View All Programs
```bash
npx tsx src/scripts/manage-programs.ts list
```

### Search for a Profile
```bash
npx tsx src/scripts/manage-programs.ts search "Name"
```

### View All Profile-Program Links
```bash
npx tsx src/scripts/manage-programs.ts appearances
```

### Delete an Incorrect Link
```bash
npx tsx src/scripts/manage-programs.ts delete <appearance-id>
```

---

## 📝 Adding a New Program

### Step 1: Create the Program (Direct SQL)

```sql
INSERT INTO community_programs (
  id, name, organization, location, state, approach,
  description, impact_summary, success_rate, participants_served,
  years_operating, contact_phone, contact_email, website,
  is_featured, indigenous_knowledge, community_connection_score,
  tags, founded_year
) VALUES (
  gen_random_uuid(),
  'Program Name',
  'Organization Name',
  'City',
  'STATE',  -- NSW, VIC, QLD, SA, WA, TAS, NT, ACT
  'Community-based',  -- Options: Indigenous-led, Community-based, Grassroots, Culturally-responsive
  'Description of what the program does',
  'Impact summary - key outcomes',
  75,  -- success rate %
  100,  -- participants served
  3,   -- years operating
  '+61 phone',
  'email@example.com',
  'https://website.com',
  false,  -- is_featured (true = show on homepage)
  false,  -- indigenous_knowledge
  7.5,   -- community_connection_score (0-10)
  ARRAY['tag1', 'tag2', 'mentorship'],
  2021   -- founded_year
);
```

### Step 2: Find Program ID
```bash
npx tsx src/scripts/manage-programs.ts list
```

Look for your new program and copy its ID.

---

## 🔗 Linking Profiles to Programs

### Important Rules:

**✅ Link ONLY:**
- Program participants sharing their own stories
- People directly impacted by the program
- Former participants now mentoring

**❌ DO NOT Link:**
- Staff members (unless sharing their own transformation)
- Program managers
- Researchers or evaluators
- People telling stories ABOUT outcomes (not their own experience)

### Step 1: Find the Profile ID

```bash
# Search Empathy Ledger for the person
npx tsx src/scripts/manage-programs.ts search "Person Name"

# Copy their profile ID
```

### Step 2: Find the Program ID

```bash
# List all programs
npx tsx src/scripts/manage-programs.ts list

# Copy the program ID
```

### Step 3: Create the Link

```bash
npx tsx src/scripts/manage-programs.ts link \
  "<profile-id>" \
  "<program-id>" \
  "Program Participant" \
  "This program changed my life..." \
  true  # or false for featured status
```

**Role Examples:**
- "Program Participant"
- "Former Participant"
- "Youth Mentor"
- "Community Member"

---

## 🗑️ Removing Incorrect Links

### Step 1: Find the Appearance ID

```bash
npx tsx src/scripts/manage-programs.ts list
```

Under each program, you'll see profile links with their `Appearance ID`.

### Step 2: Delete the Link

```bash
npx tsx src/scripts/manage-programs.ts delete <appearance-id>
```

---

## 📖 Current Program Status

After fixes:

1. **BackTrack Youth Works** (NSW, Community-based)
   - Graham Williams ✅ (volunteer perspective)
   - ~~Kristy Bloomfield~~ ❌ REMOVED

2. **Creative Futures Collective** (VIC, Community-based)
   - ~~Kristy Bloomfield~~ ❌ REMOVED
   - Unknown profile (needs review)

3. **Healing Circles Program** (NT, Indigenous-led)
   - Uncle Dale ✅ (cultural healing vision)
   - Uncle Frank Daniel Landers ✅ (elder wisdom)
   - Jimmy Frank ✅ (community healing)

4. **Logan Youth Collective** (QLD, Grassroots)
   - ~~Kristy Bloomfield~~ ❌ REMOVED

5. **TechStart Youth** (SA, Community-based)
   - No profiles yet

6. **Yurrampi Growing Strong** (NT, Indigenous-led)
   - Henry Doyle ✅ (community elder)

---

## 🎯 Best Practices

1. **Always search Empathy Ledger first** to understand who the person is
2. **Read their stories** before linking them
3. **Use descriptive roles** that reflect their actual relationship to the program
4. **Pull real quotes** from their stories for excerpts
5. **Featured status** should be used sparingly for the most impactful stories

---

## 📚 Full Documentation

For detailed guides:
- [docs/PROGRAM_MANAGEMENT_GUIDE.md](./PROGRAM_MANAGEMENT_GUIDE.md) - Complete guide
- [docs/SERVICE_IMPORT_GUIDE.md](./SERVICE_IMPORT_GUIDE.md) - Service management

---

## 🆘 Common Issues

### "Profile appearances still showing after delete"
- Make sure you're using the correct appearance ID
- The delete script uses service role key for permissions

### "Can't find profile in Empathy Ledger"
- Check spelling of name
- Try searching with partial names
- Profile might not be public yet

### "Program not showing on website"
- Check CSP settings include `https://*.supabase.co`
- Clear browser cache
- Check `is_featured` flag for homepage visibility

---

**Remember:** When in doubt, DON'T link. It's better to have fewer, accurate links than many incorrect ones.
