# Backend-only image — frontend is deployed separately on Vercel
FROM node:22.17.0

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Kolkata

# Install dependencies first (better layer caching)
COPY Backend/package*.json ./
RUN npm ci

# Copy backend source
COPY Backend .

EXPOSE 3000

CMD ["node", "app.js"]