#!/bin/bash

# Manual deployment script for CloudPanel
echo "🚀 Starting deployment..."

# Install Node.js 20 if not present
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# Setup domain directory (replace with your actual path)
DOMAIN_PATH="/home/YOUR_USER/htdocs/YOUR_DOMAIN"
cd $DOMAIN_PATH

# Pull latest changes
git pull origin main

# Copy environment files
cp .env.production .env.local

# Install dependencies and build
npm install --legacy-peer-deps
npm run build

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# Copy static files to standalone
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true

# Stop existing process and start new one
pm2 delete rangaone-fe 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "🚀 Deployment completed at $(date)"

echo "✅ Next.js app deployed successfully on port 3000"