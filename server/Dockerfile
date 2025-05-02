# Use Debian-based slim image for better compatibility
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install dependencies (e.g. curl for debugging)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files first for caching
COPY package*.json ./

# Install dependencies, including global dev tools like nodemon
RUN npm install && npm install -g nodemon

# Copy rest of the app
COPY . .

# Expose backend port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "dev"]
