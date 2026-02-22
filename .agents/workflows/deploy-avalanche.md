---
description: How to deploy Noah to a local Avalanche L1
---

This workflow guides you through setting up a local Avalanche blockchain and deploying the Noah smart contracts.

### 1. Initialize Local Avalanche Blockchain
Run this command and select `Subnet-EVM` and `defaults for test environment`.
```bash
avalanche blockchain create noah --sovereign=false
```

### 2. Deploy to Local Network
Deploy the configured blockchain to your local machine.
```bash
avalanche blockchain deploy noah
```
*Note: When prompted, select `Local Network`.*

### 3. Deploy Noah Smart Contracts
// turbo
Use the automated deployment script to put the ZK-KYC protocol on your new local network.
```bash
forge script script/Deploy.s.sol --rpc-url local-noah --broadcast
```

### 4. Verify Deployment
// turbo
Check that the contracts are live by calling the registry owner.
```bash
cast call --rpc-url local-noah $(jq -r '.returns.registry.value' broadcast/Deploy.s.sol/9999/run-latest.json) "owner()(address)"
```
