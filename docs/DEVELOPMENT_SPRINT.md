# JusticeHub Development Sprint
## Public Beta Testing Preparation

**Sprint Start:** January 5, 2026
**Target Launch:** January 19, 2026 (2 weeks)
**Goal:** Prepare JusticeHub for public beta testing

---

## Sprint Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    JUSTICEHUB PUBLIC BETA SPRINT                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  WEEK 1: Core Experience                    WEEK 2: Polish & Launch     │
│  ─────────────────────────                  ────────────────────────    │
│  □ Fix critical bugs                        □ Performance optimization  │
│  □ Complete ALMA Chat                       □ SEO & metadata            │
│  □ Steward signup flow                      □ Analytics integration     │
│  □ Homepage stats live                      □ Error monitoring          │
│  □ Mobile responsiveness                    □ User testing              │
│  □ Authentication flows                     □ Documentation             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Current Status

### ✅ Completed (This Session)
- [x] ALMA Chat API with RAG search
- [x] ALMA Chat UI component (floating + modal)
- [x] Stewards section (/stewards, /stewards/impact)
- [x] Navigation & Footer integration
- [x] Homepage ALMA feature card
- [x] Brand alignment skill & documentation
- [x] Sitemap documentation (82 pages)
- [x] Multi-provider AI (Groq, Gemini, Anthropic)

### 🟡 In Progress
- [ ] Steward registration flow
- [ ] Live database stats on homepage
- [ ] Mobile testing

### ❌ Not Started
- [ ] Performance audit
- [ ] SEO optimization
- [ ] Analytics setup
- [ ] Error monitoring

---

## Week 1: Core Experience (Jan 5-12)

### Day 1-2: Critical Path Fixes

#### P0 - Blockers
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Homepage stats hardcoded (150 programs) | ❌ | - | Should pull from DB |
| Steward signup 404s | ❌ | - | /signup?role=steward needs handling |
| Some pages missing Navigation | ✅ | - | Fixed for Stewards |

#### P1 - Core Features
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| ALMA Chat complete | ✅ | - | API + UI done |
| Stewards page complete | ✅ | - | Landing + Impact dashboard |
| Intelligence Hub working | ✅ | - | 624 programs visible |
| Services search | 🟡 | - | Needs testing |

### Day 3-4: User Flows

#### Authentication
| Task | Status | Notes |
|------|--------|-------|
| Login flow | 🟡 | Supabase auth exists |
| Signup flow | 🟡 | Needs role-based handling |
| Profile creation | 🟡 | public_profiles table ready |
| Password reset | ❌ | Not tested |

#### Key User Journeys
1. **Youth finding help**
   - Homepage → Services → Find help ✅
   - Homepage → Ask ALMA → Get suggestions ✅

2. **Researcher exploring data**
   - Homepage → Intelligence → Browse programs ✅
   - Ask ALMA → Find programs → View details ✅

3. **Steward signing up**
   - Homepage → Stewards → Sign up ❌ (needs flow)
   - Stewards → Impact Dashboard ✅

### Day 5-7: Polish & Testing

#### Mobile Responsiveness
| Page | Status | Notes |
|------|--------|-------|
| Homepage | 🟡 | Needs testing |
| Navigation | 🟡 | Mobile menu exists |
| ALMA Chat | ✅ | Responsive design |
| Stewards | 🟡 | Needs testing |
| Intelligence | 🟡 | Needs testing |

#### Accessibility
| Requirement | Status | Notes |
|-------------|--------|-------|
| Skip links | 🟡 | Homepage has it |
| Keyboard nav | 🟡 | ALMA Chat tested |
| Screen reader | ❌ | Needs testing |
| Color contrast | ✅ | WCAG AAA target |

---

## Week 2: Polish & Launch (Jan 13-19)

### Day 8-9: Performance

#### Core Web Vitals Targets
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ? | ❌ |
| FID (First Input Delay) | < 100ms | ? | ❌ |
| CLS (Cumulative Layout Shift) | < 0.1 | ? | ❌ |

#### Optimization Tasks
| Task | Priority | Status |
|------|----------|--------|
| Image optimization | P1 | ❌ |
| Bundle size analysis | P1 | ❌ |
| Lazy loading | P2 | ❌ |
| API response caching | P2 | ❌ |

### Day 10-11: SEO & Metadata

#### Pages Needing Metadata
| Page | Title | Description | OG Image |
|------|-------|-------------|----------|
| Homepage | ✅ | 🟡 | ❌ |
| Stewards | ✅ | ✅ | ❌ |
| Intelligence | ✅ | ✅ | ❌ |
| Services | 🟡 | 🟡 | ❌ |

#### Technical SEO
| Task | Status |
|------|--------|
| robots.txt | ❌ |
| sitemap.xml | ❌ |
| Structured data | ❌ |
| Canonical URLs | ❌ |

### Day 12-13: Monitoring & Analytics

#### Analytics Setup
| Tool | Purpose | Status |
|------|---------|--------|
| Vercel Analytics | Performance | ❌ |
| PostHog / Plausible | User behavior | ❌ |
| Sentry | Error tracking | ❌ |
| Uptime monitoring | Availability | ❌ |

#### Key Metrics to Track
- Page views by section
- ALMA Chat usage
- Steward signups
- Service searches
- Time on site

