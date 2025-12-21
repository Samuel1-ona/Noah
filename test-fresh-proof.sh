#!/bin/bash

set -e

echo "🔍 Testing Fresh Proof Generation and Verification"
echo "===================================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate fresh proof with current keys
echo "📋 Step 1: Generating fresh proof with current keys..."
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

echo "$TEST_INPUT" > build/test-input-fresh.json
./prove build/test-input-fresh.json

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Proof generation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Proof generated${NC}"
echo ""

# Step 2: Verify locally
echo "📋 Step 2: Verifying proof locally..."
./verify-proof build/proof.json build/test-input-fresh.json

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Local verification succeeded${NC}"
    echo ""
    echo "📊 This confirms:"
    echo "  - Proof generation works"
    echo "  - Current proving key and verification key match"
    echo "  - Public signals are correctly formatted"
    echo ""
    echo "⚠️  Next: Test on-chain verification to check if keys match deployed contract"
else
    echo -e "${RED}❌ Local verification failed${NC}"
    echo "This indicates the current keys are inconsistent"
    exit 1
fi

