# JusticeHub Development Plan - Phase 2

## Current State Summary

### Completed (Phase 1)
- **97 pages** built across the platform
- **1,003 interventions** in database
- **GHL CRM integration** working (contacts, tags)
- **Real data** flowing on all major pages
- **Network map** with 9 JusticeHub nodes (all states + NZ)
- **Youth Justice Report** with 6 sections + ALMA Chat
- **CONTAINED** event pages ready
- **Centre of Excellence** with 10 key people profiles

### Page Categories Audit

| Category | Count | Status | Notes |
|----------|-------|--------|-------|
| Public Pages | 35 | Live data | Services, Events, Network, Stories |
| Admin Pages | 15 | Functional | Blog, Stories, Profiles management |
| Intelligence | 8 | Live data | 1000+ interventions, evidence |
| Youth Justice Report | 7 | Live data | Research, inquiries, international |
| Centre of Excellence | 6 | Live data | Key people, research, best practice |
| CONTAINED | 4 | Ready | Launch, register, about |
| Auth/Utility | 10 | Functional | Login, signup, test pages |
| Visuals | 5 | Various | Experimental data viz |
| Other | 7 | Various | Wiki, roadmap, flywheel |

---

## Phase 2: User Review & Polish Sprint

### Priority 1: Critical User Journeys (Review These First)

#### Journey 1: New Visitor Discovery
**Pages to review:**
1. `/` - Homepage (hero stats, featured stories)
2. `/about` - Platform explanation
3. `/services` - Service directory (search, filters)
4. `/services/[id]` - Service detail
5. `/contact` - Contact form

**Review checklist:**
- [ ] Mobile responsive
- [ ] Links working
- [ ] Real data displaying
- [ ] Empty states handled
- [ ] Page load speed acceptable

#### Journey 2: Event Registration
**Pages to review:**
1. `/events` - Events listing
2. `/events/[id]` - Event detail
3. `/contained/launch` - CONTAINED event
4. `/contained/register` - Event registration form

**Review checklist:**
- [ ] Events showing correct dates
- [ ] Registration form submits to GHL
- [ ] Confirmation messaging
- [ ] Calendar integration working

#### Journey 3: Steward Signup
**Pages to review:**
1. `/stewards` - Steward info page
2. `/signup` - Registration form
3. `/login` - Login page

**Review checklist:**
- [ ] Signup flow completes
- [ ] GHL contact created with tags
- [ ] Profile created in database
- [ ] Email confirmation sent

#### Journey 4: Intelligence Research
**Pages to review:**
1. `/intelligence` - Main hub
2. `/intelligence/interventions` - Browse 1000+ programs
3. `/intelligence/interventions/[id]` - Detail view
4. `/intelligence/evidence` - Evidence base
5. `/youth-justice-report` - Full report
6. `/youth-justice-report/chat` - ALMA Chat

**Review checklist:**
- [ ] Filters working
- [ ] Pagination working
- [ ] Search returning results
- [ ] ALMA Chat responding

#### Journey 5: Network Exploration
**Pages to review:**
1. `/network` - Australia map with nodes
2. `/organizations` - Organizations directory
3. `/organizations/[slug]` - Organization detail
4. `/people` - People directory
5. `/people/[slug]` - Person profile

**Review checklist:**
- [ ] Map loading and interactive
- [ ] Node popups working
- [ ] Organization data accurate
- [ ] Profile photos loading

---

### Priority 2: Content Polish

#### Update Required
| Page | Issue | Action |
|------|-------|--------|
| `/about` | Needs latest ALMA info | Update copy |
| `/stewards` | Pricing/tiers unclear | Clarify membership |
| `/contained` | Missing art previews | Add images |
| `/contact` | Form destination unclear | Verify GHL webhook |

#### Content Gaps
- [ ] Add more featured stories to homepage
- [ ] Update testimonials with real quotes
- [ ] Add team bios to about page
- [ ] Create FAQ content

---

### Priority 3: Technical Improvements

#### Performance
- [ ] Image optimization (Next.js Image for all)
- [ ] Lazy load map components
- [ ] API response caching
- [ ] Static generation where possible

#### SEO
- [ ] Add meta descriptions to all pages
- [ ] Open Graph images for social sharing
- [ ] Structured data for services
- [ ] XML sitemap

#### Accessibility
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Color contrast check
- [ ] Alt text for images

---

### Priority 4: Future Features

#### Coming Soon
| Feature | Priority | Complexity |
|---------|----------|------------|
| User dashboard | High | Medium |
| Saved searches | Medium | Low |
| Service reviews | Medium | Medium |
| Event calendar export | Low | Low |
| Newsletter preferences | Low | Low |

#### Nice to Have
- Push notifications for events
- Interactive data visualizations
- Community forums
- Resource downloads

---

## User Review Process

### How to Review

1. **Visit each journey** listed above
2. **Use the checklist** to verify functionality
3. **Note issues** with page URL and description
4. **Rate priority**: Critical / High / Medium / Low

### Feedback Format
```
Page: /services
Issue: Filter by location not working on mobile
Priority: High
Browser: Safari iOS
```

### Review Schedule
| Day | Focus Area |
|-----|------------|
| 1 | Journey 1-2 (Discovery + Events) |
| 2 | Journey 3-4 (Signup + Intelligence) |
| 3 | Journey 5 + Admin pages |
| 4 | Mobile testing all journeys |
| 5 | Fix critical issues |

---

## Success Metrics

### Launch Ready When:
- [ ] All 5 user journeys complete without errors
- [ ] Mobile experience matches desktop
- [ ] GHL receiving all form submissions
- [ ] Page load < 3 seconds
- [ ] No console errors on public pages
- [ ] All links working (no 404s)

---

## Quick Links for Review

### Public Pages
- https://justicehub.org.au/
- https://justicehub.org.au/services
- https://justicehub.org.au/events
- https://justicehub.org.au/stewards
- https://justicehub.org.au/network
- https://justicehub.org.au/intelligence
- https://justicehub.org.au/youth-justice-report
- https://justicehub.org.au/contained

### Admin Pages (Authenticated)
- https://justicehub.org.au/admin
- https://justicehub.org.au/admin/stories
- https://justicehub.org.au/admin/blog
