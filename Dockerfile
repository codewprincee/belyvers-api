# Development stage
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install --legacy-peer-deps --force

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads

# Set proper permissions
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose the port your app runs on
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "start:dev"] 