#!/bin/bash

# Youth Justice Service Finder - Free Hosting Deployment Script
set -e

echo "🆓 Youth Justice Service Finder - Free Hosting Deployment"
echo "========================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy frontend to Vercel
deploy_frontend() {
    log_info "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy frontend
    cd frontend
    
    # Build first to check for errors
    log_info "Building frontend..."
    npm run build
    
    # Deploy to Vercel
    log_info "Deploying to Vercel..."
    vercel --prod --yes
    
    cd ..
    log_success "Frontend deployed to Vercel!"
}

# Deploy backend to Railway
deploy_backend() {
    log_info "Deploying backend to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_info "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login check
    if ! railway whoami &> /dev/null; then
        log_warning "Please login to Railway first:"
        railway login
    fi
    
    # Initialize Railway project if needed
    if [ ! -f "railway.toml" ]; then
        log_info "Initializing Railway project..."
        railway init
    fi
    
    # Deploy to Railway
    log_info "Deploying to Railway..."
    railway up
    
    log_success "Backend deployed to Railway!"
}

# Set up database
setup_database() {
    log_info "Setting up database..."
    
    # Railway will automatically create PostgreSQL
    # We just need to run migrations via Railway
    log_info "Running database migrations via Railway..."
    
    railway run npm run setup:db || log_warning "Database setup may need manual intervention"
    
    log_success "Database setup completed (or attempted)!"
}

# Update environment variables
update_env_vars() {
    log_info "Environment variables setup:"
    echo ""
    echo "📋 Required environment variables for Railway:"
    echo "=============================================="
    echo "NODE_ENV=production"
    echo "PORT=3001"
    echo "DATABASE_URL=(automatically provided by Railway)"
    echo "JWT_SECRET=your_32_character_secret_here"
    echo "API_RATE_LIMIT=50"
    echo ""
    echo "🔑 Optional API keys:"
    echo "FIRECRAWL_API_KEY=your_firecrawl_key"
    echo "MY_COMMUNITY_DIRECTORY_API_KEY=your_api_key"
    echo ""
    echo "🌐 For Vercel frontend:"
    echo "VITE_API_URL=https://your-railway-app.railway.app"
    echo ""
    log_warning "Please set these in Railway dashboard and Vercel dashboard"
}

# Show deployment info
show_deployment_info() {
    echo ""
    log_success "🎉 Free hosting deployment completed!"
    echo ""
    log_info "Deployment URLs:"
    echo "================"
    echo "🌐 Frontend: Check Vercel dashboard for URL"
    echo "🔌 Backend: Check Railway dashboard for URL"
    echo "📚 API Docs: https://your-railway-app.railway.app/docs"
    echo ""
    log_info "Next Steps:"
    echo "==========="
    echo "1. Set environment variables in Railway dashboard"
    echo "2. Set VITE_API_URL in Vercel dashboard"
    echo "3. Run database migrations if needed"
    echo "4. Test the deployment"
    echo ""
    log_info "Useful Commands:"
    echo "================"
    echo "railway logs      # View backend logs"
    echo "railway run bash  # Connect to Railway container"
    echo "vercel logs       # View frontend logs"
    echo "railway open      # Open Railway dashboard"
    echo "vercel open       # Open Vercel dashboard"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    echo "🧪 Manual testing required:"
    echo "1. Check Railway dashboard for backend URL"
    echo "2. Test API health: curl https://your-app.railway.app/health"
    echo "3. Check Vercel dashboard for frontend URL"
    echo "4. Test frontend loads and can connect to API"
    
    log_warning "Automated testing not available in free deployment"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "frontend")
            check_prerequisites
            deploy_frontend
            ;;
        "backend")
            check_prerequisites
            deploy_backend
            setup_database
            ;;
        "deploy")
            check_prerequisites
            deploy_backend
            setup_database
            deploy_frontend
            update_env_vars
            show_deployment_info
            ;;
        "info")
            update_env_vars
            show_deployment_info
            ;;
        "test")
            test_deployment
            ;;
        *)
            echo "Usage: $0 {deploy|frontend|backend|info|test}"
            echo ""
            echo "Commands:"
            echo "  deploy    - Deploy both frontend and backend (default)"
            echo "  frontend  - Deploy frontend to Vercel only"
            echo "  backend   - Deploy backend to Railway only"
            echo "  info      - Show deployment information"
            echo "  test      - Show testing instructions"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"