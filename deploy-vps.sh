#!/bin/bash
# =============================================================================
# MANUAL DEPLOYMENT SCRIPT - Rangaone Finance
# =============================================================================
# Usage: ./deploy-vps.sh [docker|pm2]
# Default: docker
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="rangaone-fe"
DEPLOY_METHOD="${1:-docker}"

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# =============================================================================
# Cleanup function
# =============================================================================
cleanup() {
    log_info "Cleaning up existing processes..."
    
    # Kill processes on port 3000
    fuser -k 3000/tcp 2>/dev/null || true
    
    # Stop Docker containers
    docker stop rangaone_fe_app rangaone_fe_blue rangaone_fe_green rangaone_fe_prod 2>/dev/null || true
    docker rm -f rangaone_fe_app rangaone_fe_blue rangaone_fe_green rangaone_fe_prod 2>/dev/null || true
    
    # Stop PM2 processes
    pm2 delete ${APP_NAME} 2>/dev/null || true
    
    # Clean Docker resources
    docker system prune -f 2>/dev/null || true
    docker image prune -f 2>/dev/null || true
    
    sleep 2
    log_success "Cleanup complete"
}

# =============================================================================
# Health check function
# =============================================================================
health_check() {
    local max_retries=10
    local retry_interval=3
    
    log_info "Running health check..."
    
    for i in $(seq 1 $max_retries); do
        if curl -sf http://localhost:3000/api/health >/dev/null 2>&1 || \
           curl -sf http://localhost:3000/ >/dev/null 2>&1; then
            log_success "🟢 Application is healthy!"
            return 0
        fi
        echo "  Attempt $i/$max_retries..."
        sleep $retry_interval
    done
    
    log_error "🔴 Health check failed!"
    return 1
}

# =============================================================================
# Docker deployment
# =============================================================================
deploy_docker() {
    log_info "Starting Docker deployment..."
    
    cleanup
    
    log_info "Building Docker image..."
    docker-compose build --no-cache
    
    log_info "Starting container..."
    docker-compose up -d --force-recreate --remove-orphans
    
    sleep 5
    
    log_info "Container status:"
    docker ps | grep rangaone || true
    
    health_check
}

# =============================================================================
# PM2 deployment
# =============================================================================
deploy_pm2() {
    log_info "Starting PM2 deployment..."
    
    cleanup
    
    log_info "Installing dependencies..."
    if [ -f package-lock.json ]; then
        npm ci --force --legacy-peer-deps --no-audit --no-fund
    else
        npm install --force --legacy-peer-deps --no-audit --no-fund
    fi
    
    log_info "Building application..."
    BUILD_STANDALONE=true npm run build
    
    log_info "Starting with PM2..."
    cd .next/standalone
    pm2 start server.js --name ${APP_NAME} --no-autorestart
    pm2 save
    
    sleep 3
    
    log_info "PM2 status:"
    pm2 status
    
    health_check
}

# =============================================================================
# Main
# =============================================================================
echo ""
echo "=============================================="
echo "  Rangaone Finance - Deployment Script"
echo "=============================================="
echo ""

case "$DEPLOY_METHOD" in
    docker)
        deploy_docker
        ;;
    pm2)
        deploy_pm2
        ;;
    *)
        log_error "Unknown deploy method: $DEPLOY_METHOD"
        echo "Usage: $0 [docker|pm2]"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
log_success "Deployment complete!"
echo "=============================================="
echo ""