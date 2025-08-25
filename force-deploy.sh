#!/bin/bash

# Force Fresh Deployment Script
# This script ensures the latest code is deployed by clearing all caches

set -e

echo "🚀 Starting FORCE deployment with cache clearing..."

# Stop and remove all containers
echo "🛑 Stopping all containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans --volumes || true

# Remove all related Docker images
echo "🗑️ Removing old Docker images..."
docker images | grep rangaone-fe | awk '{print $3}' | xargs docker rmi -f || true

# Clear all caches
echo "🧹 Clearing all caches..."
rm -rf .next || true
rm -rf node_modules/.cache || true
rm -rf node_modules || true

# Clean Docker system
echo "🧽 Cleaning Docker system..."
docker system prune -af --volumes || true

# Fresh install and build
echo "📦 Fresh install..."
npm install --legacy-peer-deps

echo "🏗️ Building application..."
npm run build

# Start with fresh containers
echo "🚀 Starting fresh containers..."
DEPLOYMENT_TIMESTAMP=$(date +%s) docker-compose -f docker-compose.prod.yml up -d --build --force-recreate

# Wait and health check
echo "⏳ Waiting for services to start..."
sleep 45

echo "🏥 Health check..."
max_attempts=15
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        echo "✅ SUCCESS! Latest code is now live!"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Health check failed. Container logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "✅ Your application is now serving the latest code!"