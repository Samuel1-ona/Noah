#!/bin/bash

# Complete proof generation and verification test
# This script does everything in one go to avoid rate limits

set -e

GATEWAY_URL="http://localhost:3000"
PRIVATE_KEY="090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
# Load from deployments.json
PROTOCOL_ADDRESS=$(cd "$(dirname "$0")/.." && jq -r '.contracts.ProtocolAccessControl' deployments.json)
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Complete Proof Generation & Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Generate a unique credential hash using timestamp
TIMESTAMP=$(date +%s)
CREDENTIAL_DATA="{\"name\":\"Test User\",\"age\":25,\"jurisdiction\":1234567890,\"accredited\":true,\"timestamp\":${TIMESTAMP}}"
CREDENTIAL_HASH=$(echo -n "$CREDENTIAL_DATA" | shasum -a 256 | awk '{print "0x" $1}')

echo -e "${BLUE}Step 1: Registering Credential${NC}"
echo "----------------------------------------"
echo "Credential Hash: ${CREDENTIAL_HASH}"
REGISTER_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/issuer/credential/register" \
  -H "Content-Type: application/json" \
  -d "{\"credentialHash\": \"${CREDENTIAL_HASH}\", \"userAddress\": \"${USER_ADDRESS}\"}")
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Credential registered${NC}"
else
    echo -e "${YELLOW}⚠️  Credential may already exist${NC}"
fi
echo ""

echo -e "${BLUE}Step 2: Setting Protocol Requirements${NC}"
echo "----------------------------------------"
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
if echo "$REQUIREMENTS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Requirements set${NC}"
else
    echo -e "${YELLOW}⚠️  Requirements may already be set${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Generating ZK Proof${NC}"
echo "----------------------------------------"
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

if echo "$PROOF_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Proof generated successfully!${NC}"
    echo ""
    
    # Extract proof components
    # The proof object contains a, b, c, and publicSignals
    PROOF_DATA=$(echo "$PROOF_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); proof=data['proof']; print(json.dumps({'a': proof['a'], 'b': proof['b'], 'c': proof['c']}))" 2>/dev/null)
    # Extract publicSignals from the proof object
    PUBLIC_SIGNALS=$(echo "$PROOF_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['proof']['publicSignals']))" 2>/dev/null)
    
    if [ -n "$PROOF_DATA" ] && [ -n "$PUBLIC_SIGNALS" ]; then
        echo -e "${BLUE}Step 4: Verifying Proof On-Chain${NC}"
        echo "----------------------------------------"
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
            echo -e "${GREEN}✅ Proof verified and access granted!${NC}"
            echo ""
            
            # Check access
            echo -e "${BLUE}Step 5: Verifying User Access${NC}"
            echo "----------------------------------------"
            ACCESS_RESPONSE=$(curl -s "${GATEWAY_URL}/api/v1/protocol/access/${PROTOCOL_ADDRESS}/${USER_ADDRESS}")
            echo "$ACCESS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ACCESS_RESPONSE"
            
            if echo "$ACCESS_RESPONSE" | grep -q '"hasAccess":true'; then
                echo ""
                echo -e "${GREEN}========================================${NC}"
                echo -e "${GREEN}  🎉 SUCCESS! Complete Flow Verified!${NC}"
                echo -e "${GREEN}========================================${NC}"
                echo ""
                echo "Summary:"
                echo "  ✅ Credential registered"
                echo "  ✅ Protocol requirements set"
                echo "  ✅ ZK proof generated"
                echo "  ✅ Proof verified on-chain"
                echo "  ✅ User access granted"
                echo ""
            else
                echo -e "${YELLOW}⚠️  Access check returned false${NC}"
            fi
        else
            echo -e "${RED}❌ Proof verification failed${NC}"
            echo "$VERIFY_RESPONSE"
        fi
    else
        echo -e "${RED}❌ Failed to extract proof data${NC}"
    fi
else
    echo -e "${RED}❌ Proof generation failed${NC}"
    echo "$PROOF_RESPONSE"
    exit 1
fi

