import { ethers } from 'ethers';

/**
 * Convert jurisdiction strings to hashes
 */
function convertJurisdictions(jurisdictions) {
  if (typeof jurisdictions === 'string') {
    // Handle comma-separated string
    jurisdictions = jurisdictions.split(',').map(j => j.trim()).filter(j => j.length > 0);
  }

  if (!Array.isArray(jurisdictions)) {
    throw new Error('Jurisdictions must be an array or comma-separated string');
  }

  const results = jurisdictions.map(jurisdiction => {
    // Normalize the jurisdiction string (uppercase, trim)
    const normalized = jurisdiction.trim().toUpperCase();
    
    // Hash using keccak256
    const hash = ethers.keccak256(ethers.toUtf8Bytes(normalized));
    
    // Convert to BigInt for large number representation
    const hashBigInt = BigInt(hash);
    
    return {
      jurisdiction: normalized,
      hashHex: hash,
      hashNumber: hashBigInt.toString(),
    };
  });

  return results;
}

// Example usage
console.log('📝 Converting jurisdictions to hashes...\n');

// Common jurisdiction examples
const exampleJurisdictions = ['US', 'UK', 'CA']; // United States, United Kingdom, Canada

console.log('Example jurisdictions:', exampleJurisdictions.join(', '));
console.log('\nConverted hashes:\n');
console.log('─'.repeat(80));

const results = convertJurisdictions(exampleJurisdictions);

results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.jurisdiction}`);
  console.log(`   Hash (Hex):    ${result.hashHex}`);
  console.log(`   Hash (Number): ${result.hashNumber}`);
  console.log('');
});

console.log('─'.repeat(80));
console.log('\n📋 For protocol requirements, use these hash numbers:');
console.log(JSON.stringify(results.map(r => r.hashNumber), null, 2));
console.log('\nOr as hex strings:');
console.log(JSON.stringify(results.map(r => r.hashHex), null, 2));

// If you want to convert specific jurisdictions, uncomment and modify:
/*
const customJurisdictions = ['US', 'UK', 'CA']; // Replace with your jurisdictions
const customResults = convertJurisdictions(customJurisdictions);
console.log('\nYour custom jurisdictions:');
customResults.forEach(r => {
  console.log(`${r.jurisdiction}: ${r.hashNumber}`);
});
*/

