#!/bin/bash

# JusticeHub Development Startup Script
# This script starts the platform in development mode without Docker

echo "🚀 Starting JusticeHub Platform in Development Mode..."
echo "======================================================="

# Check if Node.js is available
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm not found. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start PostgreSQL and Redis with Docker (just the databases)
echo "🗄️  Starting database services with Docker..."
docker-compose up -d db redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to start..."
sleep 5

# Check if databases are running
echo "🔍 Checking database connections..."
if docker-compose ps db | grep -q "Up"; then
    echo "  ✅ PostgreSQL is running on port 5434"
else
    echo "  ❌ PostgreSQL failed to start"
fi

if docker-compose ps redis | grep -q "Up"; then
    echo "  ✅ Redis is running on port 6379"
else
    echo "  ❌ Redis failed to start"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

# Start the development server
echo "🌐 Starting Next.js development server..."
echo ""
echo "✅ JusticeHub Platform is starting!"
echo "=================================="
echo ""
echo "🌐 Application will be available at:"
echo "   Main App: http://localhost:3003"
echo ""
echo "🔐 Login Information:"
echo "   In development mode, authentication is bypassed"
echo "   You'll be automatically logged in as a demo user"
echo ""
echo "📊 Key URLs:"
echo "   - Dashboard:  http://localhost:3003/dashboard"
echo "   - Analytics:  http://localhost:3003/analytics"
echo "   - Stories:    http://localhost:3003/stories"
echo "   - API Docs:   http://localhost:3003/developers"
echo ""
echo "🛠️  To stop services:"
echo "   - Press Ctrl+C to stop the dev server"
echo "   - Run: docker-compose down (to stop databases)"
echo ""

# Start the development server
npm run dev