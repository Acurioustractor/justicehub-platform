# Partner Integration Testing Locations

**Quick Reference for Testing**

---

## Site Placement Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           JUSTICEHUB SITE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  NAVIGATION                                                             │
│  ├── Stories                                                            │
│  ├── Discover                                                           │
│  │   ├── People                                                         │
│  │   ├── Organizations ←── [Partner org profiles live here]             │
│  │   ├── Programs                                                       │
│  │   ├── Services ←── [Hear Me Out legal triage link]                   │
│  │   └── Service Map ←── [Call It Out data overlay]                     │
│  ├── Intelligence                                                       │
│  │   ├── Ask ALMA ←── [Trained on partner resources]                    │
│  │   ├── System Map ←── [Call It Out layer toggle]                      │
│  │   └── [NEW] Discrimination Map                                       │
│  ├── Platform                                                           │
│  │   └── [NEW] Know Your Rights ←── [Cop Watch resources]               │
│  └── About                                                              │
│                                                                         │
│  NEW PAGES TO CREATE                                                    │
│  ├── /crisis-alternatives ←── [Alt First Responders]                    │
│  ├── /know-your-rights ←── [Cop Watch + partner legal resources]        │
│  └── /report-incident ←── [Gateway to Call It Out]                      │
│                                                                         │
│  FOOTER UPDATES                                                         │
│  ├── For Youth                                                          │
│  │   ├── [NEW] Report Racism → callitout.com.au                         │
│  │   ├── [NEW] Legal Help → hearmeout.org.au                            │
│  │   └── [NEW] Know Your Rights → /know-your-rights                     │
│  └── Connect                                                            │
│      └── [NEW] Crisis Alternatives → /crisis-alternatives               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist by Integration

### 1. Hear Me Out (Legal Triage)

| Test Location | URL | What to Test |
|---------------|-----|--------------|
| Services page | `/services` | "Need legal help?" CTA |
| ALMA chat | `/intelligence/chat` | Legal query triggers referral |
| Footer | all pages | "Legal Help" link in footer |

**Test Script:**
1. Go to `/intelligence/chat`
2. Ask: "I want to make a complaint about discrimination"
3. Verify ALMA suggests Hear Me Out
4. Click link, verify opens https://www.hearmeout.org.au/

### 2. Call It Out (Hate Map)

| Test Location | URL | What to Test |
|---------------|-----|--------------|
| Community Map | `/community-map` | Layer toggle for incidents |
| Intelligence Map | `/intelligence/map` | Data overlay |
| Footer | all pages | "Report Racism" link |

**Test Script:**
1. Go to `/community-map`
2. Look for "Show discrimination incidents" toggle
3. Enable, verify heatmap/markers appear
4. Click incident for details
5. Verify "Report an incident" links to Call It Out

### 3. Alternative First Responders

| Test Location | URL | What to Test |
|---------------|-----|--------------|
| Crisis page | `/crisis-alternatives` | Full resource page |
| Services | `/services` | Category or CTA |
| Org profile | `/organizations/[slug]` | Partner profile |

**Test Script:**
1. Go to `/crisis-alternatives`
2. Verify position paper embed/link
3. Verify video embeds work
4. Check links to alternativefirstresponders.com.au
5. Go to `/organizations/alternative-first-responders`
6. Verify profile is complete

### 4. Cop Watch

| Test Location | URL | What to Test |
|---------------|-----|--------------|
| Know Your Rights | `/know-your-rights` | Resources page |
| Org profile | `/organizations/[slug]` | Partner profile |
| Services | `/services` | Legal category |

**Test Script:**
1. Go to `/know-your-rights`
2. Verify Know Your Rights guides present
3. Check links to copwatch.org.au
4. Verify phone number displayed: +61 2 9514 4440
5. Go to `/organizations/cop-watch`
6. Verify profile is complete

---

## Phase 1 Implementation (Quick Wins)

### Organizations to Add to Database

