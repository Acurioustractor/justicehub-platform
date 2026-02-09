# JusticeHub x The Justice Project Partnership PDR

**Product Design Requirements**
**Version:** 1.0
**Date:** January 2026
**Status:** Planning
**Stakeholders:** Ben Knight (JusticeHub), George Newhouse (The Justice Project)

---

## Executive Summary

This PDR outlines the integration of The Justice Project's suite of tools and four partner organizations into the JusticeHub ecosystem, creating a shared services layer for community justice organizations across Australia.

---

## 1. Partner Integrations

### 1.1 The Justice Project Apps

#### Hear Me Out (Legal Triage)
- **URL:** https://www.hearmeout.org.au/
- **Function:** AI-powered complaint triage tool
- **Coverage:** NSW, Victoria, Federal matters
- **Integration Type:** API/Embed or referral link
- **Value:** Connects JusticeHub organizations to legal pathways

#### Call It Out (Hate Map)
- **URL:** https://callitout.com.au/
- **Function:** Racism/discrimination incident reporting for First Nations peoples
- **Data:** Location-based incident reports
- **Integration Type:** Map embed, data sharing, or co-display
- **Value:** Overlays discrimination data with services map

### 1.2 Additional Partner Organizations

#### Alternative First Responders
- **URL:** https://alternativefirstresponders.com.au/
- **Function:** Advocacy for non-police emergency response
- **Content:** Position papers, symposium recordings, resources
- **Integration Type:** Resource library, organization profile
- **Value:** Alternative crisis response education

#### Cop Watch
- **URL:** https://www.copwatch.org.au/
- **Function:** Police accountability and oversight
- **Contact:** +61 (0)2 9514 4440
- **Integration Type:** Organization profile, resource links
- **Value:** Know Your Rights resources

---

## 2. Shared Services Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      JUSTICEHUB PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SHARED SERVICES LAYER                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   LEGAL     │  │  INCIDENT   │  │  CRISIS     │     │   │
│  │  │   TRIAGE    │  │  REPORTING  │  │  RESPONSE   │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │ Hear Me Out │  │ Call It Out │  │ Alt First   │     │   │
│  │  │    API      │  │    Map      │  │ Responders  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   POLICE    │  │ GOVERNANCE  │  │ PHILANTHROPY│     │   │
│  │  │   OVERSIGHT │  │   SUPPORT   │  │  MATCHING   │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │  Cop Watch  │  │  Minutes/   │  │  Funder     │     │   │
│  │  │  Resources  │  │  Accounting │  │  Discovery  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CONSUMER LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   YOUTH     │  │   ORGS      │  │  FUNDERS    │             │
│  │             │  │             │  │             │             │
│  │ Direct help │  │ Support for │  │ Discover    │             │
│  │ via ALMA    │  │ operations  │  │ vetted orgs │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Specifications

### 3.1 Legal Triage Integration (Hear Me Out)

**Location on Site:** `/services` + `/intelligence/chat` (ALMA)

**Implementation Options:**

| Option | Effort | UX | Data Ownership |
|--------|--------|-----|----------------|
| Referral link | Low | Redirect | Theirs |
| Embed iframe | Medium | Seamless | Theirs |
| API integration | High | Native | Shared |

**Recommended Approach:** Start with referral link, evolve to API

**User Flow:**
```
User asks ALMA about legal issue
  → ALMA detects legal query
  → "Would you like help finding the right complaint pathway?"
  → Redirect to Hear Me Out with context
  → User completes triage
  → Returns to JusticeHub with resources
```

### 3.2 Call It Out Map Integration

**Location on Site:** `/community-map` or `/intelligence/map`

**Implementation Options:**

1. **Overlay Layer** - Add discrimination incidents as a toggleable layer on existing map
2. **Separate Tab** - "Report Racism" tab linking to their platform
3. **Data Sync** - Aggregate their incident data (with permission)

**Data Points to Display:**
- Incident locations (anonymized)
- Incident types
- Trend lines over time
- Correlation with service availability

**Mock Integration:**
```typescript
// Map layer configuration
const callItOutLayer = {
  id: 'discrimination-incidents',
  source: 'callitout-api', // or static JSON
  type: 'heatmap',
  paint: {
    'heatmap-weight': ['get', 'severity'],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'transparent',
      0.5, 'rgba(255,100,100,0.5)',
      1, 'rgba(255,0,0,0.8)'
    ]
  }
};
```

### 3.3 Alternative First Responders Resources

**Location on Site:** `/services` + New `/crisis-alternatives` page

**Content to Integrate:**
- [ ] Position paper (PDF embed or summarize)
- [ ] Symposium recordings (video embeds)
- [ ] Local alternative responder directory
- [ ] Educational resources

**Organization Profile Fields:**
```typescript
interface AlternativeResponder {
  name: string;
  coverage_area: string[];
  response_types: ('mental_health' | 'domestic_violence' | 'homelessness' | 'youth')[];
  phone: string;
  availability: string; // e.g., "24/7" or "9am-5pm"
  description: string;
}
```

### 3.4 Cop Watch Integration

**Location on Site:** `/resources` + Organization profile

**Content to Integrate:**
- [ ] Know Your Rights guides
- [ ] Complaint filing resources
- [ ] Legal support contacts
- [ ] Incident documentation tools

---

## 4. Site Placement Strategy

### Primary Entry Points

| Integration | Primary Location | Secondary Locations |
|-------------|-----------------|---------------------|
| Hear Me Out | ALMA Chat | Services, Footer |
| Call It Out | Community Map | Intelligence Map |
| Alt First Responders | Crisis Resources | Services, ALMA |
| Cop Watch | Resources | Services, Know Your Rights |

### Navigation Updates

