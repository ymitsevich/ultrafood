FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with platform-specific binaries disabled
# This avoids the @rollup/rollup-darwin-arm64 error
RUN npm install

# Copy the rest of the application
COPY . .

# Run another install after config files are copied to ensure
# everything is properly set up
RUN npm install

CMD ["npm", "run", "dev"]
