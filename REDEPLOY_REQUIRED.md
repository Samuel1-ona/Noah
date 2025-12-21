# ⚠️ Contract Redeployment Required

## Issue Summary

The `ProtocolAccessControl` contract at `0x4116271396DE874A16E31530B819d0Bd7A15E4a2` was deployed with the **old hash extraction logic** and needs to be redeployed with the **fix**.

## Root Cause

**Old Logic (deployed contract):**
```solidity
uint256 truncatedHash = fullHash >> 196; // Right-shift 196 bits
```
- For hash `0x000000000000000000000000000000000000000000000000000000024cb016ea`
- Result: `0` ❌

**New Logic (source code fix):**
```solidity
uint256 truncatedHash = fullHash & 0xFFFFFFFFFFFFFFF; // Mask last 60 bits
```
- For hash `0x000000000000000000000000000000000000000000000000000000024cb016ea`
- Result: `9876543210` ✅

## Evidence

- ✅ Source code has fix (line 151 in `ProtocolAccessControl.sol`)
- ✅ Backend calculates hash correctly (`hashMatch: true` in logs)
- ✅ Contract compiles successfully
- ❌ Deployed contract still uses old logic (error: "Credential hash mismatch")

## Solution

**Redeploy the contract with the fix:**

```bash
# 1. Set PRIVATE_KEY
export PRIVATE_KEY="your_private_key_here"

# 2. Redeploy
cd /Users/machine/Documents/Pyp
./redeploy-verifier-and-protocol.sh

# 3. Restart backend services
pkill -f "protocol:dev"
cd backend
npm run protocol:dev > /tmp/protocol.log 2>&1 &
sleep 3

# 4. Set requirements
PROTOCOL_ADDRESS=$(jq -r '.contracts.ProtocolAccessControl' deployments.json)
curl -s -X POST http://localhost:3003/requirements/set \
  -H "Content-Type: application/json" \
  -d "{\"protocolAddress\":\"$PROTOCOL_ADDRESS\",\"minAge\":18,\"allowedJurisdictions\":[1234567890,1111111111,2222222222],\"requireAccredited\":1,\"privateKey\":\"$PRIVATE_KEY\"}"

# 5. Register credential
node register-credential-direct.js

# 6. Test
./test-verification-final.sh
```

## Verification

After redeployment, the test should show:
```
✅✅✅ VERIFICATION SUCCEEDED ✅✅✅
```

Instead of:
```
❌ Verification failed: Blockchain error: Credential hash mismatch
```
