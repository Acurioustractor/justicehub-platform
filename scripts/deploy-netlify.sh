#!/bin/bash

# Alternative deployment to Netlify (backup option)
# This provides a reliable alternative to Vercel

echo "🚀 Deploying Youth Justice Service Finder to Netlify"

# Navigate to frontend directory
cd frontend

# Install Netlify CLI if not present
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build optimized production bundle
echo "📦 Building optimized frontend..."
VITE_API_URL="https://youth-justice-service-finder-production.up.railway.app" npm run build

# Create netlify.toml configuration
cat > netlify.toml << EOF
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_URL = "https://youth-justice-service-finder-production.up.railway.app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
EOF

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "✅ Deployment complete!"
echo "🔗 Your app will be available at the Netlify URL provided above"
echo "📊 Monitor at: https://app.netlify.com/sites"

# Test the deployment
echo "🧪 Testing deployment in 10 seconds..."
sleep 10

echo "🎯 Next steps:"
echo "1. Verify the frontend loads correctly"
echo "2. Test API connectivity"
echo "3. Check performance metrics"
echo "4. Set up custom domain if needed"