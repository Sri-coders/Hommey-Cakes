# Use a stable, lightweight LTS Node image
FROM node:18-alpine

# Install build dependencies for standard native package builds if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application files
COPY . .

# Create uploads folder inside container and grant access permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose backend service port
EXPOSE 5000

# Start Express server thread
CMD ["npm", "start"]
