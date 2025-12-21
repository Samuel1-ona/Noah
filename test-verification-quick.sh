#!/bin/bash

set -e

echo "🔍 Quick Verification Test"
echo "=========================="
echo ""

cd "$(dirname "$0")"

# Load addresses
PROTOCOL_ADDRESS=$(jq -r '.contracts.ProtocolAccessControl' deployments.json)
ZKVERIFIER_ADDRESS=$(jq -r '.contracts.ZKVerifier' deployments.json)

echo "Protocol Address: $PROTOCOL_ADDRESS"
echo "ZKVerifier Address: $ZKVERIFIER_ADDRESS"
echo ""

# Generate a fresh proof
echo "📋 Generating fresh proof..."
TEST_INPUT='{
  "actualAge": 28,
  "actualJurisdiction": 1234567890,
  "actualAccredited": 1,
  "credentialHash": 9876543210,
  "minAge": 18,
  "allowedJurisdictions": [1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0],
  "requireAccredited": 1,
  "credentialHashPublic": 9876543210
}'

echo "$TEST_INPUT" > build/test-input-quick.json
./prove build/test-input-quick.json

echo ""
echo "📋 Reading proof..."
PROOF_DATA=$(cat build/proof.json)
PROOF=$(echo "$PROOF_DATA" | jq -c '.proof')
PUBLIC_INPUTS=$(echo "$PROOF_DATA" | jq -c '.publicInputs')

echo "Proof generated. Public inputs: $PUBLIC_INPUTS"
echo ""

# Format proof for API
A=$(echo "$PROOF" | jq -c '[.Ar.X, .Ar.Y]')
B=$(echo "$PROOF" | jq -c '[[.Bs.X.A0, .Bs.X.A1], [.Bs.Y.A0, .Bs.Y.A1]]')
C=$(echo "$PROOF" | jq -c '[.Krs.X, .Krs.Y]')
PUBLIC_SIGNALS=$(echo "$PUBLIC_INPUTS" | jq -c '.')

echo "📋 Testing on-chain verification..."
echo "Calling /access/verify endpoint..."

RESPONSE=$(curl -s -X POST http://localhost:3003/access/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
    \"userAddress\": \"0xd5881AA749eEFd3Cb08d10f051aC776d664d0663\",
    \"credentialHash\": \"0x$(printf '%064x' 9876543210)\",
    \"proof\": {
      \"a\": $A,
      \"b\": $B,
      \"c\": $C
    },
    \"publicSignals\": $PUBLIC_SIGNALS,
    \"privateKey\": \"$PRIVATE_KEY\"
  }")

echo "Response: $RESPONSE"
echo ""

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Verification succeeded!"
    exit 0
else
    echo "❌ Verification failed"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

