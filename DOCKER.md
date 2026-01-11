# Docker Setup Guide for AI Interviewer

## Overview

This project uses Docker to containerize the full stack application with:
- **Frontend**: React app (built with Vite) - served from the Backend
- **Backend**: Node.js Express server

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 1.29+)
- Your environment variables configured in `Backend/.env`

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```bash
# Clone or navigate to your project directory
cd "D:\Coding Projects\AI Interviewer"

# Create a .env file in the Backend folder with your configuration
cp Backend/.env.docker.example Backend/.env
# Edit Backend/.env with your actual values

# Build and start the application
docker-compose up --build

# The app will be available at http://localhost:3000
```

### 2. Build Docker Image Manually

```bash
# Build the image
docker build -t ai-interviewer:latest .

# Run the container
docker run -p 3000:3000 \
  --env-file Backend/.env \
  --name ai-interviewer \
  ai-interviewer:latest
```

### 3. Build Stages Explanation

The Dockerfile uses a **multi-stage build** for optimization:

1. **Stage 1 (frontend-builder)**: 
   - Installs Frontend dependencies
   - Builds the React app with Vite
   - Produces optimized production build in `/dist`

2. **Stage 2 (runtime)**:
   - Starts fresh with Node.js base image (smaller size)
   - Installs Backend dependencies
   - Copies Backend source code
   - Copies built Frontend assets from Stage 1
   - Runs the Backend Express server

**Benefits**:
- ✅ Only production dependencies included
- ✅ Smaller final image size
- ✅ Frontend assets pre-built and optimized
- ✅ Single container serves both Frontend and Backend

## Environment Variables

### Backend .env Configuration

Create `Backend/.env` with:

```env
NODE_ENV=production
API_PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-interviewer
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-key-here
GOOGLE_API_KEY=your-key-here
CLOUDINARY_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-session-secret
```

Use `Backend/.env.docker.example` as a template.

## File Structure

```
AI Interviewer/
├── Dockerfile           # Multi-stage build configuration
├── docker-compose.yml   # Docker Compose orchestration
├── .dockerignore        # Files to exclude from Docker build
├── Frontend/            # React app source
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── Backend/             # Node.js Express server
    ├── app.js
    ├── package.json
    ├── src/
    └── .env             # Environment variables (create this)
```

## Docker Compose Commands

```bash
# Start services in background
docker-compose up -d

# Build and start
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild after code changes
docker-compose up --build --no-cache

# Run with specific environment
docker-compose -f docker-compose.yml up
```

## Troubleshooting

### Port 3000 already in use
```bash
# Change port in docker-compose.yml
# Modify: ports: - "3000:3000"  →  - "8000:3000"
docker-compose up
# Access at http://localhost:8000
```

### Build fails - Dependencies not installing
```bash
# Clean rebuild
docker-compose down
docker system prune
docker-compose up --build --no-cache
```

### Frontend assets not loading
- Ensure `Frontend/dist` is built correctly
- Check that Frontend source is properly copied in Dockerfile
- Verify the `public/frontend` path in Backend serves static files

### Backend connection issues
```bash
# Check container logs
docker-compose logs backend

# Test backend health
curl http://localhost:3000/health
```

### Environment variables not loading
```bash
# Verify .env file exists
ls -la Backend/.env

# Rebuild container
docker-compose down
docker-compose up --build
```

## Production Deployment

### Before Deploying

1. **Test the Docker build locally**
   ```bash
   docker build -t ai-interviewer:latest .
   docker run -p 3000:3000 --env-file Backend/.env ai-interviewer:latest
   ```

2. **Optimize environment variables**
   - Use secrets management (not plain .env in production)
   - Set `NODE_ENV=production`
   - Configure proper `CORS_ORIGIN`

3. **Security considerations**
   ```dockerfile
   # Good practices already in place:
   - Running on port 3000
   - Health checks configured
   - Restart policy: unless-stopped
   - Environment variables from file
   ```

4. **Recommended additions for production**
   ```bash
   # Use reverse proxy (nginx)
   # Implement proper logging
   # Add monitoring/health checks
   # Use environment-specific .env files
   ```

## Image Details

- **Base Image**: `node:22.17.0` (LTS)
- **Final Image Size**: ~300-400MB (depends on dependencies)
- **Timezone**: Asia/Kolkata (configurable via ENV)
- **Port**: 3000 (configurable)
- **Health Check**: Every 30s with 40s startup grace period

## Advanced Usage

### Custom Build Arguments
```bash
docker build \
  --build-arg NODE_VERSION=22.17.0 \
  -t ai-interviewer:latest .
```

### Volume Mounting for Development
```bash
docker run -p 3000:3000 \
  -v $(pwd)/Backend:/app \
  --env-file Backend/.env \
  ai-interviewer:latest
```

### Using with Kubernetes
The image is ready for Kubernetes deployment. Create appropriate manifests for:
- Deployment
- Service
- ConfigMap (for non-secret config)
- Secret (for sensitive env vars)

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Rebuild from scratch: `docker system prune && docker-compose up --build`
4. Check ports: `netstat -an | grep 3000`
