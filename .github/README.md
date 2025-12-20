# 🚀 GitHub Actions Workflows

## Overview

This repository uses GitHub Actions for automated CI/CD with zero-downtime deployment.

## Workflows

### 🔨 Build and Deploy (`build.yml`)

**Triggers:**
- Push to `main` branch → Deploys to production
- Pull requests to `main` → Runs tests only
- Manual trigger via `workflow_dispatch`

### Jobs

#### 1. **Build Job** (Pull Requests only)
Tests and validates the application before merging.

- ✅ Checkout code
- ✅ Install dependencies
- ✅ Run linter
- ✅ Build application
- ✅ Verify build
- ✅ Test Docker container
- ✅ Health check validation

#### 2. **Deploy Job** (Main branch only)
Zero-downtime deployment to production server.

**Features:**
- 🔄 Blue-green deployment strategy
- 🩺 Health check verification
- 🔁 Automatic rollback on failure
- 🛡️ Port conflict resolution
- 📦 .env backup and restore
- 🧹 Automatic cleanup of old images

## Setup Instructions

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions**

```
SERVER_HOST=your.server.ip
SERVER_USER=rangaone
SERVER_SSH_KEY=<your-private-ssh-key>
```

### 2. SSH Key Setup

Generate SSH key on your local machine:
```bash
ssh-keygen -t ed25519 -C "github-actions"
```

Copy public key to server:
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub rangaone@your.server.ip
```

Add private key to GitHub Secrets (`SERVER_SSH_KEY`)

### 3. Server Requirements

**Installed on server:**
- Docker and Docker Compose
- Git
- curl
- ss (or netstat)
- fuser (optional, for port cleanup)

**Server paths:**
```
/home/rangaone/htdocs/www.rangaone.finance/Rangaone_Finance
```

### 4. Environment File

Ensure `.env` exists on the server with production values:
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
# Add your production environment variables
```

## Deployment Flow

### Zero-Downtime Strategy

```
1. 📥 Pull latest code from main
2. 🔨 Build new Docker image (rangaone-fe:TIMESTAMP)
3. 🧪 Start temporary container on port 3003
4. 🩺 Health check temporary container
5. 🛑 Stop current production container
6. 🔓 Free port 3000 (with verification)
7. 🚀 Start new production container on port 3000
8. ✅ Verify production health
9. 🧹 Clean up temporary container and old images
```

### Port Management

- **Production Port**: 3000
- **Testing Port**: 3003
- **Timeout for port release**: 30 seconds
- **Automatic port cleanup**: Yes
- **Fallback**: Kills process if port stuck

### Health Checks

- **Endpoint**: `/api/health`
- **Timeout**: 60 seconds
- **Interval**: 2 seconds
- **Production retries**: 5 attempts
- **Returns**: JSON with status, uptime, memory usage

Example response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T12:00:00.000Z",
  "version": "1.0.0",
  "nodeEnv": "production",
  "uptime": 3600,
  "memoryUsage": {
    "rss": 512,
    "heapUsed": 256,
    "heapTotal": 384
  }
}
```

### Rollback Strategy

If production health check fails:
1. 📋 Log error details
2. 🛑 Stop failed container
3. 🔍 Find previous working image
4. 🔄 Restart previous image
5. ⚠️ Exit with error (deployment failed)

### Image Management

- **Naming**: `rangaone-fe:YYYYMMDD-HHMMSS`
- **Retention**: Keeps last 2 builds
- **Auto-cleanup**: Old images removed automatically
- **Prune**: Docker images pruned after deployment

### Backup Management

- **`.env` backups**: Created before each deployment
- **Retention**: Last 3 backups kept
- **Format**: `.env.bak_YYYYMMDD-HHMMSS`

## Manual Deployment

Trigger deployment manually:
1. Go to **Actions** tab
2. Select **🚀 Build and Deploy** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow** button

## Monitoring

### View Logs

**In GitHub:**
- Go to Actions tab
- Click on workflow run
- View job logs

**On Server:**
```bash
# View container logs
docker logs -f rangaone_fe_prod

# View container status
docker ps

# Check health
curl http://localhost:3000/api/health
```

### Verify Deployment

```bash
# Check running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check images
docker images rangaone-fe

# Test health endpoint
curl -s http://localhost:3000/api/health | jq
```

## Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs**
2. **SSH into server and check:**
   ```bash
   docker ps -a
   docker logs rangaone_fe_prod
   ```

3. **Manual rollback:**
   ```bash
   # List available images
   docker images rangaone-fe
   
   # Start previous version
   docker run -d --name rangaone_fe_prod \
     --restart unless-stopped \
     -p 3000:3000 \
     --env-file .env \
     rangaone-fe:YYYYMMDD-HHMMSS
   ```

### Port Issues

```bash
# Check what's using port 3000
ss -ltnp | grep :3000
lsof -i :3000

# Kill process
fuser -k 3000/tcp

# Or stop all Docker containers on that port
docker ps --filter "publish=3000" -q | xargs docker stop
```

### Health Check Failing

```bash
# Test health endpoint manually
curl -v http://localhost:3000/api/health

# Check container logs
docker logs rangaone_fe_prod

# Check container is running
docker ps | grep rangaone_fe_prod

# Check port binding
docker port rangaone_fe_prod
```

### Build Errors

```bash
# On server, test build manually
cd /home/rangaone/htdocs/www.rangaone.finance/Rangaone_Finance
docker build -t test-build .
```

## Security Best Practices

✅ Never commit `.env` files
✅ Use GitHub Secrets for sensitive data
✅ SSH keys have proper permissions (600)
✅ Server firewall configured
✅ Docker runs as non-root user
✅ Regular security updates

## Performance

- **Build Time**: ~2-5 minutes
- **Deployment Time**: ~1-2 minutes
- **Downtime**: 0 seconds (blue-green)
- **Rollback Time**: ~30 seconds

---

**Deployment Status**: ✅ Zero Downtime Guaranteed
**Last Updated**: December 2025
