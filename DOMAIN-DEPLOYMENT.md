# Domain Deployment Guide

This guide explains how your CI/CD pipeline deploys the RangaOne frontend directly to your domain folder without extra routes.

## Deployment Architecture

### Current Setup
- **Domain Path**: `/home/{user}/htdocs/{domain}`
- **Application**: Serves directly from domain root
- **No Extra Routes**: Your app routes work exactly as designed
- **Docker**: Production-ready containerized deployment

### File Structure in Domain Folder
```
/home/{user}/htdocs/{domain}/
├── app/                    # Next.js app directory
├── components/             # React components
├── public/                 # Static assets
├── services/              # API services
├── .env.production        # Production environment
├── docker-compose.prod.yml # Production Docker config
├── nginx.conf             # Nginx configuration
├── Dockerfile             # Container build instructions
└── ... (all project files)
```

## Deployment Process

### Automatic Deployment (GitHub Actions)
1. **Trigger**: Push to `main` branch
2. **Build**: Tests and builds the application
3. **Deploy**: Deploys directly to domain folder
4. **Health Check**: Verifies deployment success

### Manual Deployment
```bash
# SSH to your server
ssh user@your-server

# Run the deployment script
cd /home/{user}/htdocs/{domain}
./deploy-to-domain.sh
```

## Key Features

### 1. Direct Domain Serving
- App serves from `https://yourdomain.com/`
- All your routes work as expected:
  - `/login` → `https://yourdomain.com/login`
  - `/dashboard` → `https://yourdomain.com/dashboard`
  - `/api/health` → `https://yourdomain.com/api/health`

### 2. Production Optimizations
- **Nginx**: Reverse proxy with caching
- **Docker**: Containerized for consistency
- **Health Checks**: Automatic monitoring
- **Security Headers**: Enhanced security
- **Gzip Compression**: Faster loading

### 3. Zero-Downtime Deployment
- Containers are rebuilt and replaced
- Old containers stopped only after new ones are healthy
- Automatic rollback on failure

## Configuration Files

### Docker Compose (`docker-compose.prod.yml`)
- **App Container**: Next.js application
- **Nginx Container**: Reverse proxy and static file serving
- **Networks**: Isolated container communication
- **Health Checks**: Automatic service monitoring

### Nginx Configuration (`nginx.conf`)
- **Root Serving**: All requests go to your app
- **Static Caching**: Optimized asset delivery
- **API Rate Limiting**: Protection against abuse
- **Security Headers**: Enhanced security

### Environment Configuration (`.env.production`)
- Production-specific environment variables
- API keys and secrets
- Database connections
- Feature flags

## Monitoring and Health Checks

### Health Check Endpoint
- **URL**: `https://yourdomain.com/api/health`
- **Response**: `{"status": "ok", "timestamp": "..."}`
- **Monitoring**: Automatic checks every 30 seconds

### Container Status
```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   ```bash
   # Check container logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Restart services
   docker-compose -f docker-compose.prod.yml restart
   ```

2. **App Not Accessible**
   ```bash
   # Check Nginx status
   docker-compose -f docker-compose.prod.yml logs nginx
   
   # Verify port binding
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Environment Issues**
   ```bash
   # Verify environment file
   cat .env.production
   
   # Check container environment
   docker-compose -f docker-compose.prod.yml exec rangaone-fe env
   ```

### Manual Recovery
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Clean rebuild
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate

# Clean Docker system
docker system prune -f
```

## Security Considerations

### Nginx Security Headers
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Controls referrer information

### Rate Limiting
- **API Routes**: 20 requests/second
- **General Routes**: 50 requests/second
- **Burst Handling**: Temporary spikes allowed

### Container Security
- Non-root user in containers
- Read-only file systems where possible
- Resource limits to prevent abuse

## Performance Optimizations

### Caching Strategy
- **Static Assets**: 1 year cache
- **API Responses**: No cache (dynamic)
- **Health Checks**: No logging

### Compression
- Gzip enabled for text-based files
- Optimal compression levels
- Varies header for proper caching

### Resource Limits
- **Memory**: 1GB limit, 512MB reserved
- **CPU**: Shared with burst capability
- **Network**: Isolated container network

## Backup and Recovery

### Automated Backups
- Container images stored in registry
- Environment files backed up
- Database backups (if applicable)

### Recovery Process
1. Stop failed containers
2. Pull latest working image
3. Restore environment configuration
4. Start services
5. Verify health checks

## Next Steps

1. **SSL Certificate**: Add HTTPS support
2. **CDN Integration**: Global content delivery
3. **Monitoring**: Advanced application monitoring
4. **Scaling**: Horizontal scaling options

Your application is now deployed directly to your domain folder and serves from the root without any extra paths or routes!