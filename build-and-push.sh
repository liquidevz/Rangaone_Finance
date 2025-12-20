#!/bin/bash
# Build locally and push to registry

IMAGE_NAME="rangaone-fe"
TAG="latest"
REGISTRY="your-dockerhub-username"  # Change this

echo "Building image locally..."
docker build -t $IMAGE_NAME:$TAG .

echo "Tagging for registry..."
docker tag $IMAGE_NAME:$TAG $REGISTRY/$IMAGE_NAME:$TAG

echo "Pushing to registry..."
docker push $REGISTRY/$IMAGE_NAME:$TAG

echo "Done! Update docker-compose.yml on VPS to use: $REGISTRY/$IMAGE_NAME:$TAG"
