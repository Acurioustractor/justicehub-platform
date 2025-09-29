# JusticeHub - Phase 1 Testing Checklist

## 🎯 Testing Overview
Test all newly created pages and critical user flows to ensure they work correctly.

**Dev Server:** http://localhost:3000

---

## ✅ Page Tests

### 1. Homepage (/)
- [ ] Page loads without errors
- [ ] Navigation bar displays correctly
- [ ] All hero section stats rotate
- [ ] CTA buttons link to correct pages
- [ ] Footer links work (test 3-4 random footer links)
- [ ] Mobile responsive menu works

### 2. Story Submission (/stories/new)
**Direct Link:** http://localhost:3000/stories/new

- [ ] Page loads with form visible
- [ ] All form fields render correctly
- [ ] Theme dropdown has all options
- [ ] Privacy controls (Public/Network/Anonymous) work
- [ ] Form validation works (try submitting empty)
- [ ] Success state displays after submission
- [ ] "Share Your Story" links from homepage work
- [ ] Query param `?type=program` changes header text

**Test Flow:**
1. Navigate from Homepage → Stories → Share Your Story
2. Fill out form with test data
3. Toggle between privacy options
4. Submit form
5. Verify success message appears

---

### 3. Youth Login (/youth-scout/youth-login)
**Direct Link:** http://localhost:3000/youth-scout/youth-login

- [ ] Page loads without errors
- [ ] Login/Signup toggle works
- [ ] Password visibility toggle works
- [ ] Form validation shows errors
- [ ] Age field validates 13-25 range
- [ ] "Remember me" checkbox works
- [ ] Terms & Privacy links work
- [ ] Links from Youth Scout landing page work

**Test Flows:**
1. **Login Flow:**
   - Navigate to Youth Scout → Get Started
   - Fill in email and password
   - Click "Log In"
   - Check console for mock redirect to dashboard

2. **Signup Flow:**
   - Click "Sign up here"
   - Fill in all required fields
   - Enter age under 13 → Should show error
   - Enter valid age (14-25)
   - Agree to terms
   - Submit → Check for redirect

---

### 4. Talent Scout Login (/youth-scout/talent-login)
**Direct Link:** http://localhost:3000/youth-scout/talent-login

- [ ] Page loads without errors
- [ ] Login/Signup toggle works
- [ ] Organization field works
- [ ] Role dropdown has all options
- [ ] Email validation works
- [ ] Ethical commitment checkbox required
- [ ] "What You Get" benefits section displays

**Test Flow:**
1. Navigate to Youth Scout → Join as Scout
2. Toggle to "Sign up"
3. Fill in organization and role
4. Complete form
5. Verify success redirect

---

### 5. Contact Page (/contact)
**Direct Link:** http://localhost:3000/contact

- [ ] Page loads without errors
- [ ] Quick contact cards display (Email, Phone, Address)
- [ ] Category dropdown has all options
- [ ] Form fields validate correctly
- [ ] Phone number is optional
- [ ] Email validation works
- [ ] Success state displays after submission
- [ ] "Send Another Message" button resets form

**Test Flow:**
1. Navigate from Footer → Contact Us
2. Select "Partnership Opportunity" category
3. Fill in all fields
4. Submit form
5. Verify success message
6. Click "Send Another Message" to test reset

---

### 6. How It Works (/how-it-works)
**Direct Link:** http://localhost:3000/how-it-works

- [ ] Page loads without errors
- [ ] All 4 platform cards display correctly
- [ ] Stats section shows proper numbers
- [ ] "What Makes Us Different" cards render
- [ ] 3-step getting started section works
- [ ] All CTA buttons link correctly
- [ ] Footer "How It Works" link works

**Visual Check:**
- Verify color coding (blue, green, purple, orange) for each platform
- Check icons display properly
- Ensure responsive layout works on mobile

---

### 7. Privacy Policy (/privacy)
**Direct Link:** http://localhost:3000/privacy

- [ ] Page loads without errors
- [ ] "Quick Summary" DO/DON'T boxes display
- [ ] All 10 sections render correctly
- [ ] Story visibility controls explanation is clear
- [ ] Contact information displays
- [ ] Links to Terms and Contact work
- [ ] Special protections for under-18 highlighted

**Navigation Test:**
- Footer → Privacy Policy
- Login pages → Privacy Policy link
- Terms page → Privacy Policy link

---

### 8. Terms of Service (/terms)
**Direct Link:** http://localhost:3000/terms

- [ ] Page loads without errors
- [ ] "The Basics" summary boxes display
- [ ] All 11 sections render correctly
- [ ] Age requirements highlighted for youth/scouts
- [ ] Prohibited content list is clear
- [ ] Special rules for talent scouts highlighted
- [ ] Contact information displays
- [ ] Links to Privacy and Contact work

**Navigation Test:**
- Footer → Terms of Service
- Login pages → Terms link
- Privacy page → Terms link

---

## 🔗 Critical User Flow Tests

### Flow 1: Youth Onboarding Journey
**Path:** Homepage → Youth Scout → Get Started → Login

