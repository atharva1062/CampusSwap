# Multi-stage Production Dockerfile for CampusSwap

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Production Runner
FROM node:20-alpine AS production
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=5050

# Copy backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

# Generate Prisma Client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy backend source
COPY backend/src ./src
COPY backend/seedOfficialData.js ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create uploads and logs directory
RUN mkdir -p /app/backend/uploads /app/logs

EXPOSE 5050

# Run database migration, official seed, and start server
CMD ["sh", "-c", "npx prisma db push && node seedOfficialData.js && node src/server.js"]
