# 🌟 Community Programs System - Complete Guide

## 📖 Overview

This guide explains how community programs are stored and how you can add programs based on your experiences around Australia.

---

## 🎯 Current Status: HARDCODED → READY TO MIGRATE

### **How Programs Are Currently Stored:**

Programs are **hardcoded** in two TypeScript files:
1. `src/app/community-programs/page.tsx` - Main listing page
2. `src/app/community-programs/[id]/page.tsx` - Individual program pages

**This means:** To add programs now, you edit the code directly (not ideal but works).

### **What I've Set Up For You:**

✅ **Database schema** - Professional table structure
✅ **Migration SQL** - Creates the table in Supabase
✅ **Migration script** - Moves existing 6 programs to database
✅ **Add program script** - Interactive CLI tool to add programs easily
✅ **Complete documentation** - Everything you need to know

---

## 🚀 Quick Start: Add a Program NOW

### **Option 1: Quick Add (Edit Files)**

**For adding 1-2 programs quickly:**

1. Open `src/app/community-programs/page.tsx`
2. Find line 45: `const samplePrograms: CommunityProgram[] = [`
3. Copy an existing program object
4. Update all fields with your program's info
5. Increment the `id` field (e.g., from '6' to '7')
6. Repeat in `src/app/community-programs/[id]/page.tsx`

**Pro:** Works immediately
**Con:** Must edit code; not scalable for many programs

---

### **Option 2: Database Setup (Better Long-term)**

**For adding many programs over time:**

#### **Step 1: Create Database Table**

```bash
# Go to Supabase Dashboard
# SQL Editor → New Query
# Copy/paste: supabase/migrations/create-community-programs-table.sql
# Run it
```

#### **Step 2: Migrate Existing Programs**

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/migrate-programs-to-database.ts
```

This moves the 6 existing programs into the database.

#### **Step 3: Add New Programs**

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-community-program.ts
```

This starts an interactive questionnaire. Just answer the questions!

---

## 📋 Program Data Structure

Each program needs:

### **Required Fields:**

```typescript
name: string                    // "CAMPFIRE"
organization: string            // "Brodie Germaine Fitness"
location: string                // "Mount Isa"
state: string                   // NSW, VIC, QLD, SA, WA, TAS, NT, ACT
approach: string                // See below
description: string             // 1-2 sentences
impact_summary: string          // One powerful line
```

### **Important Fields:**

```typescript
indigenous_knowledge: boolean   // Uses traditional knowledge?
is_featured: boolean           // Show in featured section?
tags: string[]                 // ["Tag1", "Tag2", "Tag3"]
success_rate: number           // Percentage (0-100)
participants_served: number    // How many served
years_operating: number        // How many years running
founded_year: number          // Year established
community_connection_score: number  // Your rating (0-100)
```

### **Optional Fields:**

```typescript
contact_phone: string          // "02 1234 5678"
contact_email: string          // "info@program.org.au"
website: string               // "https://program.org.au"
```

---

## 🏷️ Choosing the Right Approach

### **Indigenous-led**
- Led BY Indigenous people
- Uses traditional knowledge
- Elder involvement
- Connection to country
- **Examples:** Healing Circles, Yurrampi, CAMPFIRE

### **Community-based**
- Run by local community
- Relationship-focused
- Practical support
- Embedded locally
- **Examples:** BackTrack, Creative Futures

### **Grassroots**
- Started by community (often lived experience)
- Bottom-up organization
- Youth-led or peer-led
- Social justice focus
- **Examples:** Logan Youth Collective

### **Culturally-responsive**
- Adapts to cultural needs
- Respects cultural values
- Works WITH families
- Honors traditions

---

## 📝 Example: Adding CAMPFIRE

Based on your experience in Mount Isa, here's how to add CAMPFIRE:

```typescript
{
  name: 'CAMPFIRE',
  organization: 'Brodie Germaine Fitness',
  location: 'Mount Isa',
  state: 'QLD',
  approach: 'Indigenous-led',
  description: 'Camping on Country program combining cultural immersion, physical fitness, and mentorship for Indigenous youth in Northwest Queensland. Seven-day expeditions with Elders teaching traditional practices.',
  impact_summary: 'Reconnecting Indigenous youth to culture and country - 85% show improved wellbeing and reduced justice involvement',
  success_rate: 85,
  participants_served: 150,
  years_operating: 3,
  contact_phone: '0400 123 456',
  contact_email: 'brodie@germainefitness.com.au',
  website: 'https://brodiegermainefitness.com.au',
  is_featured: true,
  indigenous_knowledge: true,
  community_connection_score: 98,
  tags: [
    'Cultural Connection',
    'On Country',
    'Elder Mentorship',
    'Physical Fitness',
    'Indigenous Youth',
    'Remote QLD'
  ],
  founded_year: 2021
}
```

---

## 🗂️ Files Created

### **Documentation:**
- `ADDING_COMMUNITY_PROGRAMS_GUIDE.md` - Detailed guide
- `COMMUNITY_PROGRAMS_SYSTEM.md` - This file (overview)

