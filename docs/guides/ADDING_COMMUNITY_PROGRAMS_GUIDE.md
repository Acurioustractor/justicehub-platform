# 📘 Guide: Adding Community Programs to JusticeHub

## 🎯 Current Status

**Programs are currently stored as:** HARDCODED DATA in the React components

**Location:** `src/app/community-programs/page.tsx` (lines 45-172)

**Why this matters:** To add new programs, you need to either:
1. **Short-term:** Edit the TypeScript file directly (quick but not scalable)
2. **Long-term:** Move to database storage (better for many programs)

---

## 📋 Understanding the Program Data Structure

Each community program has these fields:

```typescript
{
  id: string;                    // Unique ID (e.g., '7', '8')
  name: string;                  // Program name
  organization: string;          // Organization running it
  location: string;              // City/town
  state: string;                 // NSW, QLD, NT, VIC, SA, WA, TAS, ACT

  // Categorization
  approach: 'Indigenous-led' | 'Community-based' | 'Grassroots' | 'Culturally-responsive';
  indigenous_knowledge: boolean; // Uses traditional knowledge?
  is_featured: boolean;          // Show in featured section?

  // Description
  description: string;           // Full description (1-2 sentences)
  impact_summary: string;        // One-line impact statement
  tags: string[];               // ['Tag1', 'Tag2', 'Tag3']

  // Metrics
  success_rate: number;          // Percentage (e.g., 87)
  participants_served: number;   // Total served (e.g., 300)
  years_operating: number;       // How many years running
  founded_year: number;          // Year established (e.g., 2009)
  community_connection_score: number; // 0-100 rating

  // Contact (all optional)
  contact_phone?: string;        // e.g., '02 6772 1234'
  contact_email?: string;        // e.g., 'info@example.org.au'
  website?: string;              // e.g., 'https://example.org.au'
}
```

---

## 🚀 METHOD 1: Quick Add (Edit TypeScript File)

### Step 1: Open the file
```bash
# Open in your editor
code src/app/community-programs/page.tsx
```

### Step 2: Find the programs array (line 45)
Look for: `const samplePrograms: CommunityProgram[] = [`

### Step 3: Add your program
Copy this template and add it to the array:

```typescript
{
  id: '7',  // INCREMENT THIS NUMBER!
  name: 'Your Program Name',
  organization: 'Organization Name',
  location: 'City Name',
  state: 'NSW',  // or QLD, VIC, NT, SA, WA, TAS, ACT
  approach: 'Community-based',  // or 'Indigenous-led', 'Grassroots', 'Culturally-responsive'
  description: 'Brief description of what the program does and who it serves.',
  impact_summary: 'One-line powerful impact statement - X% achieve Y outcome',
  success_rate: 75,  // Success percentage
  participants_served: 100,  // Number of people served
  years_operating: 5,  // How many years
  contact_phone: '02 1234 5678',  // Optional
  contact_email: 'info@program.org.au',  // Optional
  website: 'https://program.org.au',  // Optional
  is_featured: false,  // Set to true to show in featured section
  indigenous_knowledge: false,  // true if uses traditional knowledge
  community_connection_score: 85,  // Your assessment 0-100
  tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4'],  // Relevant tags
  founded_year: 2018  // Year it started
},
```

### Step 4: Update the detail page too
You need to add the same program to **both files**:
1. `src/app/community-programs/page.tsx` (main listing)
2. `src/app/community-programs/[id]/page.tsx` (detail pages)

Look for the `programs` array in the detail page (line ~45) and add it there too.

---

## 🗄️ METHOD 2: Proper Database Setup (Recommended)

I'll create this for you! It includes:
1. Database table creation
2. Migration script
3. Easy-to-use program addition tool
4. Update pages to read from database

---

## 📝 Real Example: Adding CAMPFIRE (Mount Isa)

Based on what you've learned about programs around Australia, here's how to add CAMPFIRE:

```typescript
{
  id: '7',
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
  contact_phone: '0400 123 456',  // Get real number
  contact_email: 'brodie@germainefitness.com.au',
  website: 'https://brodiegermainefitness.com.au',
  is_featured: true,
  indigenous_knowledge: true,
  community_connection_score: 98,
  tags: ['Cultural Connection', 'On Country', 'Elder Mentorship', 'Physical Fitness', 'Indigenous Youth', 'Remote QLD'],
  founded_year: 2021
},
```

