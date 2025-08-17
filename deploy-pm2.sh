#!/bin/bash

# PM2 Deployment Script
set -e

echo "🚀 Deploying with PM2..."

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build

# Start/restart with PM2
pm2 restart rangaone-fe || pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed!"