1. [ ] Start at homepage
2. [ ] Click "YOUTH SCOUT" button in nav
3. [ ] Click "GET STARTED" on youth side
4. [ ] Login page loads correctly
5. [ ] Can toggle to signup
6. [ ] Form validation works
7. [ ] Success redirects (mock) to dashboard

**Expected:** Smooth flow with no 404s or broken links

---

### Flow 2: Story Sharing Journey
**Path:** Stories → Share Your Story → Submit

1. [ ] Navigate to /stories page
2. [ ] Click "Share Your Story" CTA
3. [ ] Form loads at /stories/new
4. [ ] Fill out complete story
5. [ ] Select privacy level
6. [ ] Agree to consent
7. [ ] Submit successfully
8. [ ] See confirmation screen

**Expected:** Complete flow with success message

---

### Flow 3: Organization Partnership Journey
**Path:** Homepage → About → Contact

1. [ ] Start at homepage
2. [ ] Click "About" button in nav
3. [ ] Find "Partner With Us" or similar CTA
4. [ ] Navigate to contact page
5. [ ] Select "Partnership Opportunity"
6. [ ] Fill out organization details
7. [ ] Submit form
8. [ ] Receive confirmation

**Expected:** Clear path for organizations to connect

---

### Flow 4: Footer Navigation Test
**Test all footer links in each category:**

**For Youth:**
- [ ] Youth Scout → /youth-scout ✅
- [ ] Find Services → /services ✅
- [ ] Share Your Story → /stories/new ✅
- [ ] Youth Login → /youth-scout/youth-login ✅

**For Organizations:**
- [ ] Talent Scout → /youth-scout/talent-login ✅
- [ ] Community Programs → /community-programs ✅
- [ ] Add Your Program → /community-programs/add ⚠️ (Phase 2)
- [ ] Success Stories → /stories ✅

**Platform:**
- [ ] Gallery → /gallery ✅
- [ ] Money Trail → /transparency ✅
- [ ] Art & Innovation → /art-innovation ✅
- [ ] Roadmap → /roadmap ✅

**About:**
- [ ] Our Mission → /about ✅
- [ ] How It Works → /how-it-works ✅
- [ ] Privacy Policy → /privacy ✅
- [ ] Terms of Service → /terms ✅

**Connect:**
- [ ] Contact Us → /contact ✅
- [ ] Partner With Us → /partners ⚠️ (Phase 2)
- [ ] Media Kit → /media ⚠️ (Phase 2)
- [ ] Support → /support ⚠️ (Phase 2)

---

## 🐛 Known Issues / Phase 2 Items

### Still Need (Coming Soon Pages):
- `/community-programs/add` - Add program form
- `/grassroots/apply` - Curation application
- `/dashboard/youth` - Youth dashboard
- `/dashboard/talent` - Talent scout dashboard
- `/support` - Help center
- `/partners` - Partnership opportunities
- `/media` - Media kit
- `/youth-scout/forgot-password` - Password reset
- `/youth-scout/onboarding` - New user onboarding
- `/youth-scout/youth-preview` - Youth tour
- `/youth-scout/talent-preview` - Talent scout tour
- `/youth-scout/dashboard` - Youth main dashboard
- `/youth-scout/talent-dashboard` - Talent scout dashboard

### Form Submissions (Need API):
- Story submissions (currently mock)
- Contact form (currently mock)
- Login/authentication (currently mock redirects)

---

## 📱 Responsive Testing Checklist

Test each page at these breakpoints:

- [ ] Mobile (375px) - iPhone SE
- [ ] Tablet (768px) - iPad
- [ ] Desktop (1440px) - Standard laptop

**Focus Areas:**
- Navigation collapses to hamburger on mobile
- Forms stack vertically on mobile
- Tables/grids reflow appropriately
- CTAs remain accessible
- Touch targets are large enough (44px minimum)

---

## 🎨 Visual/UX Checks

- [ ] All pages follow brutalist design system (bold borders, no shadows except specified)
- [ ] Color coding consistent (Blue = platform, Orange = urgency, Green = success)
- [ ] Typography hierarchy clear (headlines bold/black, body readable)
- [ ] Icons display correctly (Lucide icons)
- [ ] Loading states work (forms show spinner)
- [ ] Error states are clear (red borders, helpful messages)
- [ ] Success states are celebratory (green, checkmarks)

---

## ✅ Testing Sign-Off

**Tester:** _________________
**Date:** _________________
**Browser:** _________________
**Overall Status:** [ ] PASS  [ ] FAIL  [ ] NEEDS WORK

**Critical Issues Found:**
1.
2.
3.

**Recommendations:**
1.
2.
3.

---

## 🚀 Ready for Deployment When:

- [ ] All critical user flows work without errors
- [ ] No 404s on linked pages (except known Phase 2 items)
- [ ] Forms validate and show success states
- [ ] Mobile responsive works correctly
- [ ] No console errors on page loads
- [ ] Build passes (`npm run build`)
- [ ] All new pages added to sitemap

**Next Phase:** Create placeholder "Coming Soon" pages for remaining routes before production deployment.