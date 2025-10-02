# Multi-stage build for production

# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client ./client
COPY server ./server

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/src/db ./server/src/db

# Copy necessary config files
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server/index.js"]