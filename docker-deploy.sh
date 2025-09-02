#!/bin/bash

# RangaOne Frontend Docker Deployment Script
# This script builds and deploys the containerized Next.js application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="rangaone-fe"
CONTAINER_NAME="rangaone-fe-prod"
PORT="3000"

echo -e "${BLUE}🚀 Starting RangaOne Frontend Deployment${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found. Please create it with your production environment variables.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking environment...${NC}"

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
    docker stop ${CONTAINER_NAME} || true
    docker rm ${CONTAINER_NAME} || true
fi

# Remove existing image if it exists
if docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:latest$"; then
    echo -e "${YELLOW}🗑️ Removing existing image...${NC}"
    docker rmi ${IMAGE_NAME}:latest || true
fi

# Build the Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:latest .

# Run the container
echo -e "${BLUE}🚀 Starting container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    --restart unless-stopped \
    -p ${PORT}:3000 \
    --env-file .env.production \
    -e NODE_ENV=production \
    -e NEXT_TELEMETRY_DISABLED=1 \
    ${IMAGE_NAME}:latest

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 10

# Health check
echo -e "${BLUE}🏥 Performing health check...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:${PORT}/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy and running!${NC}"
        echo -e "${GREEN}🌐 Access your application at: http://localhost:${PORT}${NC}"
        
        # Show container logs (last 20 lines)
        echo -e "${BLUE}📋 Recent logs:${NC}"
        docker logs --tail 20 ${CONTAINER_NAME}
        
        # Show container status
        echo -e "${BLUE}📊 Container status:${NC}"
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        exit 0
    fi
    echo -e "${YELLOW}⏳ Waiting for health check... (${i}/30)${NC}"
    sleep 2
done

echo -e "${RED}❌ Health check failed. Application may not be running correctly.${NC}"
echo -e "${YELLOW}📋 Container logs:${NC}"
docker logs ${CONTAINER_NAME}
exit 1