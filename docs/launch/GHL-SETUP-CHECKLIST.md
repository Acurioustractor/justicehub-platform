# GoHighLevel Launch Campaign Setup

## Quick Setup Checklist

- [ ] **Step 0:** Replace placeholder images in HTML template
- [ ] **Step 1:** Create email template in GHL
- [ ] **Step 2:** Create workflow with tag trigger
- [ ] **Step 3:** Test with single contact
- [ ] **Step 4:** Run tagging script for all contacts
- [ ] **Step 5:** Monitor delivery

---

## Step 0: Replace Placeholder Images

The email template uses placeholder images from Unsplash. Replace these with real JusticeHub/basecamp photos before sending.

### Images to Replace:

| Location | Current Placeholder | Recommended Replacement |
|----------|---------------------|------------------------|
| **Hero Image** | Community group photo | JusticeHub team photo, network event, or Australia map visual |
| **Oonchiumpa** | Mountain landscape | On-country activity, cultural gathering, Alice Springs |
| **BG Fit** | Gym/fitness | Youth boxing/training, group workout, Mount Isa |
| **Mounty Yarns** | Media production | Youth filming, storytelling session, Mount Druitt |
| **PICC** | Community group | Pacific community event, cultural celebration, Townsville |

### Image Requirements:

- **Hero:** 600x300px (landscape)
- **Basecamp images:** 250x150px (landscape)
- **Format:** JPG or PNG
- **Hosting:** Upload to a public URL (Cloudinary, S3, or `/public/images/email/`)

### How to Replace:

1. Open `docs/launch/launch-email-template.html`
2. Find each `<img src="https://images.unsplash.com/...">` tag
3. Replace the `src` URL with your hosted image URL
4. Update the `alt` text if needed

### Quick Option - Use Existing Article Images:

Some existing images could work:
- `public/images/articles/beyond-systems-a-day-with-jackqwann-in-the-heart-of-australia.jpg` (Alice Springs content)
- `public/images/articles/connecting-communities-a-network-for-justice-reinvestment.jpeg`

---

## Step 1: Create Email Template

### In GHL Dashboard:

1. Go to **Marketing** → **Emails** → **Templates**
2. Click **+ New Template**
3. Choose **Code Editor** (for HTML) or **Drag & Drop**
4. **Template Name:** `JusticeHub Launch 2026`

### If using HTML:

1. Click **Code Editor**
2. Paste contents from: `docs/launch/launch-email-template.html`
3. Save template

### If using Drag & Drop:

Copy text from `docs/launch/launch-email-draft.md` and build visually.

---

## Step 2: Create Workflow

### In GHL Dashboard:

1. Go to **Automation** → **Workflows**
2. Click **+ Create Workflow** → **Start from Scratch**
3. **Name:** `JusticeHub Launch Email 2026`

### Add Trigger:

1. Click **Add New Trigger**
2. Select **Contact Tag**
3. **Tag Name:** `JusticeHub Launch 2026`
4. **When:** Tag Added

### Add Actions:

**Action 1: Wait (Optional)**
- Type: Wait
- Duration: 1 minute
- (Gives time for contact data to sync)

**Action 2: Send Email**
- Type: Send Email
- Template: `JusticeHub Launch 2026`
- From Name: `JusticeHub`
- Subject: `JusticeHub is live: Join the network proving communities have the cure`

**Action 3: Add Tag**
- Type: Add Tag
- Tag: `launch-email-sent`
- (Prevents duplicate sends)

### Save & Publish:

1. Click **Save**
2. Toggle **Published** to ON

---

## Step 3: Test with Single Contact

### Add test tag manually:

1. Go to **Contacts**
2. Find your test contact (your email)
3. Click to open contact
4. Add tag: `JusticeHub Launch 2026`
5. Check your inbox for the email
6. Verify links work

---

## Step 4: Run Tagging Script

### Preview first:

```bash
cd /Users/benknight/Code/JusticeHub
node scripts/ghl-tag-launch-contacts.mjs --dry-run
```

### When ready:

```bash
node scripts/ghl-tag-launch-contacts.mjs
```

This will tag **354 contacts** with `JusticeHub Launch 2026`, triggering the workflow.

---

## Step 5: Monitor Delivery

### In GHL Dashboard:

1. Go to **Reporting** → **Email Stats**
2. Check:
   - Delivered
   - Opened
   - Clicked
   - Bounced

### Expected metrics (industry benchmarks):

| Metric | Good | Great |
|--------|------|-------|
| Open Rate | 20%+ | 30%+ |
| Click Rate | 2%+ | 5%+ |
| Bounce Rate | <5% | <2% |

---

## Files Reference

| File | Purpose |
|------|---------|
| `docs/launch/launch-email-template.html` | HTML email template |
| `docs/launch/launch-email-draft.md` | Copy and social snippets |
| `docs/launch/foundational-blog-post.md` | Origin story blog |
| `scripts/ghl-tag-launch-contacts.mjs` | Tagging script |
| `scripts/check-ghl-contacts.mjs` | Check GHL status |

---

## Workflow Diagram

```
Contact gets tag "JusticeHub Launch 2026"
           ↓
     Wait 1 minute
           ↓
   Send Launch Email
           ↓
  Add tag "launch-email-sent"
```

---

## Subject Line Options

**Primary:**
> JusticeHub is live: Join the network proving communities have the cure

**Alternatives:**
> Australia's youth justice system is broken. We built the alternative.

> 4 basecamps. 624 programs. One mission. JusticeHub launches today.

> The evidence is in: Community solutions work 5x better than detention.

---

## Troubleshooting

**Email not sending:**
- Check workflow is Published (toggle ON)
- Verify trigger tag matches exactly: `JusticeHub Launch 2026`
- Check contact has valid email

**Low open rates:**
- Try different subject line
- Check sender reputation in GHL settings
- Verify domain authentication (SPF, DKIM)

**Script errors:**
- Run `node scripts/check-ghl-contacts.mjs` to verify API connection
- Check GHL_API_KEY and GHL_LOCATION_ID in .env.local

---

*Last updated: January 2026*
