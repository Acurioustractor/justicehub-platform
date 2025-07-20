# Vercel Project Identification & Cleanup

## Your Two Projects:

### 1. ✅ **qld-youth-justice-tracker** (CORRECT ONE)
- **URL**: https://qld-youth-justice-tracker-benjamin-knights-projects.vercel.app
- **Project ID**: prj_xL8Wetplt0QeGapPzYDJ3mIegxEy
- **Status**: This is the one we're currently using
- **Last Updated**: 8 minutes ago

### 2. ❌ **qld-youth-justice-tracker-g8ig** (DUPLICATE)
- **URL**: https://qld-youth-justice-tracker-g8ig-benjamin-knights-projects.vercel.app
- **Status**: Appears to be a duplicate
- **Last Updated**: 9 minutes ago

## How to Clean Up:

### Option 1: Delete the Duplicate Project
1. Go to: https://vercel.com/dashboard
2. Find `qld-youth-justice-tracker-g8ig`
3. Click on it → Settings → Delete Project

### Option 2: Via CLI
```bash
# List all projects to confirm
vercel project ls

# Remove the duplicate (be careful!)
vercel project rm qld-youth-justice-tracker-g8ig
```

## Verify You're Using the Right Project:

### Check Current Environment Variables
Go to: https://vercel.com/benjamin-knights-projects/qld-youth-justice-tracker/settings/environment-variables

Make sure these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Current Deployment Status:

Your deployments are going to the **correct project** (`qld-youth-justice-tracker`).

### Latest Deployments:
- https://qld-youth-justice-tracker-e5gj4vc7k-benjamin-knights-projects.vercel.app
- https://qld-youth-justice-tracker-ay7e1ncdx-benjamin-knights-projects.vercel.app

## Next Steps:

1. **Keep using**: `qld-youth-justice-tracker`
2. **Delete**: `qld-youth-justice-tracker-g8ig` (the duplicate)
3. **Check deployment status** in the correct project

Your production URL will be:
**https://qld-youth-justice-tracker.vercel.app**