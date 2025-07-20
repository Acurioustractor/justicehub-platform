# Vercel Deployment Instructions

## Step 1: Deploy to Vercel

Run this command:
```bash
vercel
```

You'll be asked several questions:

1. **Set up and deploy "~/qld-youth-justice-tracker"?** → Yes
2. **Which scope do you want to deploy to?** → Select your account
3. **Link to existing project?** → No (create new)
4. **What's your project's name?** → qld-youth-justice-tracker (or press enter)
5. **In which directory is your code located?** → ./ (press enter)
6. **Want to override the settings?** → No

After deployment completes, run:
```bash
vercel --prod
```

## Step 2: Add Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project "qld-youth-justice-tracker"
3. Go to "Settings" tab
4. Click "Environment Variables" in left menu
5. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ivvvkombgqvjyrrmwmbs.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnZrb21iZ3F2anlycm13bWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMzcwMTgsImV4cCI6MjA2NTYxMzAxOH0.QTXx4lsgtXu71Ad0p1JYSMFY1VWSbvcozCOuA_w18RI`
6. Click "Save"
7. Redeploy by running: `vercel --prod`

## Step 3: Your Live URLs

After deployment, you'll get URLs like:
- Preview: https://qld-youth-justice-tracker-abc123.vercel.app
- Production: https://qld-youth-justice-tracker.vercel.app

## Alternative: One-Command Deploy

If you want to skip the questions:
```bash
vercel --prod --yes
```