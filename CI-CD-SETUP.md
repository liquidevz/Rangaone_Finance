# CI/CD Pipeline Setup Guide

## Step-by-Step Setup

### 1. VPS Preparation
```bash
# Run on your VPS
curl -fsSL https://raw.githubusercontent.com/your-org/rangaone-fe/main/scripts/vps-setup.sh | bash
```

### 2. GitHub Repository Setup

#### A. Enable GitHub Container Registry
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Create token with `write:packages` permission
3. Repository → Settings → Actions → General → Enable "Read and write permissions"

#### B. Add Repository Secrets
Go to Repository → Settings → Secrets and variables → Actions

**Required Secrets:**
```
VPS_HOST=your-server-ip
VPS_USER=your-username
VPS_SSH_KEY=your-private-ssh-key
```

### 3. VPS Configuration

#### A. SSH Key Setup
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "ci-cd@rangaone"

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-vps-ip

# Add private key to GitHub secrets as VPS_SSH_KEY
cat ~/.ssh/id_rsa
```

#### B. Environment Variables
```bash
# On VPS: Edit /opt/rangaone-fe/.env.production
sudo nano /opt/rangaone-fe/.env.production
```

### 4. Update Docker Compose
Edit `docker-compose.ci.yml` and update the image name:
```yaml
image: ${IMAGE_TAG:-ghcr.io/YOUR_GITHUB_USERNAME/rangaone-fe:latest}
```

### 5. Deployment Trigger
```bash
# Push to main branch
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

## Pipeline Flow

1. **Code Push** → GitHub Actions triggered
2. **Build** → Docker image built with optimizations
3. **Push** → Image pushed to GitHub Container Registry
4. **Deploy** → VPS pulls image and restarts containers
5. **Health Check** → Verify deployment success

## Monitoring

### Check Deployment Status
```bash
# GitHub Actions
https://github.com/your-org/rangaone-fe/actions

# VPS Status
ssh user@your-vps-ip
cd /opt/rangaone-fe
docker-compose -f docker-compose.production.yml ps
```

### Health Check
```bash
curl http://your-vps-ip/api/health
```

## Troubleshooting

### Build Fails
- Check GitHub Actions logs
- Verify Dockerfile.optimized syntax
- Ensure all dependencies in package.json

### Deployment Fails
- Check VPS SSH access
- Verify Docker is running on VPS
- Check environment variables

### API Issues
- Verify .env.production on VPS
- Check nginx configuration
- Test container networking

## Advanced Features

### Auto-rollback on Failure
Add to `.github/workflows/deploy.yml`:
```yaml
- name: Rollback on failure
  if: failure()
  run: |
    ssh user@${{ secrets.VPS_HOST }} "
      cd /opt/rangaone-fe
      docker-compose -f docker-compose.production.yml down
      docker run -d --name rangaone-fe-prod-backup previous-image:tag
    "
```

### Staging Environment
Create `.github/workflows/staging.yml` for develop branch deployments.

### Database Migrations
Add migration step before deployment:
```yaml
- name: Run migrations
  run: |
    ssh user@${{ secrets.VPS_HOST }} "
      docker exec rangaone-fe-prod npm run migrate
    "
```

Your CI/CD pipeline is now ready! 🚀