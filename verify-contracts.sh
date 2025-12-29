#!/bin/bash

# Contract verification script for Mantle Sepolia
# API Key: W4T8FVB34GTHNXB8N4XJHPFZUVFACI7QXP
# Network: Mantle Sepolia (Chain ID: 5003)
# Verifier URL: https://api-sepolia.mantlescan.xyz/api

# Compiler settings from foundry.toml:
# - Solidity version: 0.8.20 (using 0.8.23 as specified, compatible with ^0.8.20)
# - Optimizer: Enabled
# - Optimizer runs: 200

echo "=========================================="
echo "Verifying NOAH Protocol Contracts"
echo "Network: Mantle Sepolia (Chain ID: 5003)"
echo "=========================================="
echo ""

# 1. CredentialRegistry (no constructor args)
echo "1. Verifying CredentialRegistry..."
forge verify-contract \
  --verifier etherscan \
  --chain mantle-sepolia \
  --etherscan-api-key W4T8FVB34GTHNXB8N4XJHPFZUVFACI7QXP \
  --compiler-version "v0.8.20+commit.a61d2e49" \
  --num-of-optimizations 200 \
  0x5d311f246ef87d24B045D961aA6da62a758514f7 \
  src/CredentialRegistry.sol:CredentialRegistry \
  --watch

echo ""
echo "----------------------------------------"
echo ""

# 2. ZKVerifier (no constructor)
echo "2. Verifying ZKVerifier..."
forge verify-contract \
  --verifier etherscan \
  --chain mantle-sepolia \
  --etherscan-api-key W4T8FVB34GTHNXB8N4XJHPFZUVFACI7QXP \
  --compiler-version "v0.8.20+commit.a61d2e49" \
  --num-of-optimizations 200 \
  0x96f43E12280676866bBe13E0120Bb5892fCbfE0b \
  src/ZKVerifier.sol:ZKVerifier \
  --watch

echo ""
echo "----------------------------------------"
echo ""

# 3. ProtocolAccessControl (with constructor args)
echo "3. Verifying ProtocolAccessControl..."
echo "Constructor args:"
echo "  - ZKVerifier: 0x96f43E12280676866bBe13E0120Bb5892fCbfE0b"
echo "  - CredentialRegistry: 0x5d311f246ef87d24B045D961aA6da62a758514f7"
echo ""

forge verify-contract \
  --verifier etherscan \
  --chain mantle-sepolia \
  --etherscan-api-key W4T8FVB34GTHNXB8N4XJHPFZUVFACI7QXP \
  --compiler-version "v0.8.20+commit.a61d2e49" \
  --num-of-optimizations 200 \
  --constructor-args $(cast abi-encode "constructor(address,address)" "0x96f43E12280676866bBe13E0120Bb5892fCbfE0b" "0x5d311f246ef87d24B045D961aA6da62a758514f7") \
  0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A \
  src/ProtocolAccessControl.sol:ProtocolAccessControl \
  --watch

echo ""
echo "=========================================="
echo "Verification complete!"
echo "=========================================="

