#!/bin/bash

# Deploy entire application to Railway (unified deployment)
# This provides a single-platform solution for both frontend and backend

echo "🚀 Deploying Full-Stack Youth Justice Service Finder to Railway"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already)
echo "🔐 Logging into Railway..."
railway login

# Create a new Railway project or use existing
echo "🏗️ Setting up Railway project..."

# Create railway.toml for full-stack deployment
cat > railway.toml << EOF
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start:fullstack"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
RAILWAY_PUBLIC_DOMAIN = "youth-justice-finder.railway.app"

[environments.production.volumes]
staticFiles = "/app/frontend/dist"
EOF

# Update package.json to include fullstack start command
if ! grep -q "start:fullstack" package.json; then
    echo "📝 Adding fullstack start command to package.json..."
    
    # Create a temporary file with the updated package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts['start:fullstack'] = 'npm run build:frontend && npm run start';
    pkg.scripts['build:frontend'] = 'cd frontend && npm install && npm run build && cd ..';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

# Create a simple static file server for the frontend
cat > src/static-server.js << 'EOF'
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupStaticServer(app) {
  // Serve static files from frontend build
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/health') || 
        req.path.startsWith('/services') ||
        req.path.startsWith('/working-search') ||
        req.path.startsWith('/stats') ||
        req.path.startsWith('/monitoring')) {
      return next();
    }
    
    // Serve index.html for frontend routes
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}
EOF

# Update the main server to include static serving
cat > src/api/server-fullstack.js << 'EOF'
import { createSimpleServer } from './server-simple.js';
import { setupStaticServer } from '../static-server.js';

async function startFullStackServer() {
  try {
    const server = await createSimpleServer();
    
    // Add static file serving for frontend
    setupStaticServer(server);
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    console.log(`🚀 Full-Stack Youth Justice Service Finder running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    console.log(`🌐 Frontend Application: http://${host}:${port}/`);
    console.log(`🔍 Search API: http://${host}:${port}/working-search`);
    
  } catch (err) {
    console.error('Error starting full-stack server:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startFullStackServer();
}

export { startFullStackServer };
EOF

# Update start:fullstack script
cat > scripts/start-fullstack.js << 'EOF'
import { startFullStackServer } from '../src/api/server-fullstack.js';

startFullStackServer();
EOF

# Update package.json start:fullstack script
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts['start:fullstack'] = 'node scripts/start-fullstack.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Deploy to Railway
echo "🌐 Deploying to Railway..."
railway deploy

echo "✅ Full-stack deployment complete!"
echo "🔗 Your app will be available at your Railway domain"
echo "📊 Monitor at: https://railway.app/dashboard"

echo ""
echo "🎯 Full-stack deployment includes:"
echo "- ✅ Backend API with all optimizations"
echo "- ✅ Frontend React app with code splitting"
echo "- ✅ PostgreSQL database with indexes"
echo "- ✅ Redis caching and monitoring"
echo "- ✅ Single domain for both frontend and API"

echo ""
echo "🔗 Access your application:"
echo "- Frontend: https://your-railway-domain.railway.app/"
echo "- API: https://your-railway-domain.railway.app/health"
echo "- Docs: https://your-railway-domain.railway.app/docs"
EOF