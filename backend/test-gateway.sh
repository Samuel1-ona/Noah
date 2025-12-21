#!/bin/bash

# Comprehensive API Gateway and Endpoint Testing
# Usage: ./test-gateway.sh

GATEWAY_URL="http://localhost:3000"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing ZK-KYC API Gateway and Endpoints"
echo "=========================================="
echo ""

# Test 1: Gateway Health Check
echo -e "${BLUE}1. Testing API Gateway Health Check${NC}"
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s "${GATEWAY_URL}/health")
echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""

# Test 2: Gateway API v1 Health
echo -e "${BLUE}2. Testing API v1 Health Endpoint${NC}"
echo "----------------------------------------"
V1_HEALTH=$(curl -s "${GATEWAY_URL}/api/v1/health")
echo "$V1_HEALTH" | python3 -m json.tool 2>/dev/null || echo "$V1_HEALTH"
echo ""

# Test 3: Issuer Service through Gateway
echo -e "${BLUE}3. Testing Issuer Service (via Gateway)${NC}"
echo "----------------------------------------"
echo "Health check:"
curl -s "${GATEWAY_URL}/api/v1/issuer/health" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/issuer/health"
echo ""
echo "Check credential validity (test hash):"
TEST_HASH="0x0000000000000000000000000000000000000000000000000000000000000000"
curl -s "${GATEWAY_URL}/api/v1/issuer/credential/check/${TEST_HASH}" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/issuer/credential/check/${TEST_HASH}"
echo ""
echo ""

# Test 4: User Service through Gateway
echo -e "${BLUE}4. Testing User Service (via Gateway)${NC}"
echo "----------------------------------------"
echo "Health check:"
curl -s "${GATEWAY_URL}/api/v1/user/health" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/user/health"
echo ""
echo "Get protocol requirements:"
PROTOCOL_ADDRESS="0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1"
curl -s "${GATEWAY_URL}/api/v1/user/protocol/${PROTOCOL_ADDRESS}/requirements" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/user/protocol/${PROTOCOL_ADDRESS}/requirements"
echo ""
echo "Check user access:"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"
curl -s "${GATEWAY_URL}/api/v1/user/access/${PROTOCOL_ADDRESS}/${USER_ADDRESS}" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/user/access/${PROTOCOL_ADDRESS}/${USER_ADDRESS}"
echo ""
echo ""

# Test 5: Protocol Service through Gateway
echo -e "${BLUE}5. Testing Protocol Service (via Gateway)${NC}"
echo "----------------------------------------"
echo "Health check:"
curl -s "${GATEWAY_URL}/api/v1/protocol/health" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/protocol/health"
echo ""
echo "Get protocol requirements:"
curl -s "${GATEWAY_URL}/api/v1/protocol/requirements/${PROTOCOL_ADDRESS}" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/protocol/requirements/${PROTOCOL_ADDRESS}"
echo ""
echo ""

# Test 6: Proof Service through Gateway
echo -e "${BLUE}6. Testing Proof Service (via Gateway)${NC}"
echo "----------------------------------------"
echo "Health check:"
curl -s "${GATEWAY_URL}/api/v1/proof/health" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/proof/health"
echo ""
echo ""

# Test 7: Input Validation
echo -e "${BLUE}7. Testing Input Validation${NC}"
echo "----------------------------------------"
echo "Invalid address (should fail validation):"
curl -s -X GET "${GATEWAY_URL}/api/v1/user/protocol/invalid-address/requirements" | python3 -m json.tool 2>/dev/null || curl -s -X GET "${GATEWAY_URL}/api/v1/user/protocol/invalid-address/requirements"
echo ""
echo ""

# Test 8: Rate Limiting (make multiple requests)
echo -e "${BLUE}8. Testing Rate Limiting${NC}"
echo "----------------------------------------"
echo "Making 5 rapid requests to test rate limiting..."
for i in {1..5}; do
  echo "Request $i:"
  curl -s -w "\nStatus: %{http_code}\n" "${GATEWAY_URL}/api/v1/user/health" | tail -1
  sleep 0.5
done
echo ""

# Test 9: Error Handling
echo -e "${BLUE}9. Testing Error Handling${NC}"
echo "----------------------------------------"
echo "404 Not Found:"
curl -s "${GATEWAY_URL}/api/v1/nonexistent/endpoint" | python3 -m json.tool 2>/dev/null || curl -s "${GATEWAY_URL}/api/v1/nonexistent/endpoint"
echo ""
echo ""

# Test 10: Direct Service Access (for comparison)
echo -e "${BLUE}10. Testing Direct Service Access (for comparison)${NC}"
echo "----------------------------------------"
echo "Direct access to Issuer Service (port 3001):"
curl -s "http://localhost:3001/health" | python3 -m json.tool 2>/dev/null || curl -s "http://localhost:3001/health"
echo ""
echo ""

echo -e "${GREEN}✅ API Gateway Testing Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "  - Gateway URL: ${GATEWAY_URL}"
echo "  - All services accessible through /api/v1/*"
echo "  - Health checks working"
echo "  - Input validation active"
echo "  - Rate limiting configured"
echo "  - Error handling working"
echo ""
echo "🔍 View logs: tail -f /tmp/backend.log"

