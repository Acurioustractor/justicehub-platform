#!/bin/bash

# JusticeHub Docker Startup Script
# This script starts the entire JusticeHub platform with Docker

echo "🚀 Starting JusticeHub Platform with Docker..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

# Check PostgreSQL
echo "  📊 PostgreSQL: $(docker-compose ps db --format "table {{.State}}")"

# Check Redis
echo "  🔄 Redis: $(docker-compose ps redis --format "table {{.State}}")"

# Check MCP Server
echo "  📡 MCP Server: $(docker-compose ps mcp-server --format "table {{.State}}")"

# Check Main App
echo "  🌐 Main App: $(docker-compose ps app --format "table {{.State}}")"

# Wait a bit more for the app to fully start
echo "⏳ Waiting for application to fully initialize..."
sleep 15

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec app npm run db:migrate

# Optional: Seed the database
echo "🌱 Seeding database with sample data..."
docker-compose exec app npm run db:seed || echo "⚠️  Seeding failed (this is OK if already seeded)"

echo ""
echo "✅ JusticeHub Platform is ready!"
echo "=================================="
echo ""
echo "🌐 Application URLs:"
echo "   Main App:     http://localhost:3002"
echo "   MCP Server:   http://localhost:3001"
echo "   PostgreSQL:   localhost:5434"
echo "   Redis:        localhost:6379"
echo ""
echo "🔐 Login Information:"
echo "   In development mode, authentication is bypassed"
echo "   You'll be automatically logged in as a demo user"
echo ""
echo "📊 Access the platform:"
echo "   - Main Dashboard: http://localhost:3002/dashboard"
echo "   - Analytics:      http://localhost:3002/analytics"
echo "   - Stories:        http://localhost:3002/stories"
echo "   - API Docs:       http://localhost:3002/developers"
echo ""
echo "🛠️  Useful Docker commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Rebuild:       docker-compose up --build"
echo ""
echo "🐛 Troubleshooting:"
echo "   - If ports are busy, check what's running on 3001, 3002, 5434, 6379"
echo "   - For fresh start: docker-compose down -v && $0"
echo "   - View container logs: docker-compose logs [service-name]"
echo ""

# Open browser (optional)
if command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    sleep 2
    open http://localhost:3002
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Opening browser..."
    sleep 2
    xdg-open http://localhost:3002
fi

echo "🎉 Setup complete! The platform is running and ready for testing."