### **Database:**
- `supabase/migrations/create-community-programs-table.sql` - Table schema

### **Scripts:**
- `src/scripts/add-community-program.ts` - Interactive add tool
- `src/scripts/migrate-programs-to-database.ts` - Migrate existing

### **Existing Code:**
- `src/app/community-programs/page.tsx` - Main listing
- `src/app/community-programs/[id]/page.tsx` - Detail pages

---

## 🎯 Suggested Tags Library

Copy the relevant tags for your programs:

### **Indigenous Focus:**
- Cultural Healing
- Elder Mentorship
- Connection to Country
- Traditional Knowledge
- Ceremony
- Language Revival
- Cultural Strength
- On Country

### **Skills & Training:**
- Vocational Training
- Employment Pathways
- Apprenticeships
- Digital Skills
- Technology
- Creative Arts
- Animal Therapy

### **Support Services:**
- Mental Health
- Trauma Recovery
- Family Support
- Housing Support
- Independent Living
- Substance Abuse Support

### **Youth Development:**
- Youth Leadership
- Mentorship
- Peer Support
- Social Justice
- Community Organizing
- Advocacy

### **Target Groups:**
- Young Men
- Young Women
- LGBTQI+ Youth
- Neurodiversity
- Foster Care
- Rural/Remote
- Indigenous Youth

---

## 📊 Information Gathering Checklist

When documenting programs you've seen:

### **Must Have:**
- [ ] Program name
- [ ] Organization running it
- [ ] City and state
- [ ] What they do (1-2 sentences)
- [ ] Impact statement (one powerful line)
- [ ] Approach type (Indigenous-led, etc.)

### **Should Have:**
- [ ] Success metrics (%, numbers)
- [ ] Contact info (phone, email, website)
- [ ] Years operating / Founded year
- [ ] Number of participants served
- [ ] Uses Indigenous knowledge? (yes/no)

### **Nice to Have:**
- [ ] Specific tags (3-5)
- [ ] Community connection score (your assessment)
- [ ] Featured worthy? (yes/no)

---

## 🚦 Implementation Roadmap

### **Phase 1: Setup (One-time)**
1. Run database migration
2. Migrate existing 6 programs
3. Test that programs load from database

### **Phase 2: Add Programs**
1. Use interactive script to add programs
2. OR edit files directly for quick adds
3. Verify they show on website

### **Phase 3: Update Pages (Optional)**
1. Update pages to read from database
2. Remove hardcoded data
3. Add admin interface for editing

---

## 💡 Pro Tips

1. **Start with programs you know well** - Your direct experience is gold
2. **Get permission first** - Check with organizations before listing
3. **Verify contact info** - Make sure it's current
4. **Be honest with metrics** - Estimates okay, just note them
5. **Focus on impact** - What ACTUALLY changes?
6. **Cultural sensitivity** - Get approval for Indigenous programs
7. **Update regularly** - Programs change, keep info fresh

---

## 🔄 Workflow Examples

### **Scenario 1: You visited a program last week**

1. While memory is fresh, jot down notes
2. Run: `npx tsx src/scripts/add-community-program.ts`
3. Answer questions based on your visit
4. Done! Program is live

### **Scenario 2: Adding 10 programs from your travels**

1. Create spreadsheet with program info
2. Run migration to set up database
3. For each program, run add script
4. Takes ~5 minutes per program

### **Scenario 3: Quick add for demo**

1. Edit `page.tsx` files
2. Copy existing program
3. Change all fields
4. Increment ID
5. Refresh page - done!

---

## 📞 Questions?

### "Can I add programs without full info?"
**Yes!** Add what you know, leave optional fields blank. Update later.

### "What if I'm not sure about metrics?"
**Make an estimate** and note it in description like "approximately X%"

### "How do I feature a program?"
Set `is_featured: true` - it shows in the featured section

### "Can I add programs from other states?"
**Absolutely!** We want nationwide coverage

### "What if contact info changes?"
Easy to update in database or code files

---

## ✅ Next Steps

**Right Now (Option 1 - Quick):**
1. Pick a program you know
2. Open `src/app/community-programs/page.tsx`
3. Copy an existing program
4. Update all fields
5. Increment ID
6. Do same in `[id]/page.tsx`
7. Save, refresh, see it live!

**OR (Option 2 - Better Long-term):**
1. Run database migration SQL
2. Run migration script for existing programs
3. Use interactive script to add new programs
4. Update pages to read from database

---

## 📚 Additional Resources

- **Full guide:** See `ADDING_COMMUNITY_PROGRAMS_GUIDE.md`
- **Database schema:** `supabase/migrations/create-community-programs-table.sql`
- **Add script:** `src/scripts/add-community-program.ts`
- **Migration script:** `src/scripts/migrate-programs-to-database.ts`

---

**Remember:** Every program you add helps connect young people with life-changing support. Your knowledge of Australia's community programs is valuable - share it! 🌟

---

Generated: October 13, 2025
System ready for program additions!
