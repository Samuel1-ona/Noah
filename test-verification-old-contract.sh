#!/bin/bash

# Temporary workaround test script for OLD contract logic (right-shift 196)
# This uses a hash where the value is in the MOST significant bits (leftmost 60 bits)
# instead of the least significant bits

set -e

echo "🔍 Verification Test (OLD Contract Logic Workaround)"
echo "====================================================="
echo ""
echo "⚠️  WARNING: This is a temporary workaround for the old contract."
echo "   The contract should be redeployed with the fix!"
echo ""

cd "$(dirname "$0")"

# Load addresses
PROTOCOL_ADDRESS=$(jq -r '.contracts.ProtocolAccessControl' deployments.json)
ZKVERIFIER_ADDRESS=$(jq -r '.contracts.ZKVerifier' deployments.json)
CREDENTIAL_REGISTRY=$(jq -r '.contracts.CredentialRegistry' deployments.json)

# Create hash where first 60 bits = 9876543210
# 9876543210 in hex = 0x24cb016ea (9 hex chars)
# We need to pad it to 15 hex chars and place it at the beginning
# Format: 0x[15 hex chars of value][49 zeros]
CREDENTIAL_HASH="0x$(printf '%015x' 9876543210)$(printf '%049x' 0)"
USER_ADDRESS="0xd5881AA749eEFd3Cb08d10f051aC776d664d0663"

echo "Protocol: $PROTOCOL_ADDRESS"
echo "ZKVerifier: $ZKVERIFIER_ADDRESS"
echo "Registry: $CREDENTIAL_REGISTRY"
echo "Credential Hash (OLD format): $CREDENTIAL_HASH"
echo ""

# Verify the hash format
echo "📋 Verifying hash format..."
HASH_HEX=$(echo "$CREDENTIAL_HASH" | sed 's/0x//')
FIRST_15=$(echo "$HASH_HEX" | cut -c1-15)
FIRST_15_DEC=$(printf '%d' 0x$FIRST_15)
echo "  First 15 hex chars: $FIRST_15"
echo "  As decimal: $FIRST_15_DEC"
echo "  Expected: 9876543210"
if [ "$FIRST_15_DEC" = "9876543210" ]; then
    echo "  ✅ Hash format correct for OLD contract logic"
else
    echo "  ❌ Hash format incorrect"
    exit 1
fi
echo ""

# Step 1: Register credential
echo "📋 Step 1: Registering credential..."
node register-credential-direct.js "$CREDENTIAL_HASH" 2>&1 | grep -E "(✅|❌|Transaction)" || echo "Credential registration attempted"
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
if echo "$REQUIREMENTS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Requirements set"
else
    echo "⚠️  Requirements response: $REQUIREMENTS_RESPONSE"
fi
echo ""

# Step 3: Generate proof (this will still use the OLD hash in the proof)
echo "📋 Step 3: Generating proof..."
echo "⚠️  Note: Proof generation uses the hash from credential, which may not match OLD contract logic"
echo "   This workaround may not work if the proof generator uses the wrong hash format"
echo ""

# The rest of the test would continue...
echo "⚠️  This workaround script is incomplete."
echo "   The proper solution is to redeploy the contract with the fix."
echo ""
echo "📋 To fix properly:"
echo "   1. Set PRIVATE_KEY environment variable"
echo "   2. Run: ./redeploy-verifier-and-protocol.sh"
echo "   3. Restart backend services"
echo "   4. Run: ./test-verification-final.sh"

