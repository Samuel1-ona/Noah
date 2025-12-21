#!/bin/bash

set -e

echo "🔧 Redeploying ZKVerifier Contract Only"
echo "========================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Check if required environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL environment variable is not set"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Step 1: Building contracts..."
forge build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

echo "📋 Step 2: Deploying ZKVerifier contract..."
ZKVERIFIER_OUTPUT=$(forge create src/ZKVerifier.sol:ZKVerifier \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --legacy \
    2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "$ZKVERIFIER_OUTPUT"
    exit 1
fi

# Extract address using macOS-compatible grep
ZKVERIFIER_ADDRESS=$(echo "$ZKVERIFIER_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/')
ZKVERIFIER_TX=$(echo "$ZKVERIFIER_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/')

if [ -z "$ZKVERIFIER_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to extract ZKVerifier address${NC}"
    echo "$ZKVERIFIER_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ ZKVerifier deployed${NC}"
echo "  Address: $ZKVERIFIER_ADDRESS"
echo "  Transaction: $ZKVERIFIER_TX"
echo ""

echo "📋 Step 3: Updating deployments.json..."
# Read current deployments.json
DEPLOYMENTS=$(cat deployments.json)

# Update ZKVerifier address and transaction
DEPLOYMENTS=$(echo "$DEPLOYMENTS" | jq --arg addr "$ZKVERIFIER_ADDRESS" --arg tx "$ZKVERIFIER_TX" \
    '.contracts.ZKVerifier = $addr | .transactions.ZKVerifier = $tx')

echo "$DEPLOYMENTS" > deployments.json

echo -e "${GREEN}✅ deployments.json updated${NC}"
echo ""

echo "📋 Step 4: Verifying deployment..."
echo "  ZKVerifier: $ZKVERIFIER_ADDRESS"
echo ""

echo -e "${GREEN}✅✅✅ ZKVerifier Redeployment Complete ✅✅✅${NC}"
echo ""
echo "⚠️  IMPORTANT: Restart backend services to load the new contract address"
echo "   The new ZKVerifier has the verification key that matches the current proving key"

