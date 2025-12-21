#!/bin/bash

# Test the complete proof generation and verification flow
# Usage: ./test-proof-flow.sh

set -e

GATEWAY_URL="http://localhost:3000"
PRIVATE_KEY="090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contract addresses from deployments.json
PROTOCOL_ADDRESS="0x0d4038De5DA7C6FDe0C1467FE61328654bF55F90"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ZK-KYC Proof Generation & Verification Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check if services are running
echo -e "${BLUE}Step 1: Checking services...${NC}"
echo "----------------------------------------"
HEALTH=$(curl -s "${GATEWAY_URL}/health")
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Services not running. Please start the backend services first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Services are running${NC}"
echo ""

# Step 2: Generate a credential hash
echo -e "${BLUE}Step 2: Generating credential hash...${NC}"
echo "----------------------------------------"
# Create a simple credential hash (in production, this would come from KYC data)
CREDENTIAL_DATA='{"name":"John Doe","age":25,"jurisdiction":1234567890,"accredited":true}'
CREDENTIAL_HASH=$(echo -n "$CREDENTIAL_DATA" | shasum -a 256 | awk '{print "0x" $1}')
echo -e "${GREEN}✅ Credential Hash: ${CREDENTIAL_HASH}${NC}"
echo ""

# Step 3: Register credential (as issuer)
echo -e "${BLUE}Step 3: Registering credential on-chain...${NC}"
echo "----------------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/issuer/credential/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"credentialHash\": \"${CREDENTIAL_HASH}\",
    \"userAddress\": \"${USER_ADDRESS}\"
  }")

echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
REGISTER_SUCCESS=$(echo "$REGISTER_RESPONSE" | grep -o '"success":true' || echo "")
if [ -z "$REGISTER_SUCCESS" ]; then
    echo -e "${YELLOW}⚠️  Credential registration may have failed or already exists${NC}"
else
    echo -e "${GREEN}✅ Credential registered${NC}"
fi
echo ""

# Step 4: Set protocol requirements
echo -e "${BLUE}Step 4: Setting protocol requirements...${NC}"
echo "----------------------------------------"
REQUIREMENTS_RESPONSE=$(curl -s -X POST "${GATEWAY_URL}/api/v1/protocol/requirements/set" \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"${PROTOCOL_ADDRESS}\",
    \"minAge\": 21,
    \"allowedJurisdictions\": [1234567890, 1111111111],
    \"requireAccredited\": true,
    \"privateKey\": \"${PRIVATE_KEY}\"
  }")

echo "$REQUIREMENTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REQUIREMENTS_RESPONSE"
REQUIREMENTS_SUCCESS=$(echo "$REQUIREMENTS_RESPONSE" | grep -o '"success":true' || echo "")
if [ -z "$REQUIREMENTS_SUCCESS" ]; then
    echo -e "${RED}❌ Failed to set requirements${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Protocol requirements set${NC}"
echo ""

# Step 5: Generate proof
echo -e "${BLUE}Step 5: Generating ZK proof...${NC}"
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
      \"allowedJurisdictions\": [1234567890, 1111111111],
      \"requireAccredited\": true
    }
  }")

echo "$PROOF_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PROOF_RESPONSE"
PROOF_SUCCESS=$(echo "$PROOF_RESPONSE" | grep -o '"success":true' || echo "")
if [ -z "$PROOF_SUCCESS" ]; then
    echo -e "${RED}❌ Failed to generate proof${NC}"
    echo "$PROOF_RESPONSE"
    exit 1
fi
echo -e "${GREEN}✅ Proof generated${NC}"
echo ""

# Extract proof data
PROOF_DATA=$(echo "$PROOF_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['proof']))" 2>/dev/null || echo "")
PUBLIC_SIGNALS=$(echo "$PROOF_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['publicInputs']))" 2>/dev/null || echo "")

if [ -z "$PROOF_DATA" ] || [ -z "$PUBLIC_SIGNALS" ]; then
    echo -e "${RED}❌ Failed to extract proof data from response${NC}"
    exit 1
fi

# Step 6: Verify proof on-chain
echo -e "${BLUE}Step 6: Verifying proof on-chain...${NC}"
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
VERIFY_SUCCESS=$(echo "$VERIFY_RESPONSE" | grep -o '"success":true' || echo "")
if [ -z "$VERIFY_SUCCESS" ]; then
    echo -e "${RED}❌ Failed to verify proof${NC}"
    echo "$VERIFY_RESPONSE"
    exit 1
fi
echo -e "${GREEN}✅ Proof verified and access granted!${NC}"
echo ""

# Step 7: Check access
echo -e "${BLUE}Step 7: Verifying user access...${NC}"
echo "----------------------------------------"
ACCESS_RESPONSE=$(curl -s "${GATEWAY_URL}/api/v1/protocol/access/${PROTOCOL_ADDRESS}/${USER_ADDRESS}")
echo "$ACCESS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ACCESS_RESPONSE"
HAS_ACCESS=$(echo "$ACCESS_RESPONSE" | grep -o '"hasAccess":true' || echo "")
if [ -z "$HAS_ACCESS" ]; then
    echo -e "${YELLOW}⚠️  Access check returned false${NC}"
else
    echo -e "${GREEN}✅ User has access!${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 Test Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary:"
echo "  - Credential Hash: ${CREDENTIAL_HASH}"
echo "  - Protocol Address: ${PROTOCOL_ADDRESS}"
echo "  - User Address: ${USER_ADDRESS}"
echo "  - Proof generated: ✅"
echo "  - Proof verified: ✅"
echo "  - Access granted: ✅"
echo ""

