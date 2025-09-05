# RangaOne Frontend - VPS Deployment Guide

## Prerequisites

- Ubuntu/CentOS VPS with root access
- Docker and Docker Compose installed
- Domain name pointed to your VPS IP
- SSL certificate (optional but recommended)

## Quick Deployment

### 1. Install Docker (Ubuntu)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone and Deploy
```bash
# Upload your project files to VPS
# Update .env with your actual values

# Make deploy script executable
chmod +x deploy.sh

# Deploy
./deploy.sh
```

## Manual Deployment Steps

### 1. Build and Run
```bash
# Build the Docker image
docker build -t rangaone-fe .

# Run the container
docker run -d -p 3000:3000 --name rangaone-fe rangaone-fe
```

### 2. Using Docker Compose
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Nginx Setup (Optional)

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Configure Nginx
```bash
# Copy the nginx.conf to sites-available
sudo cp nginx.conf /etc/nginx/sites-available/rangaone
sudo ln -s /etc/nginx/sites-available/rangaone /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Setup with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Environment Variables

Update `.env` with your actual values:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_key
# ... other Firebase config
```

## Monitoring

### Check Application Status
```bash
# Container status
docker-compose ps

# View logs
docker-compose logs -f rangaone-fe

# Resource usage
docker stats
```

### Health Check
```bash
# Test if app is running
curl http://localhost:3000

# Test through Nginx (if configured)
curl http://your-domain.com
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Docker permission denied**
   ```bash
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Build fails**
   ```bash
   # Clear Docker cache
   docker system prune -a
   ```

## Updates

To update the application:
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./deploy.sh
```

## Security Checklist

- [ ] Update `.env` with secure values
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificate
- [ ] Configure Nginx security headers
- [ ] Regular system updates
- [ ] Monitor logs for suspicious activity

## Support

For deployment issues, check:
1. Docker logs: `docker-compose logs`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. System resources: `htop` or `docker stats`