#!/bin/bash

echo "=== Deployment Debug Script ==="
echo "Checking what might be missing on VPS deployment..."

echo -e "\n1. Checking Docker container status:"
docker ps | grep rangaone

echo -e "\n2. Checking container logs:"
docker logs $(docker ps -q --filter "name=app") --tail 50

echo -e "\n3. Checking static files in container:"
docker exec $(docker ps -q --filter "name=app") ls -la /app/public/ || echo "Cannot access public directory"

echo -e "\n4. Checking environment variables:"
docker exec $(docker ps -q --filter "name=app") env | grep NEXT_PUBLIC || echo "No NEXT_PUBLIC vars found"

echo -e "\n5. Checking service worker accessibility:"
curl -I http://localhost:3000/firebase-messaging-sw.js || echo "Service worker not accessible"

echo -e "\n6. Checking API endpoints:"
curl -s http://localhost:3000/api/health | jq . || echo "Health endpoint failed"

echo -e "\n7. Checking build output:"
docker exec $(docker ps -q --filter "name=app") ls -la /app/.next/static/ || echo "Static files missing"

echo -e "\n8. Checking for missing assets:"
curl -I http://localhost:3000/logo.png || echo "Logo not accessible"
curl -I http://localhost:3000/favicon.ico || echo "Favicon not accessible"

echo -e "\n=== Debug Complete ==="