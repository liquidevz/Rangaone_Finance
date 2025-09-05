#!/bin/bash

# Production deployment script for RangaOne Frontend
set -e

echo "🚀 Starting RangaOne Frontend deployment..."

# Set deployment timestamp
export DEPLOYMENT_TIMESTAMP=$(date +%s)
export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    exit 1
fi

print_status "Environment file found ✓"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Remove old images (optional - uncomment if you want to force rebuild)
# print_status "Removing old images..."
# docker image prune -f

# Build and start new containers
print_status "Building and starting new containers..."
docker-compose -f docker-compose.production.yml up --build -d

# Wait for health check
print_status "Waiting for application to be healthy..."
timeout=300  # 5 minutes
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.production.yml ps | grep -q "healthy"; then
        print_status "Application is healthy! ✓"
        break
    fi
    
    if [ $((counter % 30)) -eq 0 ]; then
        print_status "Still waiting for health check... ($counter/$timeout seconds)"
    fi
    
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    print_error "Health check timeout! Application may not be working properly."
    print_status "Container logs:"
    docker-compose -f docker-compose.production.yml logs --tail=50
    exit 1
fi

# Show final status
print_status "Deployment completed successfully! 🎉"
print_status "Application is running at: http://localhost"
print_status "Health check: http://localhost/api/health"

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.production.yml ps

# Show logs (last 20 lines)
print_status "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

print_status "Deployment finished at $(date)"