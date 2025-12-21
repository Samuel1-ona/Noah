#!/bin/bash

set -e

echo "🔧 Redeploying ZKVerifier and ProtocolAccessControl"
echo "===================================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Check if required environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "⚠️  RPC_URL not set, using default: https://rpc.sepolia.mantle.xyz"
    export RPC_URL="https://rpc.sepolia.mantle.xyz"
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

# Load existing CredentialRegistry address
CREDENTIAL_REGISTRY=$(jq -r '.contracts.CredentialRegistry' deployments.json)
if [ -z "$CREDENTIAL_REGISTRY" ] || [ "$CREDENTIAL_REGISTRY" = "null" ]; then
    echo -e "${RED}❌ CredentialRegistry address not found in deployments.json${NC}"
    exit 1
fi
echo "📋 Using existing CredentialRegistry: $CREDENTIAL_REGISTRY"
echo ""

echo "📋 Step 2: Deploying ZKVerifier contract..."
ZKVERIFIER_OUTPUT=$(forge create src/ZKVerifier.sol:ZKVerifier \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --legacy \
    --broadcast \
    2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ZKVerifier deployment failed${NC}"
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

echo "📋 Step 3: Deploying ProtocolAccessControl contract..."
echo "  Using ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "  Using CredentialRegistry: $CREDENTIAL_REGISTRY"
echo ""

PROTOCOL_OUTPUT=$(forge create src/ProtocolAccessControl.sol:ProtocolAccessControl \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --legacy \
    --broadcast \
    --constructor-args "$ZKVERIFIER_ADDRESS" "$CREDENTIAL_REGISTRY" \
    2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ProtocolAccessControl deployment failed${NC}"
    echo "$PROTOCOL_OUTPUT"
    exit 1
fi

# Extract address
PROTOCOL_ADDRESS=$(echo "$PROTOCOL_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/')
PROTOCOL_TX=$(echo "$PROTOCOL_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/')

if [ -z "$PROTOCOL_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to extract ProtocolAccessControl address${NC}"
    echo "$PROTOCOL_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ ProtocolAccessControl deployed${NC}"
echo "  Address: $PROTOCOL_ADDRESS"
echo "  Transaction: $PROTOCOL_TX"
echo ""

echo "📋 Step 4: Updating deployments.json..."
# Read current deployments.json
DEPLOYMENTS=$(cat deployments.json)

# Update ZKVerifier and ProtocolAccessControl addresses and transactions
DEPLOYMENTS=$(echo "$DEPLOYMENTS" | jq \
    --arg zkAddr "$ZKVERIFIER_ADDRESS" \
    --arg zkTx "$ZKVERIFIER_TX" \
    --arg protoAddr "$PROTOCOL_ADDRESS" \
    --arg protoTx "$PROTOCOL_TX" \
    '.contracts.ZKVerifier = $zkAddr | .transactions.ZKVerifier = $zkTx | .contracts.ProtocolAccessControl = $protoAddr | .transactions.ProtocolAccessControl = $protoTx')

echo "$DEPLOYMENTS" > deployments.json

echo -e "${GREEN}✅ deployments.json updated${NC}"
echo ""

echo -e "${GREEN}✅✅✅ Redeployment Complete ✅✅✅${NC}"
echo ""
echo "📊 Summary:"
echo "  ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "  ProtocolAccessControl: $PROTOCOL_ADDRESS"
echo ""
echo "⚠️  IMPORTANT: Restart backend services to load the new contract addresses"
echo "   The new ZKVerifier has the verification key that matches the current proving key"

