# Use stable LTS Node image
FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application files
COPY . .

# Expose Vite dev service port
EXPOSE 5173

# Run Vite dev server exposed on container host boundaries
CMD ["npm", "run", "dev", "--", "--host"]
