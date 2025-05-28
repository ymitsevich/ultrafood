# Makefile for common actions

# Variables
DOCKER_COMPOSE = docker compose
NODE_ENV = NODE_ENV

.PHONY: install
# Install dependencies and generate package-lock.json using Docker
install:
	@echo "Installing dependencies and generating package-lock.json using Docker..."
	$(DOCKER_COMPOSE) build
	$(DOCKER_COMPOSE) run --rm frontend npm install
	@echo "Dependencies installed successfully!"

.PHONY: clean-install
# Clean install - removes node_modules and reinstalls everything using Docker
clean-install:
	@echo "Performing clean install using Docker..."
	$(DOCKER_COMPOSE) run --rm frontend rm -rf node_modules package-lock.json
	$(DOCKER_COMPOSE) run --rm frontend npm install
	@echo "Clean install completed!"

.PHONY: docker-install
# Install dependencies inside Docker container
docker-install:
	@echo "Installing dependencies in Docker container..."
	$(DOCKER_COMPOSE) build --no-cache
	@echo "Docker dependencies installed!"

.PHONY: run-test
# Run tests using Docker Compose

run-test:
	NODE_ENV=test $(DOCKER_COMPOSE) up -d
	NODE_ENV=test $(DOCKER_COMPOSE) exec frontend npm run test
	$(DOCKER_COMPOSE) down

.PHONY: run-local
# Run the application locally

run-local:
	NODE_ENV=development $(DOCKER_COMPOSE) up

.PHONY: run-ci
# Run tests in CI mode

run-ci:
	NODE_ENV=test $(DOCKER_COMPOSE) build
	NODE_ENV=test $(DOCKER_COMPOSE) up -d
	NODE_ENV=test $(DOCKER_COMPOSE) exec -T frontend npm run test
	$(DOCKER_COMPOSE) down