### Day 14: Launch Prep

#### Pre-Launch Checklist
| Task | Status |
|------|--------|
| Test all user flows | ❌ |
| Mobile testing | ❌ |
| Browser testing | ❌ |
| Error handling | ❌ |
| 404 page | ❌ |
| Loading states | ❌ |
| Empty states | ❌ |
| Rate limiting | ❌ |

#### Launch Day
| Task | Status |
|------|--------|
| DNS/Domain ready | ? |
| SSL certificate | ? |
| Backup strategy | ❌ |
| Rollback plan | ❌ |
| Support channel | ❌ |

---

## Feature Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  ALMA Chat ✅     │  Steward Signup   │
    │  Stewards Page ✅ │  Live Stats       │
    │  Intelligence ✅  │  Mobile Polish    │
    │                   │                   │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT                  │                   EFFORT
    │                   │                   │
    │  SEO Meta         │  Performance Opt  │
    │  Analytics        │  Auth Flows       │
    │  Error Pages      │  Full Testing     │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                   LOW IMPACT
```

---

## Technical Debt

### Critical (Fix Before Launch)
| Issue | Impact | Effort |
|-------|--------|--------|
| Hardcoded stats on homepage | User trust | Low |
| Missing error boundaries | Crashes | Medium |
| No rate limiting on APIs | Security | Medium |

### Important (Fix Soon)
| Issue | Impact | Effort |
|-------|--------|--------|
| TypeScript errors in navigation | DX | Low |
| Inconsistent SimCity shadows | Brand | Low |
| Missing skip links on some pages | A11y | Low |

### Nice to Have
| Issue | Impact | Effort |
|-------|--------|--------|
| Bundle size optimization | Perf | High |
| Image CDN | Perf | Medium |
| Full test coverage | Quality | High |

---

## Database Status

### ALMA Tables
| Table | Records | Status |
|-------|---------|--------|
| alma_interventions | 624 | ✅ |
| alma_evidence | ~500 | ✅ |
| alma_outcomes | ~400 | ✅ |
| alma_community_contexts | ~200 | ✅ |
| alma_media_articles | ~40 | ✅ |

### Core Tables
| Table | Status | Notes |
|-------|--------|-------|
| public_profiles | ✅ | User profiles |
| organizations | ✅ | Org directory |
| services | ✅ | Service listings |
| stories | ✅ | Empathy Ledger |

---

## API Endpoints Status

### Public APIs
| Endpoint | Status | Auth |
|----------|--------|------|
| GET /api/chat | ✅ | None |
| POST /api/chat | ✅ | None |
| GET /api/services | ✅ | None |
| GET /api/services/search | ✅ | None |
| GET /api/alma/interventions | ✅ | None |
| GET /api/alma/portfolio | ✅ | None |

### Protected APIs
| Endpoint | Status | Auth |
|----------|--------|------|
| POST /api/services | 🟡 | Admin |
| POST /api/stories | 🟡 | User |
| /api/admin/* | 🟡 | Admin |

---

## Testing Checklist

### Browsers
| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ❌ | ❌ |
| Safari | ❌ | ❌ |
| Firefox | ❌ | ❌ |
| Edge | ❌ | ❌ |

### Devices
| Device | Status |
|--------|--------|
| iPhone 14/15 | ❌ |
| Android (Pixel) | ❌ |
| iPad | ❌ |
| Desktop 1920x1080 | ❌ |
| Desktop 1440x900 | ❌ |

### User Types
| User | Key Flows | Status |
|------|-----------|--------|
| Anonymous | Browse, Search, ALMA | ❌ |
| Youth | Services, Stories | ❌ |
| Steward | Signup, Dashboard | ❌ |
| Admin | All admin functions | ❌ |

---

## Daily Standup Template

```markdown
## Date: [DATE]

### Yesterday
-

### Today
-

### Blockers
-

### Notes
-
```

---

## Success Metrics for Beta

### Launch Criteria (Must Have)
- [ ] All P0 bugs fixed
- [ ] Core user journeys working
- [ ] Mobile responsive
- [ ] ALMA Chat functional
- [ ] Error monitoring active

### Beta Success Metrics (Week 1)
| Metric | Target |
|--------|--------|
| Daily active users | 50+ |
| ALMA Chat sessions | 100+ |
| Steward signups | 10+ |
| Page load time | < 3s |
| Error rate | < 1% |

---

## Contacts & Resources

### Key Links
- Production: https://justicehub.org (pending)
- Staging: [TBD]
- Supabase: [Dashboard URL]
- Vercel: [Dashboard URL]

### Documentation
- [SITEMAP.md](./SITEMAP.md) - All 82 pages
- [BRAND_ALIGNMENT_REVIEW.md](./BRAND_ALIGNMENT_REVIEW.md) - Design guidelines
- [ALMA_CHATBOT.md](./ALMA_CHATBOT.md) - Chat system docs
- [ALMA_ARCHITECTURE.md](./ALMA_ARCHITECTURE.md) - Data system

---

## Sprint Retrospective Template

```markdown
## Sprint: [DATES]

### What Went Well
-

### What Could Be Improved
-

### Action Items for Next Sprint
-

### Key Learnings
-
```

---

*Last Updated: January 5, 2026*
*Sprint Owner: Development Team*
