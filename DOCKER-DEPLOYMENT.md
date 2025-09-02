# RangaOne Frontend - Docker Deployment Guide

This guide will help you containerize and deploy your Next.js application to work exactly like it does on Vercel hosting.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for cloning)
- Your `.env.production` file with all required environment variables

### One-Command Deployment

**For Linux/macOS:**
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

**For Windows:**
```cmd
docker-deploy.bat
```

## 📋 Manual Deployment Steps

### 1. Build the Docker Image
```bash
docker build -t rangaone-fe:latest .
```

### 2. Run with Docker Compose (Recommended)
```bash
# For development
docker-compose up -d

# For production
docker-compose -f docker-compose.production.yml up -d
```

### 3. Run with Docker Command
```bash
docker run -d \
  --name rangaone-fe-prod \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  rangaone-fe:latest
```

## 🔧 Configuration

### Environment Variables
Ensure your `.env.production` file contains all necessary variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://stocks-backend-cmjxc.ondigitalocean.app
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rangaone-7c317
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=391177208179
NEXT_PUBLIC_FIREBASE_APP_ID=1:391177208179:web:ab5e6c1cc22672e5550506
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Digio Configuration
DIGIO_CLIENT_ID=your_digio_client_id
DIGIO_CLIENT_SECRET=your_digio_client_secret
DIGIO_BASE_URL=https://ext.digio.in:444
DIGIO_ENVIRONMENT=sandbox
```

### Port Configuration
- Default port: `3000`
- To change port: Update the port mapping in docker-compose.yml or docker run command

## 🏥 Health Monitoring

The application includes a health check endpoint at `/api/health` that monitors:
- Application status
- Build information
- Uptime
- Environment details

### Manual Health Check
```bash
curl http://localhost:3000/api/health
```

## 📊 Container Management

### View Logs
```bash
docker logs rangaone-fe-prod
```

### Follow Logs in Real-time
```bash
docker logs -f rangaone-fe-prod
```

### Stop Container
```bash
docker stop rangaone-fe-prod
```

### Restart Container
```bash
docker restart rangaone-fe-prod
```

### Remove Container
```bash
docker stop rangaone-fe-prod
docker rm rangaone-fe-prod
```

## 🔄 Updates and Redeployment

### Update Application
1. Pull latest code changes
2. Rebuild the image:
   ```bash
   docker build -t rangaone-fe:latest .
   ```
3. Stop and remove old container:
   ```bash
   docker stop rangaone-fe-prod
   docker rm rangaone-fe-prod
   ```
4. Run new container with updated image

### Or use the deployment script:
```bash
./docker-deploy.sh  # Linux/macOS
docker-deploy.bat   # Windows
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 3000
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
   
   # Kill the process or use different port
   ```

2. **Environment variables not loading**
   - Ensure `.env.production` exists in project root
   - Check file permissions
   - Verify environment variable names match exactly

3. **Build failures**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t rangaone-fe:latest .
   ```

4. **Container won't start**
   ```bash
   # Check container logs
   docker logs rangaone-fe-prod
   
   # Run container interactively for debugging
   docker run -it --rm rangaone-fe:latest sh
   ```

### Performance Optimization

1. **Multi-stage build**: Already implemented for smaller image size
2. **Layer caching**: Dependencies are cached separately from source code
3. **Security**: Non-root user, read-only filesystem where possible
4. **Health checks**: Automatic container health monitoring

## 🔒 Security Features

- Non-root user execution
- Minimal Alpine Linux base image
- Security options in production compose file
- Read-only filesystem with necessary tmpfs mounts
- Dropped capabilities except essential ones

## 🌐 Production Deployment

For production deployment on cloud platforms:

1. **AWS ECS/Fargate**
2. **Google Cloud Run**
3. **Azure Container Instances**
4. **DigitalOcean App Platform**
5. **Railway**
6. **Render**

The containerized application will work identically across all these platforms, just like Vercel.

## 📈 Monitoring

Consider adding monitoring solutions:
- **Logs**: Centralized logging with ELK stack or similar
- **Metrics**: Prometheus + Grafana
- **APM**: New Relic, DataDog, or similar
- **Uptime**: Pingdom, UptimeRobot, or similar

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs
3. Verify environment configuration
4. Test health endpoint

The containerized application should behave identically to your Vercel deployment with proper configuration.