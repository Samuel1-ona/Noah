#!/bin/bash

# Redeploy ZK-KYC contracts with fixed ZKVerifier
# This script redeploys ZKVerifier and ProtocolAccessControl

set -e

export PRIVATE_KEY="090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
export RPC_URL="https://rpc.sepolia.mantle.xyz"

echo "🔨 Step 1: Deploying ZKVerifier contract..."
ZKVERIFIER_OUTPUT=$(forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast src/ZKVerifier.sol:ZKVerifier 2>&1)
ZKVERIFIER_ADDRESS=$(echo "$ZKVERIFIER_OUTPUT" | grep -oP "Deployed to: \K0x[a-fA-F0-9]{40}" || echo "")

if [ -z "$ZKVERIFIER_ADDRESS" ]; then
    echo "❌ Failed to extract ZKVerifier address"
    echo "$ZKVERIFIER_OUTPUT"
    exit 1
fi

echo "✅ ZKVerifier deployed to: $ZKVERIFIER_ADDRESS"
echo ""

export REGISTRY_ADDRESS="0x5B005bC07121C9bbcD640da44a94Fa80dBf0Cc19"
echo "🔨 Step 2: Deploying ProtocolAccessControl contract..."
echo "   Using ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "   Using CredentialRegistry: $REGISTRY_ADDRESS"
echo ""

PROTOCOL_OUTPUT=$(forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --constructor-args $ZKVERIFIER_ADDRESS $REGISTRY_ADDRESS src/ProtocolAccessControl.sol:ProtocolAccessControl 2>&1)
PROTOCOL_ADDRESS=$(echo "$PROTOCOL_OUTPUT" | grep -oP "Deployed to: \K0x[a-fA-F0-9]{40}" || echo "")

if [ -z "$PROTOCOL_ADDRESS" ]; then
    echo "❌ Failed to extract ProtocolAccessControl address"
    echo "$PROTOCOL_OUTPUT"
    exit 1
fi

echo "✅ ProtocolAccessControl deployed to: $PROTOCOL_ADDRESS"
echo ""

echo "📝 Updating deployments.json..."
cat > deployments.json <<EOF
{
  "network": "mantle-sepolia",
  "chainId": 5003,
  "deployer": "0xd5881AA749eEFd3Cb08d10f051aC776d664d0663",
  "contracts": {
    "CredentialRegistry": "$REGISTRY_ADDRESS",
    "ZKVerifier": "$ZKVERIFIER_ADDRESS",
    "ProtocolAccessControl": "$PROTOCOL_ADDRESS"
  }
}
EOF

echo "✅ deployments.json updated!"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Contract addresses:"
echo "  CredentialRegistry: $REGISTRY_ADDRESS"
echo "  ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "  ProtocolAccessControl: $PROTOCOL_ADDRESS"

