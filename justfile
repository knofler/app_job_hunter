set shell := ["/bin/zsh", "-c"]

# Default workflow ensures linting, types, and build succeed
default: verify

# Install project dependencies
install:
	npm install

# Start local development server
dev:
	npm run dev

# Run lint checks
lint:
	npm run lint

# Run TypeScript type checks
typecheck:
	npm run typecheck

# Build production bundle
build:
	npm run build

# Aggregate lint, types, and build for CI-like verification
verify:
	npm run verify

# Draft a PR using repository context
pr-draft:
	gh pr create --draft --fill
