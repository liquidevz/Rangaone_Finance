# Docker Deployment Guide

## Complete Docker Setup for RangaOne Frontend

Your application is now fully dockerized with the `standalone` output configuration. Here's how to deploy it properly:

## Files Created/Updated

1. **Dockerfile.optimized** - Production-ready multi-stage Docker build
2. **docker-compose.production.yml** - Production deployment configuration
3. **deploy.sh** - Automated deployment script
4. **.dockerignore** - Optimized build context
5. **next.config.mjs** - Updated with production optimizations
6. **.env.production.example** - Environment variables template

## Quick Deployment

### 1. Setup Environment Variables
```bash
cp .env.production.example .env.production
# Edit .env.production with your actual values
```

### 2. Deploy with Script (Linux/Mac)
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Deploy Manually (Windows/Any OS)
```bash
# Set environment variables
set DEPLOYMENT_TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BUILD_TIME=%date%T%time%

# Stop existing containers
docker-compose -f docker-compose.production.yml down --remove-orphans

# Build and start
docker-compose -f docker-compose.production.yml up --build -d

# Check health
docker-compose -f docker-compose.production.yml ps
```

## Key Features

### ✅ Standalone Output
- Uses Next.js `standalone` output for minimal container size
- Self-contained with traced dependencies
- Optimized for containerized deployments

### ✅ Multi-Stage Build
- Separate build and runtime stages
- Minimal production image size
- Security-focused (non-root user)

### ✅ Health Checks
- Built-in health endpoint at `/api/health`
- Container health monitoring
- Automatic restart on failure

### ✅ Production Optimizations
- Nginx reverse proxy with caching
- Gzip compression
- Security headers
- Rate limiting
- Static asset optimization

### ✅ Environment Management
- Proper environment variable handling
- Production-specific configurations
- Secrets management ready

## Troubleshooting API Issues

If APIs don't work after deployment, check:

### 1. Environment Variables
```bash
# Check if environment variables are loaded
docker exec rangaone-fe-prod env | grep -E "(API|NEXT_PUBLIC)"
```

### 2. Network Connectivity
```bash
# Test internal networking
docker exec rangaone-fe-prod curl -f http://localhost:3000/api/health

# Test external access
curl -f http://your-server-ip/api/health
```

### 3. Container Logs
```bash
# Check application logs
docker-compose -f docker-compose.production.yml logs app

# Check nginx logs
docker-compose -f docker-compose.production.yml logs nginx
```

### 4. Common Issues & Solutions

**Issue: APIs return 404**
- Ensure API routes are in `app/api/` directory
- Check Next.js routing configuration
- Verify standalone build includes API routes

**Issue: Environment variables not loaded**
- Ensure `.env.production` exists and is properly formatted
- Check docker-compose.yml env_file configuration
- Verify NEXT_PUBLIC_ prefix for client-side variables

**Issue: CORS errors**
- Configure CORS_ORIGIN in environment variables
- Check nginx proxy headers
- Verify API endpoint URLs

**Issue: Container fails to start**
- Check Docker logs: `docker logs rangaone-fe-prod`
- Verify port 3000 is not in use
- Ensure sufficient system resources

## Production Checklist

- [ ] `.env.production` configured with real values
- [ ] Database connections tested
- [ ] API endpoints accessible
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Domain DNS pointing to server
- [ ] Firewall rules configured (ports 80, 443)
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Log rotation configured

## Monitoring

### Health Check Endpoint
```bash
curl http://your-domain/api/health
```

### Container Status
```bash
docker-compose -f docker-compose.production.yml ps
```

### Resource Usage
```bash
docker stats rangaone-fe-prod
```

## Scaling

To scale the application:

```bash
# Scale to 3 instances
docker-compose -f docker-compose.production.yml up --scale app=3 -d

# Update nginx upstream configuration accordingly
```

## Security Notes

- Application runs as non-root user (nextjs:nodejs)
- Security headers configured in nginx
- Rate limiting enabled
- CORS properly configured
- Environment variables properly isolated

Your application is now production-ready with proper Docker containerization!