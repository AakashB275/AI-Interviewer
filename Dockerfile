# Stage 1: Build Frontend
FROM node:22.17.0 AS frontend-builder

WORKDIR /app/frontend

# Copy Frontend package files
COPY Frontend/package*.json ./
COPY Frontend/vite.config.js ./
COPY Frontend/jsconfig.json ./
COPY Frontend/.env* ./

# Install dependencies
# RUN npm ci --only=production
RUN npm ci 


# Copy Frontend source
COPY Frontend/src ./src
COPY Frontend/index.html ./
COPY Frontend/public ./public

# Build the frontend
RUN npm run build


# Stage 2: Runtime Backend with Frontend Assets
FROM node:22.17.0

WORKDIR /app

# Set timezone
ENV TZ="Asia/Kolkata"
ENV NODE_ENV=production

# Copy Backend package files
COPY Backend/package*.json ./

# Install Backend dependencies
# RUN npm ci --only=production
RUN npm ci 
# Copy Backend source code
COPY Backend . 

# Copy built Frontend assets from builder stage
COPY --from=frontend-builder /app/frontend/dist ./public/frontend

# Expose port for the service
EXPOSE 3000

# Start the backend
CMD ["node", "app.js"]