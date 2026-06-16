# --- Production Dockerfile for Full-Stack App ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the production optimized static assets and server bundle
RUN npm run build

# Expose port 3000 (Required by AI Studio infrastructure)
EXPOSE 3000

# Set environment variable to production
ENV NODE_ENV=production

# Start the full-stack server
CMD ["node", "dist/server.cjs"]
