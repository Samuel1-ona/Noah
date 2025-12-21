#!/bin/bash

set -e

echo "🔍 Full End-to-End Verification Test"
echo "====================================="
echo ""

cd "$(dirname "$0")"

# Load addresses
PROTOCOL_ADDRESS=$(jq -r '.contracts.ProtocolAccessControl' deployments.json)
CREDENTIAL_REGISTRY=$(jq -r '.contracts.CredentialRegistry' deployments.json)

# Use a simple credential hash
CREDENTIAL_HASH="0x$(printf '%064x' 9876543210)"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"

echo "Protocol: $PROTOCOL_ADDRESS"
echo "Registry: $CREDENTIAL_REGISTRY"
echo "Credential Hash: $CREDENTIAL_HASH"
echo ""

# Step 1: Check if credential is registered
echo "📋 Step 1: Checking credential status..."
CREDENTIAL_CHECK=$(curl -s "http://localhost:3001/credential/check/$CREDENTIAL_HASH")
IS_VALID=$(echo "$CREDENTIAL_CHECK" | jq -r '.isValid' 2>/dev/null || echo "false")

if [ "$IS_VALID" != "true" ]; then
    echo "⚠️  Credential not registered. Registering now..."
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/credential/register \
      -H "Content-Type: application/json" \
      -d "{
        \"credentialHash\": \"$CREDENTIAL_HASH\",
        \"userAddress\": \"$USER_ADDRESS\"
      }")
    
    if echo "$REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        echo "✅ Credential registered: $(echo "$REGISTER_RESPONSE" | jq -r '.transactionHash')"
    else
        echo "❌ Credential registration failed: $REGISTER_RESPONSE"
        exit 1
    fi
else
    echo "✅ Credential already registered"
fi
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
echo "$REQUIREMENTS_RESPONSE" | jq '.' 2>/dev/null || echo "$REQUIREMENTS_RESPONSE"
echo ""

# Step 3: Generate proof
echo "📋 Step 3: Generating proof..."
PROOF_RESPONSE=$(curl -s -X POST http://localhost:3004/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "{
    \"credential\": {
      \"credentialHash\": \"$CREDENTIAL_HASH\",
      \"userAddress\": \"$USER_ADDRESS\",
      \"age\": 28,
      \"jurisdiction\": 1234567890,
      \"accredited\": true
    },
    \"requirements\": {
      \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
      \"minAge\": 18,
      \"allowedJurisdictions\": [1234567890, 1111111111, 2222222222],
      \"requireAccredited\": true
    }
  }")

PROOF=$(echo "$PROOF_RESPONSE" | jq -c '.proof' 2>/dev/null)
PUBLIC_SIGNALS=$(echo "$PROOF_RESPONSE" | jq -c '.proof.publicSignals' 2>/dev/null)

if [ -z "$PROOF" ] || [ "$PROOF" = "null" ]; then
    echo "❌ Proof generation failed: $PROOF_RESPONSE"
    exit 1
fi

echo "✅ Proof generated"
echo ""

# Step 4: Verify proof
echo "📋 Step 4: Verifying proof on-chain..."
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3003/access/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
    \"userAddress\": \"$USER_ADDRESS\",
    \"credentialHash\": \"$CREDENTIAL_HASH\",
    \"proof\": $PROOF,
    \"publicSignals\": $PUBLIC_SIGNALS,
    \"privateKey\": \"$PRIVATE_KEY\"
  }")

echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

if echo "$VERIFY_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅✅✅ VERIFICATION SUCCEEDED ✅✅✅"
    echo "Transaction: $(echo "$VERIFY_RESPONSE" | jq -r '.transactionHash')"
    exit 0
else
    ERROR=$(echo "$VERIFY_RESPONSE" | jq -r '.error // .message // "Unknown error"' 2>/dev/null || echo "$VERIFY_RESPONSE")
    echo "❌ Verification failed: $ERROR"
    exit 1
fi

