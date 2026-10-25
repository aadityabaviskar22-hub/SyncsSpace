# ==========================================
# Stage 1: Build Angular Standalone Admin App
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install npm packages
RUN npm install

# Copy application source code and configuration
COPY . .

# Build production bundle
RUN npm run build -- --configuration production

# ==========================================
# Stage 2: Serve via Lightweight Nginx Container
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled Angular distribution from builder stage (Angular 17+ outputs to dist/angular-admin/browser)
COPY --from=builder /app/dist/angular-admin/browser /usr/share/nginx/html

# Copy custom Nginx configuration supporting Angular routing & reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
