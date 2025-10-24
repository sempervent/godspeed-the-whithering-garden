.PHONY: dev build test e2e lint format pages-deploy clean

# Development (Docker-first)
dev:
	docker compose --profile dev up --build

# Build
build:
	docker compose --profile build up --build --abort-on-container-exit

# Testing
test:
	docker compose --profile test run --rm unit

# E2E Testing
e2e:
	docker compose --profile e2e run --rm e2e

# Production
prod:
	docker compose --profile prod up --build -d

# Stop all services
down:
	docker compose down -v

# Linting
lint:
	docker compose --profile test run --rm unit pnpm lint

# Formatting
format:
	docker compose --profile test run --rm unit pnpm format

# Type checking
typecheck:
	docker compose --profile test run --rm unit pnpm typecheck

# GitHub Pages deployment
pages-deploy:
	@echo "To deploy to GitHub Pages:"
	@echo "1. Push to main branch"
	@echo "2. GitHub Actions will automatically build and deploy"
	@echo "3. Set BASE_PATH=/godseed-withering-garden/ in repository secrets if needed"

# Clean up
clean:
	docker compose down -v
	docker system prune -f
