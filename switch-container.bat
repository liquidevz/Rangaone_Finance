@echo off

REM Switch between development and production containers

if "%1"=="dev" (
    echo 🔄 Switching to development...
    docker-compose down
    docker-compose up --build -d
    goto success
)

if "%1"=="prod" (
    echo 🔄 Switching to production...
    docker-compose down
    docker-compose -f docker-compose.production.yml up --build -d
    goto success
)

echo Usage: %0 {dev^|prod}
echo   dev  - Switch to development container
echo   prod - Switch to production container
exit /b 1

:success
echo ✅ Container switched successfully
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"