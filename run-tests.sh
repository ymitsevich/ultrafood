#!/bin/bash

# Exit on error
set -e

# Build the container if needed
echo "Building Docker container..."
docker compose build

# Start the container if not already running
echo "Starting Docker services..."
docker compose up -d

# Run the build inside the container to ensure latest code is built
echo "Building the application..."
docker compose exec frontend npm run build

# Run the tests inside the container
echo "Running Playwright tests..."
docker compose exec frontend npm run test

# Preserve test results
echo "Preserving test results..."
docker compose exec frontend bash -c "chmod -R 777 playwright-report test-results || true"

echo "Tests completed!"