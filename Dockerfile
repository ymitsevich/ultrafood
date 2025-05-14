# Use the official Playwright image which includes browser dependencies
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Copy the rest of the application AFTER installing dependencies
COPY . .

#CMD ["npm", "run", "dev"]
