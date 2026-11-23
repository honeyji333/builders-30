# =============================================================================
# KageStream - Production Container Image
# Day 14 Deliverable: Multi-Platform Free Hosting Deployment (#ALTABuilder30)
# =============================================================================
FROM node:22-alpine

WORKDIR /app

# Install build dependencies required for compiling better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code and database
COPY . .

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=./data/anime.db

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
