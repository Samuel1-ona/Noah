#!/bin/bash

# Full ZK-KYC Flow Test Script
# Make sure backend is running: npm start

BASE_URL="http://localhost:3000/api/v1"
PROTOCOL_ADDRESS="0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"
CREDENTIAL_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

echo "🚀 Testing Full ZK-KYC Flow"
echo "================================"
echo ""

# Step 1: Set Protocol Requirements
echo "📋 Step 1: Setting protocol requirements..."
curl -X POST "$BASE_URL/protocol/requirements/set" \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
    \"minAge\": 21,
    \"allowedJurisdictions\": [1234567890],
    \"requireAccredited\": true
  }" | jq '.'
echo ""
echo ""

# Step 2: Register Credential
echo "📝 Step 2: Registering credential..."
curl -X POST "$BASE_URL/issuer/credential/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"credentialHash\": \"$CREDENTIAL_HASH\",
    \"userAddress\": \"$USER_ADDRESS\"
  }" | jq '.'
echo ""
echo ""

# Step 3: Generate Proof
echo "🔐 Step 3: Generating ZK proof..."
PROOF_RESPONSE=$(curl -s -X POST "$BASE_URL/proof/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"credential\": {
      \"credentialHash\": \"$CREDENTIAL_HASH\",
      \"age\": 25,
      \"jurisdiction\": 1234567890,
      \"accredited\": true,
      \"userAddress\": \"$USER_ADDRESS\"
    },
    \"requirements\": {
      \"protocolAddress\": \"$PROTOCOL_ADDRESS\",
      \"minAge\": 21,
      \"allowedJurisdictions\": [1234567890],
      \"requireAccredited\": true
    }
  }")

echo "$PROOF_RESPONSE" | jq '.'
echo ""

# Extract proof from response
PROOF=$(echo "$PROOF_RESPONSE" | jq -c '.proof')
PUBLIC_SIGNALS=$(echo "$PROOF_RESPONSE" | jq -c '.proof.publicSignals // []')

if [ "$PROOF" = "null" ] || [ -z "$PROOF" ]; then
  echo "❌ Failed to generate proof!"
  exit 1
fi

echo "✅ Proof generated successfully!"
echo "   - Proof structure: $(echo "$PROOF_RESPONSE" | jq -c '.proof | keys')"
echo "   - Public signals count: $(echo "$PUBLIC_SIGNALS" | jq 'length')"
echo "   - Public signals[12] (credentialHash): $(echo "$PUBLIC_SIGNALS" | jq -r '.[12] // "missing"')"
echo ""

# Step 4: Verify and Grant Access
echo "✅ Step 4: Verifying proof and granting access..."
# The proof object already contains publicSignals, so we can send it directly
# The endpoint will extract publicSignals from proof.publicSignals if needed
VERIFY_PAYLOAD=$(echo "$PROOF_RESPONSE" | jq -c '{
  protocolAddress: "'$PROTOCOL_ADDRESS'",
  userAddress: "'$USER_ADDRESS'",
  credentialHash: .credentialHash,
  proof: .proof,
  publicSignals: .proof.publicSignals
}')

echo "📤 Sending verify request with payload:"
echo "$VERIFY_PAYLOAD" | jq '.'
echo ""

curl -X POST "$BASE_URL/protocol/access/verify" \
  -H "Content-Type: application/json" \
  -d "$VERIFY_PAYLOAD" | jq '.'
echo ""
echo ""

# Step 5: Check Access
echo "🔍 Step 5: Checking access status..."
curl -X GET "$BASE_URL/user/access/$PROTOCOL_ADDRESS/$USER_ADDRESS" | jq '.'
echo ""
echo ""

echo "✅ Flow complete!"

