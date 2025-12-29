.PHONY: help install dev build test clean docker-up docker-down migrate seed

# Colors for output
BLUE := [0;34m
GREEN := [0;32m
YELLOW := [0;33m
RED := [0;31m
NC := [0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Hello Project - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s
", $$1, $$2}'

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm ci
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	npm run dev

build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	npm run test
	@echo "$(GREEN)✓ All tests passed$(NC)"

test-unit: ## Run unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	npm run test:unit

test-integration: ## Run integration tests
	@echo "$(BLUE)Running integration tests...$(NC)"
	npm run test:integration

test-e2e: ## Run E2E tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	npm run test:e2e

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

lint: ## Run linter
	@echo "$(BLUE)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

lint-fix: ## Run linter and fix issues
	@echo "$(BLUE)Running linter with auto-fix...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✓ Linting and fixes complete$(NC)"

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	npm run type-check
	@echo "$(GREEN)✓ Type check complete$(NC)"

clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf dist
	rm -rf coverage
	rm -rf node_modules
	rm -rf .next
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

docker-up: ## Start all Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Docker services started$(NC)"

docker-down: ## Stop all Docker services
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Docker services stopped$(NC)"

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-ps: ## Show running Docker containers
	docker-compose ps

docker-clean: ## Remove Docker volumes and images
	@echo "$(YELLOW)Cleaning Docker resources...$(NC)"
	docker-compose down -v --rmi all
	@echo "$(GREEN)✓ Docker cleanup complete$(NC)"

migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	npm run db:migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

migrate-rollback: ## Rollback last migration
	@echo "$(YELLOW)Rolling back last migration...$(NC)"
	npm run db:migrate:rollback
	@echo "$(GREEN)✓ Rollback complete$(NC)"

seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	npm run db:seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-reset: ## Reset database (drop, migrate, seed)
	@echo "$(YELLOW)Resetting database...$(NC)"
	npm run db:reset
	@echo "$(GREEN)✓ Database reset complete$(NC)"

security-audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	npm audit
	@echo "$(GREEN)✓ Security audit complete$(NC)"

security-fix: ## Fix security vulnerabilities
	@echo "$(BLUE)Fixing security vulnerabilities...$(NC)"
	npm audit fix
	@echo "$(GREEN)✓ Security fixes applied$(NC)"

benchmark: ## Run performance benchmarks
	@echo "$(BLUE)Running performance benchmarks...$(NC)"
	npm run test:performance
	@echo "$(GREEN)✓ Benchmarks complete$(NC)"

docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	npm run docs:generate
	@echo "$(GREEN)✓ Documentation generated$(NC)"

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(NC)"
	npm run docs:serve

quality: lint type-check test-coverage ## Run all quality checks
	@echo "$(GREEN)✓ All quality checks passed$(NC)"

ci: quality security-audit ## Run CI pipeline locally
	@echo "$(GREEN)✓ CI pipeline complete$(NC)"

deploy-staging: ## Deploy to staging
	@echo "$(BLUE)Deploying to staging...$(NC)"
	npm run deploy:staging
	@echo "$(GREEN)✓ Deployed to staging$(NC)"

deploy-prod: ## Deploy to production
	@echo "$(RED)Deploying to production...$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		npm run deploy:production; \
		echo "$(GREEN)✓ Deployed to production$(NC)"; \
	else \
		echo "$(YELLOW)Deployment cancelled$(NC)"; \
	fi

setup: install docker-up migrate seed ## Complete project setup
	@echo "$(GREEN)✓ Project setup complete$(NC)"
	@echo ""
	@echo "$(BLUE)Services running at:$(NC)"
	@echo "  App:            http://localhost:3000"
	@echo "  Redis Commander: http://localhost:8081"
	@echo "  pgAdmin:        http://localhost:5050"
	@echo "  Prometheus:     http://localhost:9090"
	@echo "  Grafana:        http://localhost:3001"

status: ## Show project status
	@echo "$(BLUE)Project Status$(NC)"
	@echo ""
	@echo "$(GREEN)Docker Services:$(NC)"
	@make docker-ps
	@echo ""
	@echo "$(GREEN)Git Status:$(NC)"
	@git status -s
	@echo ""
	@echo "$(GREEN)npm Outdated:$(NC)"
	@npm outdated || true
