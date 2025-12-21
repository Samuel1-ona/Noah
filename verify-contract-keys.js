#!/usr/bin/env node

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load deployments
const deployments = JSON.parse(readFileSync(join(__dirname, 'deployments.json'), 'utf8'));

// Read the source contract to get expected constants
const contractSource = readFileSync(join(__dirname, 'src', 'ZKVerifier.sol'), 'utf8');

// Extract CONSTANT_X from source
const constantXMatch = contractSource.match(/uint256 constant CONSTANT_X = (\d+);/);
const pub0XMatch = contractSource.match(/uint256 constant PUB_0_X = (\d+);/);

if (!constantXMatch || !pub0XMatch) {
  console.error('❌ Could not extract constants from source');
  process.exit(1);
}

const expectedConstantX = constantXMatch[1];
const expectedPub0X = pub0XMatch[1];

console.log('📋 Verification Key Constants Check');
console.log('====================================');
console.log('');
console.log('Expected (from source):');
console.log(`  CONSTANT_X: ${expectedConstantX}`);
console.log(`  PUB_0_X: ${expectedPub0X}`);
console.log('');

// Note: We can't read constants from deployed contract directly (they're private)
// But we can verify the contract bytecode matches
console.log('⚠️  Cannot directly read constants from deployed contract');
console.log('   (They are private constants)');
console.log('');
console.log('✅ If local verification succeeds but on-chain fails,');
console.log('   the deployed contract likely has different verification key.');
console.log('');
console.log('🔧 Solution: Ensure contract was deployed AFTER keys were regenerated');
console.log(`   Keys generated: $(stat -f "%Sm" build/verification_key.vk 2>/dev/null || echo 'unknown')`);
console.log(`   Contract deployed: Check transaction ${deployments.transactions.ZKVerifier}`);

