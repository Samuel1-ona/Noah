#!/bin/bash

set -e

echo "🔍 Testing ZK Proof Verification Locally"
echo "=========================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if proving key and circuit exist
echo "📋 Step 1: Checking required files..."
if [ ! -f "build/proving_key.pk" ]; then
    echo -e "${RED}❌ Proving key not found. Run 'go run cmd/generate-verifier/main.go' first${NC}"
    exit 1
fi

if [ ! -f "build/circuit.ccs" ]; then
    echo -e "${RED}❌ Constraint system not found. Run 'go run cmd/generate-verifier/main.go' first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Required files found${NC}"
echo ""

# Step 2: Rebuild prove binary with fix
echo "📋 Step 2: Rebuilding prove binary..."
go build -o prove cmd/prove/main.go
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build prove binary${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prove binary built${NC}"
echo ""

# Step 3: Create test input
echo "📋 Step 3: Creating test input..."
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

echo "$TEST_INPUT" > build/test-input-verification.json
echo -e "${GREEN}✅ Test input created${NC}"
echo ""

# Step 4: Generate proof
echo "📋 Step 4: Generating proof..."
./prove build/test-input-verification.json
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Proof generation failed${NC}"
    exit 1
fi

# Check if publicInputs is now populated
if [ -f "build/proof.json" ]; then
    PUBLIC_INPUTS=$(cat build/proof.json | jq -r '.publicInputs')
    if [ "$PUBLIC_INPUTS" = "{}" ] || [ "$PUBLIC_INPUTS" = "null" ] || [ -z "$PUBLIC_INPUTS" ]; then
        echo -e "${YELLOW}⚠️  Warning: publicInputs is still empty${NC}"
    else
        echo -e "${GREEN}✅ Proof generated with publicInputs:${NC}"
        echo "$PUBLIC_INPUTS" | jq '.'
    fi
fi
echo ""

# Step 5: Build verify-proof binary
echo "📋 Step 5: Building verify-proof binary..."
go build -o verify-proof cmd/verify-proof/main.go
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build verify-proof binary${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Verify-proof binary built${NC}"
echo ""

# Step 6: Verify proof locally
echo "📋 Step 6: Verifying proof locally with Go..."
./verify-proof build/proof.json build/test-input-verification.json
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅✅✅ LOCAL VERIFICATION SUCCEEDED ✅✅✅${NC}"
    echo ""
    echo "📊 Summary:"
    echo "  - Proof is valid"
    echo "  - Verification key matches proving key"
    echo "  - Public witness is correct"
    echo ""
    echo "⚠️  If on-chain verification still fails, possible causes:"
    echo "  1. The deployed ZKVerifier contract has a different verification key"
    echo "  2. The public signals format sent to the contract is incorrect"
    echo "  3. The proof format conversion (a, b, c) is incorrect"
    echo ""
    echo "🔧 Next steps:"
    echo "  1. Check if the deployed ZKVerifier contract was generated from the same keys"
    echo "  2. If keys don't match, regenerate keys and redeploy ZKVerifier"
    echo "  3. Verify the public signals format matches what the contract expects"
else
    echo ""
    echo -e "${RED}❌❌❌ LOCAL VERIFICATION FAILED ❌❌❌${NC}"
    echo ""
    echo "This indicates a problem with:"
    echo "  - The proof itself"
    echo "  - The verification key"
    echo "  - The public witness"
    echo ""
    exit 1
fi

