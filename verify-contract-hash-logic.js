#!/usr/bin/env node

/**
 * Script to verify the hash extraction logic of the deployed ProtocolAccessControl contract
 * This helps confirm if the contract was deployed with the fix
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  // Load deployments
  const deployments = JSON.parse(fs.readFileSync('deployments.json', 'utf8'));
  const protocolAddress = deployments.contracts.ProtocolAccessControl;
  const rpcUrl = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
  
  console.log('🔍 Verifying Contract Hash Extraction Logic');
  console.log('==========================================');
  console.log(`Protocol Address: ${protocolAddress}`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log('');
  
  // Test hash
  const testHash = '0x000000000000000000000000000000000000000000000000000000024cb016ea';
  const expectedTruncated = 9876543210;
  
  console.log('Test Hash:', testHash);
  console.log('Expected Truncated (60 bits):', expectedTruncated);
  console.log('');
  
  // Calculate what NEW logic should produce (mask)
  const fullHashBN = ethers.BigNumber.from(testHash);
  const mask = ethers.BigNumber.from('0xFFFFFFFFFFFFFFF');
  const newLogicResult = fullHashBN.and(mask);
  
  // Calculate what OLD logic would produce (right-shift 196)
  const oldLogicResult = fullHashBN.shr(196);
  
  console.log('New Logic (mask & 0xFFFFFFFFFFFFFFF):', newLogicResult.toString());
  console.log('  Match:', newLogicResult.toString() === expectedTruncated.toString() ? '✅' : '❌');
  console.log('');
  console.log('Old Logic (right-shift 196):', oldLogicResult.toString());
  console.log('  Match:', oldLogicResult.toString() === expectedTruncated.toString() ? '✅' : '❌');
  console.log('');
  
  // Try to call the contract to see what it does
  // Note: We can't directly call the internal logic, but we can try to verify
  // by attempting a verification with a known hash
  console.log('⚠️  Note: Cannot directly verify deployed contract logic without calling it.');
  console.log('   The contract needs to be redeployed with the fix if it still uses old logic.');
  console.log('');
  
  if (oldLogicResult.toString() === '0' && newLogicResult.toString() === expectedTruncated.toString()) {
    console.log('✅ Source code fix is correct:');
    console.log('   - New logic (mask) produces correct result');
    console.log('   - Old logic (right-shift) produces 0 (incorrect)');
    console.log('');
    console.log('📋 Next step: Redeploy the contract with the fix');
  }
}

main().catch(console.error);

