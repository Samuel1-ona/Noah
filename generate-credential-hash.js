import { ethers } from 'ethers';

/**
 * Generate a credential hash from user data
 */
function generateCredentialHash(userData) {
  const { userAddress, age, jurisdiction, accredited } = userData;
  
  // Convert jurisdiction string to hash (as used in the system)
  const jurisdictionHash = ethers.keccak256(ethers.toUtf8Bytes(jurisdiction));
  
  // Create credential data string (similar to test-proof-verification.js)
  // Format: user:address,age:number,jurisdiction:hash,accredited:number,timestamp:timestamp
  const timestamp = Date.now();
  const accreditedValue = accredited ? 1 : 0;
  
  const credentialData = `user:${userAddress},age:${age},jurisdiction:${jurisdictionHash},accredited:${accreditedValue},timestamp:${timestamp}`;
  
  // Hash the credential data
  const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));
  
  return {
    credentialHash,
    jurisdictionHash,
    credentialData,
    timestamp
  };
}

// User data
const userData = {
  userAddress: "0x3a2439dcaad194ae3f7f6ef3f1f15ea526c1dd3a",
  age: 23,
  jurisdiction: "US",
  accredited: 1
};

console.log('📝 Generating credential hash...\n');
console.log('Input data:');
console.log(JSON.stringify(userData, null, 2));
console.log('\n');

const result = generateCredentialHash(userData);

console.log('✅ Generated credential hash:');
console.log('─'.repeat(60));
console.log(`Credential Hash: ${result.credentialHash}`);
console.log(`Jurisdiction Hash: ${result.jurisdictionHash}`);
console.log(`Timestamp: ${result.timestamp}`);
console.log(`Credential Data String: ${result.credentialData}`);
console.log('─'.repeat(60));
console.log('\n');
console.log('📋 Use this credential hash to register the credential:');
console.log(`   ${result.credentialHash}`);

