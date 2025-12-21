#!/bin/bash

# Manual contract deployment script
# Follows the step-by-step manual deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Manual Contract Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY environment variable is not set${NC}"
    echo "Please set it with: export PRIVATE_KEY=\"your_private_key\""
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo -e "${YELLOW}⚠️  RPC_URL not set, using default: https://rpc.sepolia.mantle.xyz${NC}"
    export RPC_URL="https://rpc.sepolia.mantle.xyz"
fi

echo -e "${GREEN}✓ Using RPC URL: $RPC_URL${NC}"
echo ""

# Step 0: Build contracts
echo -e "${BLUE}🔨 Step 0: Building contracts...${NC}"
forge build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo ""

# Step 1: Deploy CredentialRegistry
echo -e "${BLUE}🔨 Step 1: Deploying CredentialRegistry...${NC}"
echo "Running: forge create --rpc-url $RPC_URL --private-key \$PRIVATE_KEY --broadcast src/CredentialRegistry.sol:CredentialRegistry"
echo ""

CREDENTIAL_REGISTRY_OUTPUT=$(forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  src/CredentialRegistry.sol:CredentialRegistry 2>&1)

echo "$CREDENTIAL_REGISTRY_OUTPUT"
echo ""

# Try to extract address automatically (compatible with both GNU and BSD grep)
REGISTRY_ADDRESS=$(echo "$CREDENTIAL_REGISTRY_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$REGISTRY_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically extract CredentialRegistry address${NC}"
    echo -e "${YELLOW}Please copy the deployed address from the output above and enter it:${NC}"
    read -p "CredentialRegistry address: " REGISTRY_ADDRESS
else
    echo -e "${GREEN}✅ CredentialRegistry deployed to: $REGISTRY_ADDRESS${NC}"
fi

export REGISTRY_ADDRESS
echo ""
echo -e "${GREEN}📝 CredentialRegistry Address: $REGISTRY_ADDRESS${NC}"
echo ""

# Step 2: Deploy ZKVerifier
echo -e "${BLUE}🔨 Step 2: Deploying ZKVerifier...${NC}"
echo "Running: forge create --rpc-url $RPC_URL --private-key \$PRIVATE_KEY --broadcast src/ZKVerifier.sol:ZKVerifier"
echo ""

ZKVERIFIER_OUTPUT=$(forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  src/ZKVerifier.sol:ZKVerifier 2>&1)

echo "$ZKVERIFIER_OUTPUT"
echo ""

# Try to extract address automatically (compatible with both GNU and BSD grep)
VERIFIER_ADDRESS=$(echo "$ZKVERIFIER_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$VERIFIER_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically extract ZKVerifier address${NC}"
    echo -e "${YELLOW}Please copy the deployed address from the output above and enter it:${NC}"
    read -p "ZKVerifier address: " VERIFIER_ADDRESS
else
    echo -e "${GREEN}✅ ZKVerifier deployed to: $VERIFIER_ADDRESS${NC}"
fi

export VERIFIER_ADDRESS
echo ""
echo -e "${GREEN}📝 ZKVerifier Address: $VERIFIER_ADDRESS${NC}"
echo ""

# Step 3: Deploy ProtocolAccessControl
echo -e "${BLUE}🔨 Step 3: Deploying ProtocolAccessControl...${NC}"
echo "Using:"
echo "  - ZKVerifier: $VERIFIER_ADDRESS"
echo "  - CredentialRegistry: $REGISTRY_ADDRESS"
echo ""
echo "Running: forge create src/ProtocolAccessControl.sol:ProtocolAccessControl --rpc-url $RPC_URL --private-key \$PRIVATE_KEY --broadcast --constructor-args $VERIFIER_ADDRESS $REGISTRY_ADDRESS"
echo ""

PROTOCOL_OUTPUT=$(forge create src/ProtocolAccessControl.sol:ProtocolAccessControl \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --constructor-args $VERIFIER_ADDRESS $REGISTRY_ADDRESS 2>&1)

echo "$PROTOCOL_OUTPUT"
echo ""

# Try to extract address automatically (compatible with both GNU and BSD grep)
PROTOCOL_ADDRESS=$(echo "$PROTOCOL_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$PROTOCOL_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically extract ProtocolAccessControl address${NC}"
    echo -e "${YELLOW}Please copy the deployed address from the output above and enter it:${NC}"
    read -p "ProtocolAccessControl address: " PROTOCOL_ADDRESS
else
    echo -e "${GREEN}✅ ProtocolAccessControl deployed to: $PROTOCOL_ADDRESS${NC}"
fi

echo ""
echo -e "${GREEN}📝 ProtocolAccessControl Address: $PROTOCOL_ADDRESS${NC}"
echo ""

# Update deployments.json
echo -e "${BLUE}📝 Updating deployments.json...${NC}"
cat > deployments.json <<EOF
{
  "network": "mantle-sepolia",
  "chainId": 5003,
  "contracts": {
    "CredentialRegistry": "$REGISTRY_ADDRESS",
    "ZKVerifier": "$VERIFIER_ADDRESS",
    "ProtocolAccessControl": "$PROTOCOL_ADDRESS"
  }
}
EOF

echo -e "${GREEN}✅ deployments.json updated!${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Contract addresses:"
echo -e "  ${BLUE}CredentialRegistry:${NC}    $REGISTRY_ADDRESS"
echo -e "  ${BLUE}ZKVerifier:${NC}             $VERIFIER_ADDRESS"
echo -e "  ${BLUE}ProtocolAccessControl:${NC} $PROTOCOL_ADDRESS"
echo ""
echo "Environment variables for future use:"
echo "  export REGISTRY_ADDRESS=\"$REGISTRY_ADDRESS\""
echo "  export VERIFIER_ADDRESS=\"$VERIFIER_ADDRESS\""
echo "  export PROTOCOL_ADDRESS=\"$PROTOCOL_ADDRESS\""
echo ""

