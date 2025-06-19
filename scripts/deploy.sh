#!/bin/bash

# IYUUP Deployment Script
# Usage: ./scripts/deploy.sh [frontend|backend|database|all]

set -e

echo "🚀 IYUUP Deployment Script"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Using environment variables."
    else
        print_success ".env file found"
        source .env
    fi
}

# Deploy database migrations
deploy_database() {
    print_status "Deploying database migrations..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set. Please configure your Neon database URL."
        exit 1
    fi
    
    # Run migrations
    npm run db:push
    
    print_success "Database migrations completed"
}

# Build and prepare frontend for Vercel
deploy_frontend() {
    print_status "Building frontend for Vercel..."
    
    # Check if required env vars are set
    if [ -z "$VITE_API_URL" ]; then
        print_warning "VITE_API_URL not set. Frontend may not connect to backend."
    fi
    
    # Build frontend
    vite build
    
    print_success "Frontend build completed"
    print_status "Ready for Vercel deployment"
    print_status "Configure these environment variables in Vercel:"
    echo "  - VITE_API_URL=https://your-backend.onrender.com"
    echo "  - VITE_HYPERSWITCH_PUBLISHABLE_KEY=your-key"
}

# Prepare backend for Render
deploy_backend() {
    print_status "Preparing backend for Render..."
    
    # Check required environment variables
    required_vars=(
        "DATABASE_URL"
        "SESSION_SECRET"
        "HYPERSWITCH_API_KEY"
        "RESEND_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_warning "$var not set in environment"
        fi
    done
    
    # Test TypeScript compilation
    npm run check
    
    print_success "Backend preparation completed"
    print_status "Ready for Render deployment"
    print_status "Configure these environment variables in Render:"
    echo "  - DATABASE_URL=your-neon-connection-string"
    echo "  - SESSION_SECRET=generate-random-string"
    echo "  - HYPERSWITCH_API_KEY=your-api-key"
    echo "  - HYPERSWITCH_PUBLISHABLE_KEY=your-publishable-key"
    echo "  - RESEND_API_KEY=your-resend-key"
    echo "  - NODE_ENV=production"
    echo "  - PORT=10000"
}

# Deploy all components
deploy_all() {
    print_status "Deploying all components..."
    
    deploy_database
    deploy_frontend
    deploy_backend
    
    print_success "All components prepared for deployment"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy frontend to Vercel with the provided env vars"
    echo "2. Deploy backend to Render with the provided env vars"
    echo "3. Update CORS settings in backend with your Vercel URL"
    echo "4. Test the complete application"
}

# Main execution
main() {
    check_env
    
    case "${1:-all}" in
        "frontend")
            deploy_frontend
            ;;
        "backend")
            deploy_backend
            ;;
        "database")
            deploy_database
            ;;
        "all")
            deploy_all
            ;;
        *)
            echo "Usage: $0 [frontend|backend|database|all]"
            echo ""
            echo "Options:"
            echo "  frontend  - Build and prepare frontend for Vercel"
            echo "  backend   - Prepare backend for Render"
            echo "  database  - Run database migrations"
            echo "  all       - Deploy all components (default)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"