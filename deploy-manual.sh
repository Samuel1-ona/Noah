#!/bin/bash

# Manual deployment script based on user's commands
# Usage: Run: ./deploy-manual.sh
# Will load PRIVATE_KEY from .env file if it exists

set -e

# Load .env file if it exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
    echo "✅ .env file loaded"
fi

# Setup
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    echo "   Please set it in .env file or export it:"
    echo "   export PRIVATE_KEY=\"your_private_key_here\""
    exit 1
fi

export RPC_URL="${RPC_URL:-https://rpc.sepolia.mantle.xyz}"

echo "🔧 Manual Contract Deployment"
echo "=============================="
echo "RPC URL: $RPC_URL"
echo ""

# Build
echo "📋 Building contracts..."
forge build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Step 1: Deploy CredentialRegistry
echo "📋 Step 1: Deploying CredentialRegistry..."
CREDENTIAL_REGISTRY_OUTPUT=$(forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  src/CredentialRegistry.sol:CredentialRegistry 2>&1)

echo "$CREDENTIAL_REGISTRY_OUTPUT"
echo ""

# Extract address
REGISTRY_ADDRESS=$(echo "$CREDENTIAL_REGISTRY_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$REGISTRY_ADDRESS" ]; then
    echo "❌ Failed to extract CredentialRegistry address"
    echo "Please copy the address from the output above and set:"
    echo "  export REGISTRY_ADDRESS=\"0x...\""
    exit 1
fi

export REGISTRY_ADDRESS
echo "✅ CredentialRegistry deployed to: $REGISTRY_ADDRESS"
echo ""

# Step 2: Deploy ZKVerifier
echo "📋 Step 2: Deploying ZKVerifier..."
ZKVERIFIER_OUTPUT=$(forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  src/ZKVerifier.sol:ZKVerifier 2>&1)

echo "$ZKVERIFIER_OUTPUT"
echo ""

# Extract address
VERIFIER_ADDRESS=$(echo "$ZKVERIFIER_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$VERIFIER_ADDRESS" ]; then
    echo "❌ Failed to extract ZKVerifier address"
    echo "Please copy the address from the output above and set:"
    echo "  export VERIFIER_ADDRESS=\"0x...\""
    exit 1
fi

export VERIFIER_ADDRESS
echo "✅ ZKVerifier deployed to: $VERIFIER_ADDRESS"
echo ""

# Step 3: Deploy ProtocolAccessControl
echo "📋 Step 3: Deploying ProtocolAccessControl..."
echo "  Using ZKVerifier: $VERIFIER_ADDRESS"
echo "  Using CredentialRegistry: $REGISTRY_ADDRESS"
echo ""

PROTOCOL_OUTPUT=$(forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  --constructor-args $VERIFIER_ADDRESS $REGISTRY_ADDRESS \
  src/ProtocolAccessControl.sol:ProtocolAccessControl 2>&1)

echo "$PROTOCOL_OUTPUT"
echo ""

# Extract address
PROTOCOL_ADDRESS=$(echo "$PROTOCOL_OUTPUT" | grep "Deployed to:" | sed -E 's/.*Deployed to: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$PROTOCOL_ADDRESS" ]; then
    echo "❌ Failed to extract ProtocolAccessControl address"
    echo "Please copy the address from the output above"
    exit 1
fi

echo "✅ ProtocolAccessControl deployed to: $PROTOCOL_ADDRESS"
echo ""

# Extract transaction hashes
REGISTRY_TX=$(echo "$CREDENTIAL_REGISTRY_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/' || echo "")
VERIFIER_TX=$(echo "$ZKVERIFIER_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/' || echo "")
PROTOCOL_TX=$(echo "$PROTOCOL_OUTPUT" | grep "Transaction hash:" | sed -E 's/.*Transaction hash: (0x[a-fA-F0-9]{64}).*/\1/' || echo "")

# Update deployments.json
echo "📋 Updating deployments.json..."
cat > deployments.json <<EOF
{
  "network": "mantle-sepolia",
  "chainId": 5003,
  "deployer": "0xd5881AA749eEFd3Cb08d10f051aC776d664d0663",
  "contracts": {
    "CredentialRegistry": "$REGISTRY_ADDRESS",
    "ZKVerifier": "$VERIFIER_ADDRESS",
    "ProtocolAccessControl": "$PROTOCOL_ADDRESS"
  },
  "transactions": {
    "CredentialRegistry": "$REGISTRY_TX",
    "ZKVerifier": "$VERIFIER_TX",
    "ProtocolAccessControl": "$PROTOCOL_TX"
  }
}
EOF

echo "✅ deployments.json updated"
echo ""

echo "✅✅✅ Deployment Complete ✅✅✅"
echo ""
echo "📊 Summary:"
echo "  CredentialRegistry: $REGISTRY_ADDRESS"
echo "  ZKVerifier: $VERIFIER_ADDRESS"
echo "  ProtocolAccessControl: $PROTOCOL_ADDRESS"
echo ""
echo "⚠️  IMPORTANT: Restart backend services to load the new contract addresses"

