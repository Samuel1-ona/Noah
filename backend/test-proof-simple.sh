#!/bin/bash

# Simple proof generation and verification test
# Make sure backend services are running before executing this

GATEWAY_URL="http://localhost:3000"
PRIVATE_KEY="090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
PROTOCOL_ADDRESS="0x0d4038De5DA7C6FDe0C1467FE61328654bF55F90"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"

echo "🧪 Testing Proof Generation and Verification"
echo "=============================================="
echo ""

# Generate credential hash
CREDENTIAL_DATA='{"name":"Test User","age":25,"jurisdiction":1234567890,"accredited":true}'
CREDENTIAL_HASH=$(echo -n "$CREDENTIAL_DATA" | shasum -a 256 | awk '{print "0x" $1}')
echo "📝 Credential Hash: $CREDENTIAL_HASH"
echo ""

# Step 1: Register credential
echo "1️⃣  Registering credential..."
REGISTER_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/issuer/credential/register" \
  -H "Content-Type: application/json" \
  -d "{\"credentialHash\": \"${CREDENTIAL_HASH}\", \"userAddress\": \"${USER_ADDRESS}\"}")
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Step 2: Set requirements
echo "2️⃣  Setting protocol requirements..."
REQUIREMENTS_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/protocol/requirements/set" \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"${PROTOCOL_ADDRESS}\",
    \"minAge\": 21,
    \"allowedJurisdictions\": [1234567890],
    \"requireAccredited\": true,
    \"privateKey\": \"${PRIVATE_KEY}\"
  }")
echo "$REQUIREMENTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REQUIREMENTS_RESPONSE"
echo ""

# Step 3: Generate proof
echo "3️⃣  Generating ZK proof..."
PROOF_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/proof/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"credential\": {
      \"credentialHash\": \"${CREDENTIAL_HASH}\",
      \"userAddress\": \"${USER_ADDRESS}\",
      \"age\": 25,
      \"jurisdiction\": 1234567890,
      \"accredited\": true
    },
    \"requirements\": {
      \"protocolAddress\": \"${PROTOCOL_ADDRESS}\",
      \"minAge\": 21,
      \"allowedJurisdictions\": [1234567890],
      \"requireAccredited\": true
    }
  }")
echo "$PROOF_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PROOF_RESPONSE"
echo ""

# Check if proof generation succeeded
if echo "$PROOF_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Proof generated successfully!"
    
    # Extract proof data
    PROOF_DATA=$(echo "$PROOF_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['proof']))" 2>/dev/null)
    PUBLIC_SIGNALS=$(echo "$PROOF_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['publicInputs']))" 2>/dev/null)
    
    if [ -n "$PROOF_DATA" ] && [ -n "$PUBLIC_SIGNALS" ]; then
        echo ""
        echo "4️⃣  Verifying proof on-chain..."
        VERIFY_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/protocol/access/verify" \
          -H "Content-Type: application/json" \
          -d "{
            \"protocolAddress\": \"${PROTOCOL_ADDRESS}\",
            \"userAddress\": \"${USER_ADDRESS}\",
            \"credentialHash\": \"${CREDENTIAL_HASH}\",
            \"proof\": ${PROOF_DATA},
            \"publicSignals\": ${PUBLIC_SIGNALS},
            \"privateKey\": \"${PRIVATE_KEY}\"
          }")
        echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
        
        if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
            echo ""
            echo "🎉 SUCCESS! Proof verified and access granted!"
        else
            echo ""
            echo "❌ Proof verification failed"
        fi
    fi
else
    echo "❌ Proof generation failed"
fi