```sql
-- Run in Supabase SQL editor

INSERT INTO organizations (name, slug, description, website, is_published, category)
VALUES
(
  'The Justice Project',
  'the-justice-project',
  'Australia''s leading civil rights and social justice law firm, providing legal representation and advocacy for marginalized communities.',
  'https://justice.org.au',
  true,
  'legal'
),
(
  'Call It Out',
  'call-it-out',
  'A simple and secure way for people to report incidents of racism and discrimination towards First Nations Peoples.',
  'https://callitout.com.au',
  true,
  'advocacy'
),
(
  'Hear Me Out',
  'hear-me-out',
  'AI-powered triage tool helping people identify the right complaint pathways and connect with support services.',
  'https://www.hearmeout.org.au',
  true,
  'legal'
),
(
  'Alternative First Responders',
  'alternative-first-responders',
  'Advocacy campaign promoting community-centered emergency response systems that prioritize care over force.',
  'https://alternativefirstresponders.com.au',
  true,
  'advocacy'
),
(
  'Cop Watch',
  'cop-watch',
  'Police accountability and civil rights organization focused on oversight and community education.',
  'https://www.copwatch.org.au',
  true,
  'advocacy'
);
```

### Footer Config Update

**File:** `src/config/navigation.ts`

Add to `footerSections`:

```typescript
{
    title: 'For Youth',
    links: [
        // ... existing links ...
        { label: 'Report Racism', href: 'https://callitout.com.au', description: 'Report discrimination' },
        { label: 'Legal Help', href: 'https://www.hearmeout.org.au', description: 'Find complaint pathways' },
    ]
},
{
    title: 'Resources',  // New section or add to existing
    links: [
        { label: 'Know Your Rights', href: '/know-your-rights', description: 'Legal rights info' },
        { label: 'Crisis Alternatives', href: '/crisis-alternatives', description: 'Non-police response' },
    ]
}
```

---

## New Pages to Create

### 1. `/crisis-alternatives`

**File:** `src/app/crisis-alternatives/page.tsx`

**Content:**
- Hero: "When Crisis Hits, Care Comes First"
- Embed AFR position paper
- Video section with symposium recordings
- Local alternative responder directory
- Link to AFR website

### 2. `/know-your-rights`

**File:** `src/app/know-your-rights/page.tsx`

**Content:**
- Hero: "Know Your Rights"
- Rights during police encounters
- How to file complaints
- Cop Watch resources
- Hear Me Out triage tool
- Legal aid contacts by state

### 3. `/report-incident`

**File:** `src/app/report-incident/page.tsx`

**Content:**
- Gateway page explaining reporting options
- Call It Out for racism/discrimination
- Hear Me Out for complaints
- Internal feedback form
- Anonymous reporting options

---

## ALMA Training Updates

**File:** Update ALMA system prompt or knowledge base

Add partner awareness:

```
PARTNER RESOURCES:
- For legal complaints or triage: Suggest Hear Me Out (hearmeout.org.au)
- For reporting racism/discrimination: Suggest Call It Out (callitout.com.au)
- For police accountability issues: Suggest Cop Watch (copwatch.org.au)
- For non-police crisis response info: Suggest Alternative First Responders

When users ask about legal help, complaints, discrimination, police issues, or crisis alternatives,
mention relevant partner resources.
```

---

## URLs to Test After Implementation

| Page | URL | Status |
|------|-----|--------|
| The Justice Project profile | `/organizations/the-justice-project` | TODO |
| Call It Out profile | `/organizations/call-it-out` | TODO |
| Hear Me Out profile | `/organizations/hear-me-out` | TODO |
| AFR profile | `/organizations/alternative-first-responders` | TODO |
| Cop Watch profile | `/organizations/cop-watch` | TODO |
| Crisis Alternatives | `/crisis-alternatives` | TODO |
| Know Your Rights | `/know-your-rights` | TODO |
| Report Incident | `/report-incident` | TODO |
| Updated Footer | any page | TODO |
| Map with Call It Out layer | `/community-map` | TODO |
| ALMA with partner awareness | `/intelligence/chat` | TODO |

---

## Success Criteria

- [ ] All 5 partner organizations have profile pages
- [ ] Footer includes new partner links
- [ ] `/crisis-alternatives` page live
- [ ] `/know-your-rights` page live
- [ ] ALMA responds with partner resources for relevant queries
- [ ] Map has toggle for discrimination incidents (if data available)
- [ ] All external links open in new tab
- [ ] Partner logos displayed with attribution

---

*Document Location: `/docs/strategic/plans/PARTNER_INTEGRATION_TESTING.md`*
