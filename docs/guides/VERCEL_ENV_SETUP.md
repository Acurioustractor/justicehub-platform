# Vercel Environment Variables Setup

## Required Environment Variables

You need to set these **exact** environment variables in your Vercel project dashboard:

### 1. Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Find your `justicehub-platform` project
3. Click on the project
4. Go to **Settings** → **Environment Variables**

### 2. Add These Variables

Copy the values from your local `.env.local` file:

#### NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: (Your Supabase project URL - starts with `https://` and ends with `.supabase.co`)
- **Environment**: Production, Preview, Development (check all)

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: (Your Supabase anonymous/public key - long string starting with `eyJ`)
- **Environment**: Production, Preview, Development (check all)

#### YJSF_SUPABASE_SERVICE_KEY (CRITICAL FOR IMAGE UPLOAD!)
- **Name**: `YJSF_SUPABASE_SERVICE_KEY`
- **Value**: (Your Supabase service role key - long string starting with `eyJ`)
- **Environment**: Production, Preview, Development (check all)
- **⚠️ WARNING**: This is a secret key with admin privileges. Never commit to git!

### 3. Redeploy After Adding Variables

After adding all environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the "..." menu → **Redeploy**
4. Or just push a new commit to trigger automatic deployment

## How to Find Your Supabase Keys

If you don't have them handy:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** (gear icon) → **API**
4. You'll see:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `YJSF_SUPABASE_SERVICE_KEY` (click "Reveal" to see it)

## Verify Environment Variables Are Set

After deploying, you can verify the variables are working:

1. Open your production site
2. Open browser console (F12)
3. Type: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
4. You should see your Supabase URL (public variables only!)
5. Service key won't be visible (it's server-side only) ✅

## Common Issues

### Issue: Image upload returns 500 error
**Solution**: Check that `YJSF_SUPABASE_SERVICE_KEY` is set in Vercel and redeploy

### Issue: Authentication doesn't work
**Solution**: Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Issue: Changes to environment variables don't take effect
**Solution**: You must redeploy after changing environment variables

## Current Deployment Status

Check deployment status:
- Visit: https://vercel.com/dashboard
- Look for automatic deployment triggered by your latest git push
- Should show commit: `a971412` - "feat: add complete blog system with image upload"

## Testing After Deployment

Once deployed, follow the checklist in `VERCEL_TESTING_CHECKLIST.md` to verify everything works on production.
