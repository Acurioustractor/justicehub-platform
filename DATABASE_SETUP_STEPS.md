# 🚀 Database Setup - Step by Step

## ✅ STEP 1: Create the Database Table

### **Method A: Using Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `tednluwflfhxyucgwigh`

2. **Go to SQL Editor**
   - Left sidebar → Click "SQL Editor"
   - Click "+ New query"

3. **Copy the SQL**
   - Open: `supabase/migrations/create-community-programs-table.sql`
   - Copy ALL the SQL code (lines 1-118)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - You should see: ✅ "Success. No rows returned"

5. **Verify Table Created**
   - Left sidebar → Click "Table Editor"
   - You should see "community_programs" in the list

---

### **Method B: Using CLI (Alternative)**

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## ✅ STEP 2: Migrate Existing Programs

This moves the 6 existing hardcoded programs into the database.

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/migrate-programs-to-database.ts
```

**Expected Output:**
```
🔄 MIGRATING PROGRAMS TO DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Found 6 programs to migrate

[1/6] BackTrack Youth Works...
  ✅ Added
[2/6] Healing Circles Program...
  ✅ Added
[3/6] Logan Youth Collective...
  ✅ Added
[4/6] Creative Futures Collective...
  ✅ Added
[5/6] Yurrampi Growing Strong...
  ✅ Added
[6/6] TechStart Youth...
  ✅ Added

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MIGRATION COMPLETE

✅ Added: 6
❌ Errors: 0
📚 Total: 6

🎉 Programs successfully migrated to database!
```

---

## ✅ STEP 3: Verify Programs in Database

Let's check that the programs are actually there:

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function check() {
  const { data, error, count } = await supabase
    .from('community_programs')
    .select('name, location, state', { count: 'exact' });

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Found', count, 'programs:');
    data.forEach((p, i) => {
      console.log(\`  \${i+1}. \${p.name} (\${p.location}, \${p.state})\`);
    });
  }
}

check();
"
```

**Expected Output:**
```
✅ Found 6 programs:
  1. BackTrack Youth Works (Armidale, NSW)
  2. Healing Circles Program (Alice Springs, NT)
  3. Logan Youth Collective (Logan, QLD)
  4. Creative Futures Collective (Melbourne, VIC)
  5. Yurrampi Growing Strong (Alice Springs, NT)
  6. TechStart Youth (Adelaide, SA)
```

---

## ✅ STEP 4: Test Adding a New Program

Let's add CAMPFIRE as your first new program!

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-community-program.ts
```

**The script will ask you questions. Here's what to enter for CAMPFIRE:**

```
Program Name: CAMPFIRE
Organization: Brodie Germaine Fitness
Location (city/town): Mount Isa
State: QLD
Select approach (1-4): 1  [for Indigenous-led]
Uses Indigenous knowledge? (yes/no): yes
Feature this program? (yes/no): yes
Description (1-2 sentences): Camping on Country program combining cultural immersion, physical fitness, and mentorship for Indigenous youth in Northwest Queensland. Seven-day expeditions with Elders teaching traditional practices.
Impact summary (one powerful line): Reconnecting Indigenous youth to culture and country - 85% show improved wellbeing
Tags (comma-separated): Cultural Connection, On Country, Elder Mentorship, Physical Fitness, Indigenous Youth, Remote QLD
Success rate (0-100): 85
Participants served: 150
Years operating: 3
Founded year: 2021
Community connection score (0-100): 98
Phone: [press Enter to skip or add if you have it]
Email: brodie@germainefitness.com.au
Website: https://brodiegermainefitness.com.au
```

Then confirm with `yes` and it will be added!

---

## ✅ STEP 5: Update Pages to Read from Database

Now we need to update the pages to fetch from database instead of hardcoded data.

I'll create updated versions of the pages for you...

---

## 🎯 Summary

After these steps:
- ✅ Database table created
- ✅ 6 existing programs migrated
- ✅ Verified programs in database
- ✅ Added CAMPFIRE (your first new program!)
- ✅ Pages reading from database

---

## 🐛 Troubleshooting

### **Error: "relation does not exist"**
- You haven't run Step 1 yet
- Go back and create the table in Supabase

### **Error: "permission denied"**
- Check that `.env.local` has correct Supabase credentials
- Make sure `YJSF_SUPABASE_SERVICE_KEY` is set for write operations

### **Error: "duplicate key value"**
- Program already exists in database
- Check what's already there before migrating again

### **Nothing shows on website**
- Pages still using hardcoded data
- Need to complete Step 5 (update pages)

---

## 🎉 Ready?

Let's start with **Step 1** - I'll help you through each step!
