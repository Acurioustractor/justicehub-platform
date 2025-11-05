# Empathy Ledger ↔ JusticeHub Integration - Quick Start

## What You Need to Do

### 1. Run SQL in Both Databases (5 minutes)

**JusticeHub Database:**
1. Go to https://supabase.com/dashboard/project/tednluwflfhxyucgwigh
2. Click "SQL Editor" → "New Query"
3. Copy/paste SQL from [EMPATHY_LEDGER_SETUP_GUIDE.md - Step 1](./EMPATHY_LEDGER_SETUP_GUIDE.md#step-1-add-columns-to-justicehub-database)
4. Click "Run"

**Empathy Ledger Database:**
1. Go to https://supabase.com/dashboard/project/yvnuayzslukamizrlhwb
2. Click "SQL Editor" → "New Query"
3. Copy/paste SQL from [EMPATHY_LEDGER_SETUP_GUIDE.md - Step 2](./EMPATHY_LEDGER_SETUP_GUIDE.md#step-2-add-columns-to-empathy-ledger-database)
4. Click "Run"

### 2. Flag Test Profiles (2 minutes)

In Empathy Ledger SQL Editor:

```sql
-- Find profiles
SELECT id, display_name, bio FROM profiles ORDER BY display_name LIMIT 20;

-- Flag them (replace with actual IDs)
UPDATE profiles
SET
  justicehub_enabled = true,
  justicehub_role = 'founder',
  justicehub_featured = true
WHERE id IN (
  'actual-id-1',
  'actual-id-2'
);
```

### 3. Test the Sync (1 minute)

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/sync-empathy-ledger-profiles.ts
```

Expected output:
```
✨ Created: Kristy Howden (founder)
✨ Created: Tanya Smith (leader)
🎉 Sync completed successfully!
```

### 4. Add Frontend UI to Empathy Ledger

Follow the guide in [EMPATHY_LEDGER_FRONTEND_GUIDE.md](./EMPATHY_LEDGER_FRONTEND_GUIDE.md)

**Minimum Implementation:**
- Add JusticeHub settings section to profile settings page
- Add checkbox: "Display my profile on JusticeHub"
- Add dropdown: Role selection (founder, leader, advocate, etc.)
- Add checkbox: "Feature me prominently"
- Show sync status with timestamp

**Copy/paste components from the guide and adapt to your framework.**

## How It Works

```
┌─────────────────────────────────────┐
│      EMPATHY LEDGER                 │
│                                     │
│  User enables:                      │
│  ✓ justicehub_enabled = true        │
│  ✓ justicehub_role = 'founder'      │
│  ✓ justicehub_featured = true       │
└──────────────┬──────────────────────┘
               │
               │ Auto-sync every 6 hours
               │ (or manual trigger)
               ↓
┌─────────────────────────────────────┐
│      JUSTICEHUB                     │
│                                     │
│  Profile created/updated:           │
│  • Full name, photo, bio            │
│  • Role tags                        │
│  • Featured status                  │
│  • Linked back to Empathy Ledger    │
└─────────────────────────────────────┘
```

## What Gets Synced

When `justicehub_enabled = true`:
- ✅ Profile name
- ✅ Profile photo
- ✅ Bio
- ✅ Role (founder, leader, advocate, etc.)
- ✅ Featured status
- ✅ Link to stories (future)
- ✅ Link to organization (future)
- ✅ Link to projects (future)

When `justicehub_enabled = false`:
- ❌ Nothing syncs
- ❌ Profile removed from JusticeHub (if previously synced)

## Files Reference

### Documentation
- **This File** - Quick start guide
- **[EMPATHY_LEDGER_SETUP_GUIDE.md](./EMPATHY_LEDGER_SETUP_GUIDE.md)** - Complete setup with SQL
- **[EMPATHY_LEDGER_FRONTEND_GUIDE.md](./EMPATHY_LEDGER_FRONTEND_GUIDE.md)** - UI components for Empathy Ledger
- **[EMPATHY_LEDGER_INTEGRATION.md](./EMPATHY_LEDGER_INTEGRATION.md)** - Full technical architecture
- **[PROFILE_FLAGGING_SYSTEM.md](./PROFILE_FLAGGING_SYSTEM.md)** - Two-way flagging system
- **[EMPATHY_LEDGER_INTEGRATION_STATUS.md](./EMPATHY_LEDGER_INTEGRATION_STATUS.md)** - Implementation checklist

### Code Files
- **Sync Script**: `src/scripts/sync-empathy-ledger-profiles.ts`
- **API Endpoint**: `src/app/api/admin/sync-empathy-ledger/route.ts`
- **Empathy Ledger Client**: `src/lib/supabase/empathy-ledger.ts`
- **Verification Script**: `src/scripts/verify-empathy-ledger-schema.ts`
- **Migration SQL**: `supabase/migrations/20250126000004_add_empathy_ledger_linking.sql`

## Role Options

When adding to Empathy Ledger frontend, use these role options:

- `founder` - Started/co-founded an organization
- `leader` - Leads programs or teams
- `advocate` - Advocates for youth justice reform
- `practitioner` - Works directly with young people
- `researcher` - Researches youth justice issues
- `lived-experience` - Personal experience with youth justice
- `community-member` - Supports youth justice work

## Privacy & Consent

**User Control:**
- Users explicitly opt-in via checkbox
- Users choose what role to display as
- Users can disable anytime
- Changes sync within 6 hours

**Cultural Safety:**
- Empathy Ledger cultural protocols respected
- Elder approval required where applicable
- Attribution always maintained
- Source always linked

**Data Ownership:**
- Empathy Ledger remains source of truth
- JusticeHub only displays consented data
- Users can request removal anytime
- All sync operations logged

## Next Steps After Initial Setup

1. ✅ Run SQL in both databases
2. ✅ Test sync with a few profiles
3. ⏳ Add frontend UI to Empathy Ledger
4. ⏳ Sync organizations
5. ⏳ Sync projects/programs
6. ⏳ Integrate stories with consent
7. ⏳ Set up automated cron job

## Troubleshooting

**"No profiles flagged for JusticeHub"**
- Check you ran Step 2 SQL in Empathy Ledger
- Verify `justicehub_enabled = true` in profiles table

**"Column does not exist"**
- Check you ran Step 1 SQL in JusticeHub
- Check you ran Step 2 SQL in Empathy Ledger
- Verify in correct database

**Sync script errors**
- Check `.env.local` has both database credentials
- Verify API keys are correct
- Check database permissions

## Support

Questions? Check:
1. [EMPATHY_LEDGER_SETUP_GUIDE.md](./EMPATHY_LEDGER_SETUP_GUIDE.md) - Detailed setup instructions
2. [EMPATHY_LEDGER_FRONTEND_GUIDE.md](./EMPATHY_LEDGER_FRONTEND_GUIDE.md) - Copy/paste UI components
3. [EMPATHY_LEDGER_INTEGRATION_STATUS.md](./EMPATHY_LEDGER_INTEGRATION_STATUS.md) - What's done/pending

---

**Ready to start?** → Run the SQL in both databases, then test the sync!
