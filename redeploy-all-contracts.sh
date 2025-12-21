#!/bin/bash

# Complete redeployment script for all contracts
# Based on user's manual deployment pattern

set -e

echo "🔧 Redeploying All Contracts"
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

# Step 1: Deploy CredentialRegistry
echo "📋 Step 2: Deploying CredentialRegistry..."
CREDENTIAL_REGISTRY_OUTPUT=$(forge create src/CredentialRegistry.sol:CredentialRegistry \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --legacy \
    --broadcast \
    2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ CredentialRegistry deployment failed${NC}"
    echo "$CREDENTIAL_REGISTRY_OUTPUT"
    exit 1
fi

# Extract address
CREDENTIAL_REGISTRY_ADDRESS=$(echo "$CREDENTIAL_REGISTRY_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/')
CREDENTIAL_REGISTRY_TX=$(echo "$CREDENTIAL_REGISTRY_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/')

if [ -z "$CREDENTIAL_REGISTRY_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to extract CredentialRegistry address${NC}"
    echo "$CREDENTIAL_REGISTRY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ CredentialRegistry deployed${NC}"
echo "  Address: $CREDENTIAL_REGISTRY_ADDRESS"
echo "  Transaction: $CREDENTIAL_REGISTRY_TX"
echo ""

# Step 2: Deploy ZKVerifier
echo "📋 Step 3: Deploying ZKVerifier..."
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

# Extract address
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

# Step 3: Deploy ProtocolAccessControl
echo "📋 Step 4: Deploying ProtocolAccessControl..."
echo "  Using ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "  Using CredentialRegistry: $CREDENTIAL_REGISTRY_ADDRESS"
echo ""

PROTOCOL_OUTPUT=$(forge create src/ProtocolAccessControl.sol:ProtocolAccessControl \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --legacy \
    --broadcast \
    --constructor-args "$ZKVERIFIER_ADDRESS" "$CREDENTIAL_REGISTRY_ADDRESS" \
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

# Step 4: Update deployments.json
echo "📋 Step 5: Updating deployments.json..."
# Read current deployments.json to preserve network info
if [ -f deployments.json ]; then
    DEPLOYMENTS=$(cat deployments.json)
    NETWORK=$(echo "$DEPLOYMENTS" | jq -r '.network // "mantle-sepolia"')
    CHAIN_ID=$(echo "$DEPLOYMENTS" | jq -r '.chainId // 5003')
    DEPLOYER=$(echo "$DEPLOYMENTS" | jq -r '.deployer // ""')
else
    NETWORK="mantle-sepolia"
    CHAIN_ID=5003
    DEPLOYER=""
fi

# Create/update deployments.json
cat > deployments.json <<EOF
{
  "network": "$NETWORK",
  "chainId": $CHAIN_ID,
  "deployer": "$DEPLOYER",
  "contracts": {
    "CredentialRegistry": "$CREDENTIAL_REGISTRY_ADDRESS",
    "ZKVerifier": "$ZKVERIFIER_ADDRESS",
    "ProtocolAccessControl": "$PROTOCOL_ADDRESS"
  },
  "transactions": {
    "CredentialRegistry": "$CREDENTIAL_REGISTRY_TX",
    "ZKVerifier": "$ZKVERIFIER_TX",
    "ProtocolAccessControl": "$PROTOCOL_TX"
  }
}
EOF

echo -e "${GREEN}✅ deployments.json updated${NC}"
echo ""

echo -e "${GREEN}✅✅✅ Redeployment Complete ✅✅✅${NC}"
echo ""
echo "📊 Summary:"
echo "  CredentialRegistry: $CREDENTIAL_REGISTRY_ADDRESS"
echo "  ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "  ProtocolAccessControl: $PROTOCOL_ADDRESS"
echo ""
echo "⚠️  IMPORTANT: Restart backend services to load the new contract addresses"
echo "   The new ProtocolAccessControl has the hash extraction fix (mask instead of right-shift)"

