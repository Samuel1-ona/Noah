import { ethers } from 'ethers';
import { jurisdictionStringToHash } from './jurisdiction.js';
import type { CredentialData, CredentialHashResult } from './types.js';

/**
 * Generate a credential hash from user data
 * 
 * The credential hash is computed using Keccak256 from a formatted string containing:
 * - User address
 * - Age
 * - Jurisdiction (converted to hash)
 * - Accredited status
 * - Timestamp
 * 
 * @param userData - The credential data to hash
 * @returns Object containing the credential hash, jurisdiction hash, credential data string, and timestamp
 * 
 * @example
 * ```typescript
 * const credential = {
 *   userAddress: "0x1234...",
 *   age: 25,
 *   jurisdiction: "US",
 *   accredited: true
 * };
 * 
 * const result = generateCredentialHash(credential);
 * console.log(result.credentialHash); // "0x..."
 * ```
 */
export function generateCredentialHash(
  userData: CredentialData
): CredentialHashResult {
  const { userAddress, age, jurisdiction, accredited } = userData;

  // Validate required fields
  if (!userAddress || typeof userAddress !== 'string') {
    throw new Error('userAddress must be a non-empty string');
  }

  if (typeof age !== 'number' || age < 0 || !Number.isInteger(age)) {
    throw new Error('age must be a non-negative integer');
  }

  if (!jurisdiction || typeof jurisdiction !== 'string') {
    throw new Error('jurisdiction must be a non-empty string');
  }

  if (typeof accredited !== 'boolean') {
    throw new Error('accredited must be a boolean');
  }

  // Convert jurisdiction string to hash
  const jurisdictionHash = jurisdictionStringToHash(jurisdiction, true);

  // Create credential data string
  // Format: user:address,age:number,jurisdiction:hash,accredited:number,timestamp:timestamp
  const timestamp = userData.timestamp ?? Date.now();
  const accreditedValue = accredited ? 1 : 0;

  const credentialData = `user:${userAddress},age:${age},jurisdiction:${jurisdictionHash},accredited:${accreditedValue},timestamp:${timestamp}`;

  // Hash the credential data
  const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));

  return {
    credentialHash,
    jurisdictionHash,
    credentialData,
    timestamp,
  };
}

/**
 * Validate a credential hash format
 * @param hash - The credential hash to validate
 * @returns True if the hash is valid (starts with 0x and is 66 characters)
 */
export function isValidCredentialHash(hash: string): boolean {
  if (typeof hash !== 'string') {
    return false;
  }

  // Must start with 0x and be 66 characters (0x + 64 hex chars)
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate a user address format
 * @param address - The Ethereum address to validate
 * @returns True if the address is valid
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }

  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalize an Ethereum address to checksum format
 * @param address - The address to normalize
 * @returns The checksummed address
 */
export function toChecksumAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  return ethers.getAddress(address);
}






