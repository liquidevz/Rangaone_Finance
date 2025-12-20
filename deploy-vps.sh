#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci --production

echo "Building app..."
npm run build

echo "Starting with PM2..."
pm2 delete rangaone 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "Done! App running on port 3000"
