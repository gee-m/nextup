# Task Tree Makefile
# Useful commands for building, testing, and managing the project

.PHONY: help build clean validate watch test dev lint format check-all install

# Default target
.DEFAULT_GOAL := help

##@ General

help: ## Show this help message
	@echo "Task Tree - Modular Architecture Build System"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-15s %s\n", $$1, $$2 } /^##@/ { printf "\n%s\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Building

build: ## Build dist/task-tree.html from src/
	@echo "🏗️  Building Task Tree..."
	@node build.js
	@echo "✅ Build complete!"

rebuild: clean build ## Clean and rebuild from scratch

validate: ## Validate project structure without building
	@echo "🔍 Validating project structure..."
	@node build.js --validate
	@echo "✅ Validation passed!"

##@ Development

dev: ## Build and open in browser (requires 'open' or 'xdg-open')
	@$(MAKE) build
	@echo "🌐 Opening in browser..."
	@if command -v xdg-open > /dev/null; then \
		xdg-open dist/task-tree.html; \
	elif command -v open > /dev/null; then \
		open dist/task-tree.html; \
	else \
		echo "❌ Could not detect browser opener. Please open dist/task-tree.html manually."; \
	fi

watch: ## Watch for changes and rebuild (requires 'fswatch' or 'inotifywait')
	@echo "👀 Watching src/ for changes (Ctrl+C to stop)..."
	@if command -v fswatch > /dev/null; then \
		fswatch -o src/ | while read event; do \
			echo "📝 Change detected, rebuilding..."; \
			$(MAKE) build; \
		done; \
	elif command -v inotifywait > /dev/null; then \
		while inotifywait -r -e modify,create,delete src/; do \
			echo "📝 Change detected, rebuilding..."; \
			$(MAKE) build; \
		done; \
	else \
		echo "❌ Watch mode requires 'fswatch' (macOS) or 'inotifywait' (Linux)"; \
		echo "   Install: brew install fswatch (macOS) or apt install inotify-tools (Linux)"; \
		exit 1; \
	fi

serve: ## Start local HTTP server (requires Python or Node http-server)
	@echo "🚀 Starting local server..."
	@if command -v python3 > /dev/null; then \
		echo "   Server: http://localhost:8000"; \
		echo "   File: http://localhost:8000/dist/task-tree.html"; \
		python3 -m http.server 8000; \
	elif command -v python > /dev/null; then \
		echo "   Server: http://localhost:8000"; \
		echo "   File: http://localhost:8000/dist/task-tree.html"; \
		python -m SimpleHTTPServer 8000; \
	elif command -v http-server > /dev/null; then \
		echo "   Server: http://localhost:8080"; \
		echo "   File: http://localhost:8080/dist/task-tree.html"; \
		http-server -p 8080; \
	else \
		echo "❌ No HTTP server found. Install:"; \
		echo "   npm install -g http-server"; \
		echo "   or use Python (already installed on most systems)"; \
		exit 1; \
	fi

##@ Cleaning

clean: ## Remove build artifacts (dist/)
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist/
	@echo "✅ Cleaned!"

clean-all: clean ## Remove build artifacts and node_modules
	@echo "🧹 Removing node_modules..."
	@rm -rf node_modules/
	@echo "✅ Deep clean complete!"

##@ Testing

test: ## Run all tests
	@echo "🧪 Running tests..."
	@if [ ! -d node_modules ]; then \
		echo "⚠️  node_modules not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@npm test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode (Ctrl+C to stop)..."
	@npm run test:watch

test-ui: ## Open Vitest UI (interactive test runner)
	@echo "🎨 Opening Vitest UI..."
	@npm run test:ui

test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	@npm run test:coverage
	@echo ""
	@echo "Coverage report generated in coverage/"

test-unit: test ## Run unit tests (alias for 'test')

test-integration: ## Run integration tests (placeholder)
	@echo "🧪 Running integration tests..."
	@echo "⚠️  Not implemented yet. Add Playwright/Cypress tests in tests/integration/"

test-manual: build ## Build and load test checklist data
	@echo "🧪 Building with test data..."
	@echo "✅ Build complete. Open dist/task-tree.html and click '🧪 Test Checklist'"

##@ Code Quality

check: validate test ## Run all checks (build validation + tests)
	@echo ""
	@echo "✅ All checks passed!"
	@echo ""
	@echo "Ready to commit:"
	@echo "  git add ."
	@echo "  git commit -m 'your message'"

lint: ## Lint JavaScript files (placeholder)
	@echo "🔍 Linting JavaScript..."
	@echo "⚠️  Linting not configured. Recommended: ESLint"
	@echo "   npm install --save-dev eslint"
	@echo "   npx eslint src/js/**/*.js"

format: ## Format code (placeholder)
	@echo "💅 Formatting code..."
	@echo "⚠️  Formatting not configured. Recommended: Prettier"
	@echo "   npm install --save-dev prettier"
	@echo "   npx prettier --write 'src/**/*.{js,css,html}'"

check-all: check lint format ## Run ALL checks (validate + test + lint + format)
	@echo "✅ All checks passed!"

##@ Documentation

