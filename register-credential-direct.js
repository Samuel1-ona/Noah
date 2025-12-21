#!/usr/bin/env node

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load deployments
const deployments = JSON.parse(readFileSync(join(__dirname, 'deployments.json'), 'utf8'));

// Load ABI
const abiPath = join(__dirname, 'out', 'CredentialRegistry.sol', 'CredentialRegistry.json');
const contractJson = JSON.parse(readFileSync(abiPath, 'utf8'));

const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY environment variable is not set');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const registry = new ethers.Contract(
  deployments.contracts.CredentialRegistry,
  contractJson.abi,
  signer
);

// Register credential - convert to bytes32
const credentialHashNum = 9876543210;
const credentialHash = ethers.zeroPadValue(ethers.toBeHex(credentialHashNum), 32);
const userAddress = '0xd5881AA749eEFd3Cb08d10f051aC776d664d0663';

console.log('📋 Registering credential...');
console.log(`  Hash: ${credentialHash}`);
console.log(`  User: ${userAddress}`);
console.log('');

try {
  const tx = await registry.registerCredential(credentialHash, userAddress);
  console.log(`⏳ Transaction sent: ${tx.hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  await tx.wait();
  
  console.log('✅ Credential registered successfully!');
  console.log(`  Transaction: ${tx.hash}`);
  
  // Verify it's registered
  const isValid = await registry.isCredentialValid(credentialHash);
  console.log(`  Verified: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
} catch (error) {
  console.error('❌ Registration failed:', error.message);
  if (error.reason) {
    console.error(`   Reason: ${error.reason}`);
  }
  process.exit(1);
}

