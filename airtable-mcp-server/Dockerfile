# Dockerfile for Airtable MCP Server

# 1. Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# 2. Build the TypeScript source
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built app from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpserver -u 1001
USER mcpserver

EXPOSE 3001

CMD ["node", "dist/src/index.js"]