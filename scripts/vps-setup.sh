#!/bin/bash

# VPS Setup Script for RangaOne Frontend
set -e

echo "🚀 Setting up VPS for RangaOne Frontend deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/rangaone-fe
sudo chown $USER:$USER /opt/rangaone-fe
cd /opt/rangaone-fe

# Create nginx config
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream app {
        server rangaone-fe-prod:3000;
    }

    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    server {
        listen 80;
        server_name _;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        limit_req zone=general burst=100 nodelay;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /api/health {
            access_log off;
            proxy_pass http://app/api/health;
        }
    }
}
EOF

# Create docker-compose file
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  app:
    image: ${IMAGE_TAG:-ghcr.io/your-org/rangaone-fe:latest}
    container_name: rangaone-fe-prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - rangaone-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  nginx:
    image: nginx:alpine
    container_name: rangaone-nginx-prod
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - rangaone-network

networks:
  rangaone-network:
    driver: bridge
EOF

# Create environment file template
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Add your actual environment variables here
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
EOF

echo "✅ VPS setup complete!"
echo "📝 Next steps:"
echo "1. Edit /opt/rangaone-fe/.env.production with your actual values"
echo "2. Set up GitHub secrets for CI/CD"
echo "3. Push to main branch to trigger deployment"