**Add to Footer "For Youth" section:**
```
- Report Racism (→ Call It Out)
- Legal Help (→ Hear Me Out)
- Know Your Rights (→ Cop Watch)
- Crisis Alternatives (→ AFR)
```

**Add to Intelligence dropdown:**
```
- Discrimination Map (→ Call It Out overlay)
```

### New Pages Required

1. `/crisis-alternatives` - Alternative first responder directory
2. `/know-your-rights` - Legal rights resources (curated from partners)
3. `/report-incident` - Gateway to Call It Out + internal reporting

---

## 5. Technical Integration Plan

### Phase 1: Quick Wins (Week 1-2)

- [ ] Add partner organizations to database as `organizations`
- [ ] Create organization profile pages
- [ ] Add referral links to ALMA responses
- [ ] Update footer with partner links
- [ ] Add partner logos to relevant pages

### Phase 2: Content Integration (Week 3-4)

- [ ] Create `/crisis-alternatives` page
- [ ] Create `/know-your-rights` page
- [ ] Embed Hear Me Out in services flow
- [ ] Add Call It Out link to map page
- [ ] Import partner resources to wiki

### Phase 3: Deep Integration (Month 2+)

- [ ] API integration with Hear Me Out
- [ ] Data layer for Call It Out on map
- [ ] ALMA trained on partner resources
- [ ] Shared authentication (if desired)
- [ ] Governance support tools

---

## 6. Data & Privacy Considerations

### Data Flows

```
┌──────────────────┐     ┌──────────────────┐
│   JusticeHub     │────>│  Hear Me Out     │
│   (referral)     │     │  (legal triage)  │
└──────────────────┘     └──────────────────┘
         │
         │ Context passed:
         │ - Service type seeking
         │ - State/location
         │ - (No PII without consent)
         │
┌──────────────────┐     ┌──────────────────┐
│   JusticeHub     │<────│  Call It Out     │
│   (map display)  │     │  (incident data) │
└──────────────────┘     └──────────────────┘
         │
         │ Data received:
         │ - Anonymized locations
         │ - Incident categories
         │ - Aggregate counts
```

### Privacy Requirements

- [ ] Data sharing agreement with each partner
- [ ] Clear attribution on all partner content
- [ ] User consent for cross-platform data sharing
- [ ] Comply with First Nations data sovereignty principles

---

## 7. George Newhouse Conversation Insights

### Key Commitments from George

1. **Legal Triage Support**
   > "We might also be prepared to triage legal inquiries... from the organizations, not direct to consumer."

2. **Student Developer Collaboration**
   > "We get students to design features and develop the hub... if you can find a campus in Queensland."

3. **Refugee Case Sharing Proposal**
   > "I'm going to send you the proposal" - International refugee legal data sharing

### Action Items

| Item | Owner | Status |
|------|-------|--------|
| Send refugee case proposal | George | Pending |
| Introduce to Daniel Younger | George | TBD |
| Connect with Dean (dev team) | Ben | Pending |
| Create integration mock-ups | Ben | This PDR |
| Sydney launch event planning | Joint | Q1 2026 |
| Explore QLD student program | Joint | TBD |

---

## 8. Success Metrics

### Engagement

- Partner link clicks from JusticeHub
- Referrals completed to Hear Me Out
- Call It Out reports from JusticeHub users
- Resource page views

### Impact

- Legal cases triaged via partnership
- Organizations using shared services
- Philanthropy connections made
- Student contributions to codebase

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Partner API changes | Medium | High | Abstraction layer, fallbacks |
| Data privacy breach | Low | Critical | Anonymization, agreements |
| Partner org pivots | Medium | Medium | Multiple partners, own content |
| Student code quality | Medium | Low | Code review, mentorship |

---

## 10. Next Steps

### Immediate (This Week)

1. [ ] Share this PDR with George for feedback
2. [ ] Add 4 partners as organizations in Supabase
3. [ ] Create basic profile pages for each partner
4. [ ] Update footer with partner links

### Short-term (This Month)

1. [ ] Create `/crisis-alternatives` page
2. [ ] Create `/know-your-rights` page
3. [ ] Add Call It Out CTA to map page
4. [ ] Train ALMA on partner resources

### Medium-term (Next Quarter)

1. [ ] API integration with Hear Me Out
2. [ ] Map data layer from Call It Out
3. [ ] Student developer program launch
4. [ ] Sydney partnership launch event

---

## Appendix A: Partner Contact Details

| Organization | Contact | Email | Phone |
|--------------|---------|-------|-------|
| The Justice Project | George Newhouse | TBD | TBD |
| Call It Out | via Justice Project | - | - |
| Hear Me Out | via Justice Project | - | - |
| Cop Watch | - | - | +61 2 9514 4440 |
| Alt First Responders | - | via website | - |

---

## Appendix B: Conversation Themes Summary

### 1. Shared Services Model
- Centralized governance, accounting, philanthropy support
- Legal triage for organizations (not D2C)
- Single hub for funders to discover vetted orgs

### 2. Philanthropy Disruption
- Reverse grant model (funders find orgs, not vice versa)
- Replace letters of support with digital authentication
- Combat AI-generated grant spam

### 3. Long-term Presence
- 10+ year commitment examples (Shane Phillips, George's NT work)
- Anti-pattern: grant cycle boom/bust
- Value of consistent availability

### 4. Governance Innovation
- Oral/relational governance is stronger
- Digital capture of consultative decisions
- Video verification vs paper forms

### 5. Obsolescence Principle
- Help communities become self-sustaining
- Consultants, not permanent fixtures
- Build local capacity

---

*Document Location: `/docs/strategic/plans/JUSTICE_PROJECT_PARTNERSHIP_PDR.md`*
