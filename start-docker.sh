#!/bin/bash

echo "🚀 Starting JusticeHub Platform with Docker..."
echo "=============================================="

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.dev.yml down

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Check if PostgreSQL is ready
echo "🔍 Waiting for PostgreSQL to be ready..."
until docker-compose -f docker-compose.dev.yml exec db pg_isready -U user -d justicehub; do
  echo "   PostgreSQL is unavailable - sleeping..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

echo ""
echo "✅ JusticeHub Platform is ready!"
echo "=================================="
echo ""
echo "🌐 Application URLs:"
echo "   Main App:     http://localhost:3003"
echo "   PostgreSQL:   localhost:5432"
echo "   Redis:        localhost:6379"
echo ""
echo "🔐 Authentication:"
echo "   Development mode - automatic login as demo user"
echo ""
echo "📊 Key Pages:"
echo "   - Dashboard:  http://localhost:3003/dashboard"
echo "   - Analytics:  http://localhost:3003/analytics"
echo "   - Stories:    http://localhost:3003/stories"
echo "   - API Docs:   http://localhost:3003/developers"
echo ""
echo "🛠️  Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop all:     docker-compose -f docker-compose.dev.yml down"
echo "   Restart app:  docker-compose -f docker-compose.dev.yml restart app"
echo ""

# Open browser
if command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    sleep 3
    open http://localhost:3003
fi

echo "🎉 Setup complete! Platform is running on http://localhost:3003"