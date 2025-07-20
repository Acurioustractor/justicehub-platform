#!/bin/bash

# Deploy to Vercel with public access (no authentication)
# This script fixes the Vercel authentication issue

echo "🚀 Deploying Youth Justice Service Finder to Vercel (Public)"

# Navigate to frontend directory
cd frontend

# Build optimized production bundle
echo "📦 Building optimized frontend..."
npm run build

# Deploy to Vercel with public flag
echo "🌐 Deploying to Vercel..."
vercel deploy --prod --public --confirm

echo "✅ Deployment complete!"
echo "🔗 Your app will be available at the Vercel URL provided above"
echo "📊 Monitor performance at: https://vercel.com/dashboard"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 10

# Get the latest deployment URL
DEPLOYMENT_URL=$(vercel ls --limit 1 | head -2 | tail -1 | awk '{print $2}')

if [[ $DEPLOYMENT_URL =~ ^https:// ]]; then
    echo "Testing deployment at: $DEPLOYMENT_URL"
    
    # Test the deployment
    if curl -s "$DEPLOYMENT_URL" | grep -q "Youth Justice"; then
        echo "✅ Deployment test passed!"
        echo "🎉 Frontend is live and working!"
    else
        echo "⚠️ Deployment test failed - please check manually"
    fi
else
    echo "⚠️ Could not determine deployment URL - please check Vercel dashboard"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Verify the frontend loads correctly"
echo "2. Test API connectivity"
echo "3. Check error monitoring"
echo "4. Update DNS if using custom domain"