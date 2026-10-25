# ==========================================
# Stage 1: Build TypeScript Backend
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm install

# Copy application source code
COPY src/ ./src/

# Compile TypeScript to JavaScript in dist/
RUN npm run build

# ==========================================
# Stage 2: Production Execution Environment
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV UPLOAD_DIR=/app/uploads

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Create persistent directory for uploaded task file attachments
RUN mkdir -p /app/uploads && chown -R node:node /app

# Use non-root user for container security
USER node

EXPOSE 5000

# Start compiled server
CMD ["node", "dist/server.js"]
