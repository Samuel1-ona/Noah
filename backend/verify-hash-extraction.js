// Quick verification script to ensure hash extraction matches contract logic

// Simulate contract extraction: fullHash >> 192
function contractExtractHash(fullHashHex) {
  // Remove 0x if present
  const hashHex = fullHashHex.startsWith('0x') ? fullHashHex.slice(2) : fullHashHex;
  // Convert to BigInt
  const fullHash = BigInt('0x' + hashHex);
  // Contract does: fullHash >> 192 (extracts top 64 bits)
  const truncatedHash = fullHash >> BigInt(192);
  return truncatedHash;
}

// Simulate our proof generation extraction: first 16 hex chars
function proofExtractHash(fullHashHex) {
  // Remove 0x if present
  const hashHex = fullHashHex.startsWith('0x') ? fullHashHex.slice(2) : fullHashHex;
  // Take first 16 hex chars (64 bits = 8 bytes)
  const truncatedHashHex = hashHex.slice(0, 16);
  // Convert to BigInt
  const truncatedHash = BigInt('0x' + truncatedHashHex);
  return truncatedHash;
}

// Test with a sample hash
const testHash = '0xf83222eb02d804451faf3e5fd5e41dc2ab53f7866b18591f5b1a4ee0d939424c';

console.log('Testing hash extraction matching:');
console.log('Full hash:', testHash);
console.log('');

const contractResult = contractExtractHash(testHash);
const proofResult = proofExtractHash(testHash);

console.log('Contract extraction (fullHash >> 192):', contractResult.toString());
console.log('Proof extraction (first 16 hex chars):', proofResult.toString());
console.log('');

if (contractResult === proofResult) {
  console.log('✅ MATCH! Both methods extract the same value.');
} else {
  console.log('❌ MISMATCH! Values do not match.');
  console.log('Difference:', (contractResult > proofResult ? contractResult - proofResult : proofResult - contractResult).toString());
}

console.log('');
console.log('As numbers (for JSON):');
console.log('Contract:', Number(contractResult));
console.log('Proof:', Number(proofResult));

