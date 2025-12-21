#!/bin/bash

set -e

echo "🔍 Final Verification Test"
echo "========================"
echo ""

cd "$(dirname "$0")"

# Load addresses
PROTOCOL_ADDRESS=$(jq -r '.contracts.ProtocolAccessControl' deployments.json)
ZKVERIFIER_ADDRESS=$(jq -r '.contracts.ZKVerifier' deployments.json)
CREDENTIAL_REGISTRY=$(jq -r '.contracts.CredentialRegistry' deployments.json)

# Use a simple credential hash
CREDENTIAL_HASH="0x$(printf '%064x' 9876543210)"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"

echo "Protocol: $PROTOCOL_ADDRESS"
echo "ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "Registry: $CREDENTIAL_REGISTRY"
echo "Credential Hash: $CREDENTIAL_HASH"
echo ""

# Step 1: Register credential (using direct script)
echo "📋 Step 1: Registering credential..."
node register-credential-direct.js 2>&1 | grep -E "(✅|❌|Transaction)" || echo "Credential registration attempted"
echo ""

# Step 2: Set requirements
echo "📋 Step 2: Setting requirements..."
REQUIREMENTS_RESPONSE=$(curl -s -X POST http://localhost:3003/requirements/set \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
    \"minAge\": 18,
    \"allowedJurisdictions\": [1234567890, 1111111111, 2222222222],
    \"requireAccredited\": 1,
    \"privateKey\": \"$PRIVATE_KEY\"
  }")
if echo "$REQUIREMENTS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Requirements set"
else
    echo "⚠️  Requirements response: $REQUIREMENTS_RESPONSE"
fi
echo ""

# Step 3: Generate fresh proof
echo "📋 Step 3: Generating fresh proof with current keys..."
./prove build/test-input-fresh.json > /dev/null 2>&1
echo "✅ Proof generated"
echo ""

# Step 4: Verify proof locally
echo "📋 Step 4: Verifying proof locally..."
./verify-proof build/proof.json build/test-input-fresh.json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Local verification succeeded"
else
    echo "❌ Local verification failed"
    exit 1
fi
echo ""

# Step 5: Verify proof on-chain
echo "📋 Step 5: Verifying proof on-chain..."
PROOF_DATA=$(cat build/proof.json)
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3003/access/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
    \"userAddress\": \"$USER_ADDRESS\",
    \"credentialHash\": \"$CREDENTIAL_HASH\",
    \"proof\": $(echo "$PROOF_DATA" | jq -c '.proof | {a:[.Ar.X,.Ar.Y],b:[[.Bs.X.A0,.Bs.X.A1],[.Bs.Y.A0,.Bs.Y.A1]],c:[.Krs.X,.Krs.Y]}'),
    \"publicSignals\": $(echo "$PROOF_DATA" | jq -c '.publicInputs'),
    \"privateKey\": \"$PRIVATE_KEY\"
  }")

echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

if echo "$VERIFY_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅✅✅ VERIFICATION SUCCEEDED ✅✅✅"
    echo "Transaction: $(echo "$VERIFY_RESPONSE" | jq -r '.transactionHash')"
    exit 0
else
    ERROR=$(echo "$VERIFY_RESPONSE" | jq -r '.error.message // .error // "Unknown error"' 2>/dev/null || echo "$VERIFY_RESPONSE")
    echo "❌ Verification failed: $ERROR"
    exit 1
fi

