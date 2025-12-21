#!/bin/bash

echo "🧪 Testing Set Requirements Endpoint"
echo ""

# Test with correct format
echo "✅ Test 1: Correct format (should work)"
curl -X POST http://localhost:3000/api/v1/protocol/requirements/set \
  -H "Content-Type: application/json" \
  -d '{
    "protocolAddress": "0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1",
    "minAge": 21,
    "allowedJurisdictions": [1234567890],
    "requireAccredited": true,
    "privateKey": "090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test with wrong format (string minAge)
echo "❌ Test 2: Wrong format - minAge as string (should show validation error)"
curl -X POST http://localhost:3000/api/v1/protocol/requirements/set \
  -H "Content-Type: application/json" \
  -d '{
    "protocolAddress": "0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1",
    "minAge": "21",
    "allowedJurisdictions": [1234567890],
    "requireAccredited": true,
    "privateKey": "090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a"
  }' | jq '.'

echo ""
echo "✅ If you see validationErrors in the response, the fix is working!"
echo "✅ If you still see the old error format, restart the backend!"

