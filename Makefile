# Makefile for common actions

# Variables
DOCKER_COMPOSE = docker compose
NODE_ENV = NODE_ENV

.PHONY: run-test
# Run tests using Docker Compose

run-test:
	NODE_ENV=test $(DOCKER_COMPOSE) up -d
	NODE_ENV=test $(DOCKER_COMPOSE) exec -T frontend npm run test
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


