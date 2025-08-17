#!/bin/bash

# Domain Deployment Script
# This script ensures all project files are properly deployed to the domain folder

set -e

# Configuration
DOMAIN_PATH="${DOMAIN_PATH:-/home/$(whoami)/htdocs/$(basename $(pwd))}"
PROJECT_NAME="rangaone-fe"

echo "🚀 Starting deployment to domain folder: $DOMAIN_PATH"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Docker if not present
if ! command_exists docker; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command_exists docker-compose; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
cd "$DOMAIN_PATH" 2>/dev/null && docker-compose -f docker-compose.prod.yml down || true

# Create domain directory structure
echo "📁 Setting up domain directory structure..."
sudo mkdir -p "$DOMAIN_PATH"
cd "$DOMAIN_PATH"

# Clone/update repository
if [ -d ".git" ]; then
    echo "🔄 Updating existing repository..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "📥 Cloning repository..."
    git clone https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/ .
fi

# Setup environment files
echo "⚙️ Setting up environment configuration..."
if [ -f ".env.production.example" ] && [ ! -f ".env.production" ]; then
    cp .env.production.example .env.production
    echo "✅ Created .env.production from example"
fi

# Ensure all required files are present
echo "📋 Verifying project files..."
required_files=(
    "package.json"
    "next.config.mjs"
    "Dockerfile"
    "docker-compose.prod.yml"
    "nginx.conf"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
    echo "✅ Found: $file"
done

# Build and deploy
echo "🏗️ Building and deploying application..."
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🏥 Performing health check..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts - waiting for application..."
        sleep 10
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Health check failed after $max_attempts attempts"
    echo "📋 Container logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f || true

# Set proper permissions
echo "🔐 Setting proper permissions..."
sudo chown -R $(whoami):$(whoami) "$DOMAIN_PATH"
sudo chmod -R 755 "$DOMAIN_PATH"

# Display deployment summary
echo ""
echo "🎉 Deployment completed successfully!"
echo "📍 Domain path: $DOMAIN_PATH"
echo "🌐 Application URL: http://$(hostname)"
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Deployment Summary:"
echo "- All project files deployed to domain folder"
echo "- Application serving from domain root (no extra paths)"
echo "- Nginx configured for optimal performance"
echo "- Docker containers running in production mode"
echo "- Health checks passing"
echo ""
echo "✅ Your Next.js application is now live!"