---

## 🎨 Choosing the Right Approach Type

### **Indigenous-led**
- Led BY Indigenous people
- Uses traditional knowledge/practices
- Elder involvement
- Connection to country
- **Examples:** Yurrampi, Healing Circles, CAMPFIRE

### **Community-based**
- Run by local community members
- Embedded in specific community
- Relationship-focused
- Practical support
- **Examples:** BackTrack, Creative Futures, TechStart

### **Grassroots**
- Started by community members (often with lived experience)
- Bottom-up organization
- Youth-led or peer-led
- Social justice focus
- **Examples:** Logan Youth Collective

### **Culturally-responsive**
- Adapts to cultural needs
- Not necessarily Indigenous-led but respects culture
- Works WITH families and communities
- Honors cultural values

---

## 🏷️ Suggested Tags by Program Type

**Indigenous Programs:**
- Cultural Healing
- Elder Mentorship
- Connection to Country
- Traditional Knowledge
- Ceremony
- Language Revival
- Cultural Strength

**Vocational/Skills:**
- Vocational Training
- Employment Pathways
- Apprenticeships
- Digital Skills
- Technology
- Creative Arts

**Support Services:**
- Mental Health
- Trauma Recovery
- Family Support
- Housing Support
- Independent Living

**Youth Development:**
- Youth Leadership
- Mentorship
- Peer Support
- Social Justice
- Community Organizing
- Advocacy

**Specific Populations:**
- Young Men
- Young Women
- LGBTQI+ Youth
- Neurodiversity
- Foster Care
- Rural/Remote

---

## 📊 Gathering Program Information

When documenting programs you've experienced, collect:

### **Essential Info:**
- ✅ Program name
- ✅ Organization
- ✅ Location (city + state)
- ✅ What they do (description)
- ✅ Impact statement

### **Nice to Have:**
- Success metrics (%, numbers)
- Contact details
- Website
- When founded
- How many served

### **Your Assessment:**
- Approach type (Indigenous-led, Community-based, etc.)
- Uses traditional knowledge? (yes/no)
- Community connection (your rating 0-100)
- Relevant tags

---

## 🔍 Where to Find Program Info

1. **Program websites** - About pages, impact reports
2. **Annual reports** - Success metrics, numbers served
3. **Social media** - Recent activities, contact info
4. **News articles** - Impact stories, founding date
5. **Your experience** - Direct observation, conversations
6. **Contact them** - Ask for one-pager or fact sheet

---

## ⚡ Quick Start Checklist

- [ ] Identify program name & organization
- [ ] Get location (city + state)
- [ ] Write 1-2 sentence description
- [ ] Write powerful impact statement
- [ ] Choose approach type
- [ ] Gather metrics (success rate, numbers, years)
- [ ] Get contact info (phone, email, website)
- [ ] Assign tags (3-5 relevant ones)
- [ ] Rate community connection (0-100)
- [ ] Decide if featured & indigenous knowledge
- [ ] Add to BOTH files (page.tsx and [id]/page.tsx)

---

## 🎯 Next Steps

I'll create for you:
1. **Database table** - Store programs properly
2. **Migration script** - Move current 6 programs to database
3. **Easy add program script** - Just answer questions, it adds the program
4. **Update pages** - Read from database instead of hardcoded

Would you like me to set that up now?

---

## 💡 Pro Tips

1. **Start with programs you know well** - Your direct experience is valuable
2. **Get permission** - Check with organizations before listing
3. **Verify contact info** - Make sure it's current
4. **Be honest with metrics** - Estimates are okay if you note them
5. **Focus on impact** - What ACTUALLY changes for young people?
6. **Cultural sensitivity** - Especially with Indigenous programs, get proper approval
7. **Update regularly** - Programs change, keep info current

---

## 📧 Need Help?

If you're stuck or want to add programs but aren't sure about the details:
1. Create a draft with what you know
2. Mark uncertain info with [VERIFY]
3. Contact the program directly for accurate info
4. Add it with partial info, update later

**Remember:** It's better to have a program listed with some info than not listed at all!

---

Generated: October 13, 2025
