#!/bin/bash

# Deployment Verification Script
# Verifies that the application is properly deployed and accessible

set -e

echo "🔍 Verifying RangaOne Frontend Deployment"
echo "========================================"

# Configuration
DOMAIN_PATH="${DOMAIN_PATH:-/home/$(whoami)/htdocs/$(basename $(pwd))}"
APP_URL="${APP_URL:-http://localhost}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project directory. Please run from project root."
    exit 1
fi

echo "📍 Domain Path: $DOMAIN_PATH"
echo "🌐 App URL: $APP_URL"
echo ""

# 1. Check Docker containers
echo "🐳 Checking Docker containers..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Docker containers are running"
    docker-compose -f docker-compose.prod.yml ps
else
    echo "❌ Docker containers are not running"
    echo "💡 Try: docker-compose -f docker-compose.prod.yml up -d"
    exit 1
fi
echo ""

# 2. Check health endpoint
echo "🏥 Checking health endpoint..."
if curl -f -s "$APP_URL/api/health" > /dev/null; then
    health_response=$(curl -s "$APP_URL/api/health")
    echo "✅ Health check passed"
    echo "📊 Response: $health_response"
else
    echo "❌ Health check failed"
    echo "💡 Check container logs: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi
echo ""

# 3. Check main application
echo "🌐 Checking main application..."
if curl -f -s "$APP_URL" > /dev/null; then
    echo "✅ Main application is accessible"
else
    echo "❌ Main application is not accessible"
    echo "💡 Check Nginx configuration and container status"
    exit 1
fi
echo ""

# 4. Check file permissions
echo "🔐 Checking file permissions..."
if [ -r "package.json" ] && [ -r "docker-compose.prod.yml" ]; then
    echo "✅ File permissions are correct"
else
    echo "❌ File permission issues detected"
    echo "💡 Try: sudo chown -R $(whoami):$(whoami) $DOMAIN_PATH"
fi
echo ""

# 5. Check environment configuration
echo "⚙️ Checking environment configuration..."
if [ -f ".env.production" ]; then
    echo "✅ Production environment file exists"
    env_vars=$(grep -c "=" .env.production 2>/dev/null || echo "0")
    echo "📊 Environment variables: $env_vars"
else
    echo "⚠️ No .env.production file found"
    echo "💡 Copy from .env.production.example if needed"
fi
echo ""

# 6. Check disk space
echo "💾 Checking disk space..."
disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 90 ]; then
    echo "✅ Disk space is adequate ($disk_usage% used)"
else
    echo "⚠️ Disk space is running low ($disk_usage% used)"
    echo "💡 Consider cleaning up Docker images: docker system prune"
fi
echo ""

# 7. Check container resources
echo "📊 Checking container resources..."
echo "Memory usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(rangaone|nginx)" || echo "No containers found"
echo ""

# 8. Test key routes
echo "🛣️ Testing key application routes..."
routes=("/" "/api/health")

for route in "${routes[@]}"; do
    if curl -f -s "$APP_URL$route" > /dev/null; then
        echo "✅ $route - accessible"
    else
        echo "❌ $route - not accessible"
    fi
done
echo ""

# 9. Check logs for errors
echo "📋 Checking recent logs for errors..."
error_count=$(docker-compose -f docker-compose.prod.yml logs --tail=100 2>/dev/null | grep -i error | wc -l)
if [ "$error_count" -eq 0 ]; then
    echo "✅ No recent errors in logs"
else
    echo "⚠️ Found $error_count error(s) in recent logs"
    echo "💡 Check logs: docker-compose -f docker-compose.prod.yml logs"
fi
echo ""

# Summary
echo "📋 Deployment Verification Summary"
echo "================================="
echo "✅ All checks completed"
echo ""
echo "🎯 Quick Actions:"
echo "  • View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  • Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  • Rebuild: docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "🌐 Your application should be accessible at: $APP_URL"
echo "🏥 Health check: $APP_URL/api/health"
echo ""
echo "✅ Verification completed successfully!"