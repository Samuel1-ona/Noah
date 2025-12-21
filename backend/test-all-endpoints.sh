#!/bin/bash

# Comprehensive API Testing Script for ZK-KYC System
# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
PROTOCOL_ADDRESS="0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"
PRIVATE_KEY="090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
TEST_CREDENTIAL_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   ZK-KYC API Comprehensive Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Helper function to print test results
print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}\n"
}

print_error() {
    echo -e "${RED}✗ $1${NC}\n"
}

# Test 1: Health Check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "1. Health Check (Gateway)"
RESPONSE=$(curl -s -X GET ${BASE_URL}/health)
if echo "$RESPONSE" | grep -q "status"; then
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    print_success "Health check passed"
else
    print_error "Health check failed"
fi

# Test 2: Get Protocol Requirements (before setting)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "2. Get Protocol Requirements (Current State)"
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/v1/user/protocol/${PROTOCOL_ADDRESS}/requirements)
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Set Protocol Requirements
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "3. Set Protocol Requirements"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/protocol/requirements/set \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"${PROTOCOL_ADDRESS}\",
    \"minAge\": 21,
    \"allowedJurisdictions\": [1234567890, 1111111111],
    \"requireAccredited\": true,
    \"privateKey\": \"${PRIVATE_KEY}\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    TX_HASH=$(echo "$RESPONSE" | jq -r '.transactionHash' 2>/dev/null)
    if [ "$TX_HASH" != "null" ] && [ -n "$TX_HASH" ]; then
        print_success "Requirements set successfully! TX: ${TX_HASH}"
    else
        print_success "Requirements set successfully!"
    fi
else
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    print_error "Failed to set requirements"
fi

# Test 4: Get Protocol Requirements (after setting)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "4. Get Protocol Requirements (After Setting)"
sleep 2  # Wait for transaction to be mined
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/v1/user/protocol/${PROTOCOL_ADDRESS}/requirements)
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "\"minAge\": \"21\""; then
    print_success "Requirements retrieved successfully"
else
    print_error "Requirements not updated yet (may need to wait for block confirmation)"
fi

# Test 5: Check Credential Validity (non-existent)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "5. Check Credential Validity (Non-existent)"
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/v1/issuer/credential/check/${TEST_CREDENTIAL_HASH})
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "\"isValid\": false"; then
    print_success "Correctly identified invalid credential"
else
    echo ""
fi

# Test 6: Check User Access (before granting)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "6. Check User Access (Before Granting)"
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/v1/user/access/${PROTOCOL_ADDRESS}/${USER_ADDRESS})
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "\"hasAccess\": false"; then
    print_success "Correctly shows no access"
else
    echo ""
fi

# Test 7: Get Protocol Access Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "7. Get Protocol Access Status"
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/v1/protocol/access/${PROTOCOL_ADDRESS}/${USER_ADDRESS})
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 8: Service Health Checks
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "8. Individual Service Health Checks"

echo -n "  Issuer Service: "
curl -s ${BASE_URL}/api/v1/issuer/health | jq -r '.status' 2>/dev/null || echo "unknown"

echo -n "  User Service: "
curl -s ${BASE_URL}/api/v1/user/health | jq -r '.status' 2>/dev/null || echo "unknown"

echo -n "  Protocol Service: "
curl -s ${BASE_URL}/api/v1/protocol/health | jq -r '.status' 2>/dev/null || echo "unknown"

echo -n "  Proof Service: "
curl -s ${BASE_URL}/api/v1/proof/health | jq -r '.status' 2>/dev/null || echo "unknown"
echo ""

# Test 9: Test with different protocol address (should fail validation)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "9. Input Validation Test (Invalid Address)"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/protocol/requirements/set \
  -H "Content-Type: application/json" \
  -d '{
    "protocolAddress": "invalid-address",
    "minAge": 21,
    "allowedJurisdictions": [1234567890],
    "requireAccredited": true,
    "privateKey": "'${PRIVATE_KEY}'"
  }')

if echo "$RESPONSE" | grep -q "validationErrors\|Validation failed"; then
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    print_success "Validation correctly rejected invalid address"
else
    print_error "Validation should have failed"
fi

# Test 10: Test with invalid age
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_test "10. Input Validation Test (Invalid Age)"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/protocol/requirements/set \
  -H "Content-Type: application/json" \
  -d "{
    \"protocolAddress\": \"${PROTOCOL_ADDRESS}\",
    \"minAge\": 200,
    \"allowedJurisdictions\": [1234567890],
    \"requireAccredited\": true,
    \"privateKey\": \"${PRIVATE_KEY}\"
  }")

if echo "$RESPONSE" | grep -q "validationErrors\|Validation failed"; then
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    print_success "Validation correctly rejected invalid age"
else
    print_error "Validation should have failed"
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Test Suite Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Note:${NC} Some tests require blockchain transactions which may take time."
echo -e "      Check transaction status on: https://explorer.sepolia.mantle.xyz\n"

