#!/bin/bash
set -e

echo "Building Docker image..."
docker compose build --no-cache

echo "Stopping old container..."
docker compose down

echo "Starting new container..."
docker compose up -d

echo "Deployment complete!"
docker compose ps
