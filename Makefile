.PHONY: help compile test deploy clean circuit circuit-go

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

compile: ## Compile smart contracts
	forge build

test: ## Run tests
	forge test

test-verbose: ## Run tests with verbose output
	forge test -vvv

circuit: ## Compile ZK circuit and generate verifier (Go/gnark)
	@echo "🔨 Compiling ZK-KYC circuit with gnark..."
	@cd cmd/generate-verifier && go run main.go

deploy-mantle: ## Deploy to Mantle mainnet
	forge script script/Deploy.s.sol:DeployScript --rpc-url mantle --broadcast --verify

deploy-testnet: ## Deploy to Mantle testnet
	forge script script/Deploy.s.sol:DeployScript --rpc-url mantle_testnet --broadcast --verify

clean: ## Clean build artifacts
	forge clean
	rm -rf build/
	rm -rf out/
	rm -rf cache/
	go clean -cache

install: ## Install dependencies
	forge install
	go mod download
	go mod tidy
