@echo off
setlocal enabledelayedexpansion

REM RangaOne Frontend Docker Deployment Script for Windows
REM This script builds and deploys the containerized Next.js application

set IMAGE_NAME=rangaone-fe
set CONTAINER_NAME=rangaone-fe-prod
set PORT=3000

echo 🚀 Starting RangaOne Frontend Deployment

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if .env.production exists
if not exist ".env.production" (
    echo ❌ .env.production file not found. Please create it with your production environment variables.
    exit /b 1
)

echo 📋 Checking environment...

REM Stop and remove existing container if it exists
docker ps -a --format "table {{.Names}}" | findstr /r "^%CONTAINER_NAME%$" >nul 2>&1
if not errorlevel 1 (
    echo 🛑 Stopping existing container...
    docker stop %CONTAINER_NAME% 2>nul
    docker rm %CONTAINER_NAME% 2>nul
)

REM Remove existing image if it exists
docker images --format "table {{.Repository}}:{{.Tag}}" | findstr /r "^%IMAGE_NAME%:latest$" >nul 2>&1
if not errorlevel 1 (
    echo 🗑️ Removing existing image...
    docker rmi %IMAGE_NAME%:latest 2>nul
)

REM Build the Docker image
echo 🔨 Building Docker image...
docker build -t %IMAGE_NAME%:latest .
if errorlevel 1 (
    echo ❌ Docker build failed
    exit /b 1
)

REM Run the container
echo 🚀 Starting container...
docker run -d --name %CONTAINER_NAME% --restart unless-stopped -p %PORT%:3000 --env-file .env.production -e NODE_ENV=production -e NEXT_TELEMETRY_DISABLED=1 %IMAGE_NAME%:latest
if errorlevel 1 (
    echo ❌ Failed to start container
    exit /b 1
)

REM Wait for container to be ready
echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak >nul

REM Health check
echo 🏥 Performing health check...
for /l %%i in (1,1,30) do (
    curl -f http://localhost:%PORT%/api/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Application is healthy and running!
        echo 🌐 Access your application at: http://localhost:%PORT%
        
        echo 📋 Recent logs:
        docker logs --tail 20 %CONTAINER_NAME%
        
        echo 📊 Container status:
        docker ps --filter "name=%CONTAINER_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        exit /b 0
    )
    echo ⏳ Waiting for health check... (%%i/30)
    timeout /t 2 /nobreak >nul
)

echo ❌ Health check failed. Application may not be running correctly.
echo 📋 Container logs:
docker logs %CONTAINER_NAME%
exit /b 1