#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing ZK-KYC API${NC}\n"

BASE_URL="http://localhost:3000"

# Test 1: Set Protocol Requirements
echo -e "${GREEN}1. Setting Protocol Requirements...${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/protocol/requirements/set \
  -H "Content-Type: application/json" \
  -d '{
    "protocolAddress": "0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1",
    "minAge": 21,
    "allowedJurisdictions": [1234567890],
    "requireAccredited": true,
    "privateKey": "090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Get Protocol Requirements
echo -e "${GREEN}2. Getting Protocol Requirements...${NC}"
curl -s -X GET ${BASE_URL}/api/v1/user/protocol/0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1/requirements | jq '.' 2>/dev/null || curl -s -X GET ${BASE_URL}/api/v1/user/protocol/0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1/requirements
echo ""

# Test 3: Health Check
echo -e "${GREEN}3. Health Check...${NC}"
curl -s -X GET ${BASE_URL}/health | jq '.' 2>/dev/null || curl -s -X GET ${BASE_URL}/health
echo ""

echo -e "${GREEN}✅ Tests complete!${NC}"