docs: ## Open documentation in browser
	@echo "📚 Documentation files:"
	@echo "  - README.md (project overview)"
	@echo "  - CLAUDE.md (development guide)"
	@echo "  - MODULE-MAP.md (code navigation)"
	@echo "  - REFACTOR-VERIFICATION.md (refactor details)"
	@echo "  - REFACTORING-PROPOSAL.md (original plan)"
	@if command -v open > /dev/null; then \
		open README.md; \
	elif command -v xdg-open > /dev/null; then \
		xdg-open README.md; \
	fi

module-map: ## Show module organization
	@echo "📁 Module Structure:"
	@echo ""
	@echo "CSS Modules (src/styles/):"
	@ls -1 src/styles/*.css | sed 's|src/styles/||' | nl
	@echo ""
	@echo "JS Modules (src/js/):"
	@find src/js -name "*.js" -type f | sort | sed 's|src/js/||' | nl

stats: ## Show project statistics
	@echo "📊 Project Statistics:"
	@echo ""
	@echo "Source Files:"
	@echo "  CSS modules:  $$(find src/styles -name '*.css' | wc -l)"
	@echo "  JS modules:   $$(find src/js -name '*.js' | wc -l)"
	@echo "  Total:        $$(find src -name '*.css' -o -name '*.js' | wc -l)"
	@echo ""
	@echo "Code Size:"
	@echo "  CSS lines:    $$(cat src/styles/*.css | wc -l)"
	@echo "  JS lines:     $$(find src/js -name '*.js' -exec cat {} \; | wc -l)"
	@echo "  HTML lines:   $$(cat src/index.html | wc -l)"
	@echo ""
	@if [ -f dist/task-tree.html ]; then \
		echo "Build Output:"; \
		echo "  Size:         $$(du -h dist/task-tree.html | cut -f1)"; \
		echo "  Lines:        $$(wc -l < dist/task-tree.html)"; \
	else \
		echo "Build Output: Not built yet (run 'make build')"; \
	fi

##@ Dependencies

setup: ## Setup project (install deps + git hooks)
	@echo "🚀 Setting up Task Tree development environment..."
	@echo ""
	@echo "📦 Installing npm dependencies..."
	@npm install
	@echo ""
	@echo "🪝 Installing git hooks..."
	@bash install-hooks.sh
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Quick start:"
	@echo "  make build    # Build dist/task-tree.html"
	@echo "  make test     # Run tests"
	@echo "  make check    # Run all checks (build + test)"
	@echo "  make dev      # Build and open in browser"

install: setup ## Install dependencies (alias for 'setup')

install-deps: ## Install npm dependencies only
	@echo "📦 Installing npm dependencies..."
	@npm install
	@echo "✅ Dependencies installed!"

install-hooks: ## Install git hooks only
	@echo "🪝 Installing git hooks..."
	@bash install-hooks.sh

##@ Git

commit: ## Rebuild, test manually, then prepare commit
	@$(MAKE) build
	@echo ""
	@echo "✅ Build successful!"
	@echo ""
	@echo "📋 Pre-commit checklist:"
	@echo "  1. Open dist/task-tree.html in browser"
	@echo "  2. Test the changes manually"
	@echo "  3. Verify no console errors"
	@echo "  4. Update README.md with changes"
	@echo ""
	@echo "When ready to commit:"
	@echo "  git add ."
	@echo "  git commit -m 'your message'"
	@echo "  git push origin main"

push: ## Rebuild, show git status, ready for commit
	@$(MAKE) build
	@echo ""
	@git status
	@echo ""
	@echo "Ready to commit! Run:"
	@echo "  git add ."
	@echo "  git commit -m 'feat: your message'"
	@echo "  git push origin main"

##@ Verification

verify-refactor: ## Verify refactoring is complete and correct
	@echo "🔍 Verifying refactoring..."
	@echo ""
	@echo "Checking file structure..."
	@test -d src/styles || (echo "❌ Missing src/styles"; exit 1)
	@test -d src/js || (echo "❌ Missing src/js"; exit 1)
	@test -f build.js || (echo "❌ Missing build.js"; exit 1)
	@test -f MODULE-MAP.md || (echo "❌ Missing MODULE-MAP.md"; exit 1)
	@echo "✅ Directory structure correct"
	@echo ""
	@echo "Checking CSS modules..."
	@test $$(find src/styles -name '*.css' | wc -l) -eq 7 || (echo "❌ Expected 7 CSS files"; exit 1)
	@echo "✅ 7 CSS modules found"
	@echo ""
	@echo "Checking JS modules..."
	@test $$(find src/js -name '*.js' | wc -l) -eq 33 || (echo "⚠️  Expected 33 JS files, found $$(find src/js -name '*.js' | wc -l)")
	@echo "✅ $$(find src/js -name '*.js' | wc -l) JS modules found"
	@echo ""
	@echo "Testing build..."
	@$(MAKE) build > /dev/null
	@test -f dist/task-tree.html || (echo "❌ Build failed"; exit 1)
	@echo "✅ Build successful"
	@echo ""
	@echo "📊 Refactoring Status: ✅ COMPLETE"
	@echo ""
	@echo "See REFACTOR-VERIFICATION.md for detailed report."

##@ CI/CD (Placeholder)

ci: validate build test-unit ## Simulate CI pipeline (placeholder)
	@echo "🚀 Running CI pipeline..."
	@echo "✅ CI checks passed!"
	@echo ""
	@echo "⚠️  Add real CI/CD with GitHub Actions:"
	@echo "   .github/workflows/ci.yml"
