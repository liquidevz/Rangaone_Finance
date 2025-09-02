#!/bin/bash

# Switch between development and production containers

case "$1" in
  "dev")
    echo "🔄 Switching to development..."
    docker-compose down
    docker-compose up --build -d
    ;;
  "prod")
    echo "🔄 Switching to production..."
    docker-compose down
    docker-compose -f docker-compose.production.yml up --build -d
    ;;
  *)
    echo "Usage: $0 {dev|prod}"
    echo "  dev  - Switch to development container"
    echo "  prod - Switch to production container"
    exit 1
    ;;
esac

echo "✅ Container switched successfully"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"