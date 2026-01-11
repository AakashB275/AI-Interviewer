@echo off
REM Docker Quick Start Script for AI Interviewer
REM This script helps with common Docker operations

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Docker Quick Start Script for AI Interviewer
    echo.
    echo Usage: docker-quick.bat [command]
    echo.
    echo Commands:
    echo   build       - Build the Docker image
    echo   up          - Start services with Docker Compose
    echo   down        - Stop services
    echo   logs        - View live logs
    echo   rebuild     - Full rebuild (clean + build + up)
    echo   clean       - Clean up Docker resources
    echo   status      - Show running containers
    echo   shell       - Open shell in running container
    echo.
    exit /b
)

if "%1"=="build" (
    echo Building Docker image...
    docker build -t ai-interviewer:latest .
    echo Build complete!
    exit /b
)

if "%1"=="up" (
    echo Starting services...
    docker-compose up -d
    echo Services started! Access at http://localhost:3000
    exit /b
)

if "%1"=="down" (
    echo Stopping services...
    docker-compose down
    echo Services stopped!
    exit /b
)

if "%1"=="logs" (
    echo Showing live logs (Ctrl+C to exit)...
    docker-compose logs -f backend
    exit /b
)

if "%1"=="rebuild" (
    echo Performing full rebuild...
    docker-compose down
    docker system prune -f
    docker-compose up --build
    echo Rebuild complete! Access at http://localhost:3000
    exit /b
)

if "%1"=="clean" (
    echo Cleaning up Docker resources...
    docker-compose down
    docker system prune -f
    echo Cleanup complete!
    exit /b
)

if "%1"=="status" (
    echo Running containers:
    docker ps
    exit /b
)

if "%1"=="shell" (
    echo Opening shell in container...
    docker-compose exec backend sh
    exit /b
)

echo Unknown command: %1
echo Run 'docker-quick.bat' without arguments for help
