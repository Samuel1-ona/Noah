#!/bin/bash

# Deploy Vault Contract
# This script deploys the Vault contract from examples/vault-example/contracts/

set -e

echo "🏦 Deploying Vault Contract"
echo "============================"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Check if required environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    echo "   Please set it with: export PRIVATE_KEY=\"your_private_key_here\""
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "⚠️  RPC_URL not set, using default: https://rpc.sepolia.mantle.xyz"
    export RPC_URL="https://rpc.sepolia.mantle.xyz"
fi

# Get ProtocolAccessControl address from deployments.json or use default
if [ -f "deployments.json" ]; then
    PROTOCOL_ACCESS_CONTROL=$(cat deployments.json | grep -o '"ProtocolAccessControl": "[^"]*"' | cut -d'"' -f4)
    if [ -n "$PROTOCOL_ACCESS_CONTROL" ]; then
        echo "✅ Found ProtocolAccessControl in deployments.json: $PROTOCOL_ACCESS_CONTROL"
    else
        echo "⚠️  ProtocolAccessControl not found in deployments.json"
        echo "   Using default: 0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A"
        PROTOCOL_ACCESS_CONTROL="0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A"
    fi
else
    echo "⚠️  deployments.json not found, using default ProtocolAccessControl address"
    PROTOCOL_ACCESS_CONTROL="0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A"
fi

# Allow override via environment variable
if [ -n "$PROTOCOL_ACCESS_CONTROL_ADDRESS" ]; then
    PROTOCOL_ACCESS_CONTROL="$PROTOCOL_ACCESS_CONTROL_ADDRESS"
    echo "✅ Using ProtocolAccessControl from environment: $PROTOCOL_ACCESS_CONTROL"
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Copy Vault contract to src/ for compilation (temporary)
echo "📋 Step 1: Preparing Vault contract for deployment..."
if [ ! -f "examples/vault-example/contracts/Vault.sol" ]; then
    echo -e "${RED}❌ Vault contract not found at examples/vault-example/contracts/Vault.sol${NC}"
    exit 1
fi

# Copy to src/ temporarily
cp examples/vault-example/contracts/Vault.sol src/Vault.sol
echo -e "${GREEN}✅ Vault contract copied to src/${NC}"

# Build
echo ""
echo "📋 Step 2: Building contracts..."
forge build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    rm -f src/Vault.sol
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Deploy Vault
echo "📋 Step 3: Deploying Vault..."
echo "  Using ProtocolAccessControl: $PROTOCOL_ACCESS_CONTROL"
echo ""

VAULT_OUTPUT=$(forge create src/Vault.sol:Vault \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --legacy \
    --broadcast \
    --constructor-args "$PROTOCOL_ACCESS_CONTROL" \
    2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Vault deployment failed${NC}"
    echo "$VAULT_OUTPUT"
    rm -f src/Vault.sol
    exit 1
fi

# Extract address
VAULT_ADDRESS=$(echo "$VAULT_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/')
VAULT_TX=$(echo "$VAULT_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/')

if [ -z "$VAULT_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to extract Vault address${NC}"
    echo "$VAULT_OUTPUT"
    rm -f src/Vault.sol
    exit 1
fi

echo -e "${GREEN}✅ Vault deployed successfully!${NC}"
echo ""
echo "=== Deployment Summary ==="
echo "Vault Address: $VAULT_ADDRESS"
echo "Transaction: $VAULT_TX"
echo "ProtocolAccessControl: $PROTOCOL_ACCESS_CONTROL"
echo ""

# Update deployments.json
if [ -f "deployments.json" ]; then
    echo "📋 Updating deployments.json..."
    # Use a simple approach with jq if available, or manual update
    if command -v jq &> /dev/null; then
        jq ".contracts.Vault = \"$VAULT_ADDRESS\"" deployments.json > deployments.json.tmp && mv deployments.json.tmp deployments.json
        jq ".transactions.Vault = \"$VAULT_TX\"" deployments.json > deployments.json.tmp && mv deployments.json.tmp deployments.json
        echo -e "${GREEN}✅ deployments.json updated${NC}"
    else
        echo "⚠️  jq not found, please manually update deployments.json with:"
        echo "  \"Vault\": \"$VAULT_ADDRESS\""
    fi
else
    echo "⚠️  deployments.json not found, creating it..."
    cat > deployments.json <<EOF
{
  "network": "mantle-sepolia",
  "chainId": 5003,
  "contracts": {
    "Vault": "$VAULT_ADDRESS"
  },
  "transactions": {
    "Vault": "$VAULT_TX"
  }
}
EOF
    echo -e "${GREEN}✅ deployments.json created${NC}"
fi

# Clean up temporary file
rm -f src/Vault.sol
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your frontend .env file with:"
echo "   VITE_VAULT_ADDRESS=$VAULT_ADDRESS"
echo "2. Set vault requirements using ProtocolClient.setRequirements()"
echo "3. Start using the vault in your application!"

