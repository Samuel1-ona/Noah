import { ethers } from 'ethers';

/**
 * Convert a jurisdiction string (e.g., "US", "UK", "CA") to a hash number
 * Uses keccak256 to hash the string, then converts to a BigInt
 * @param jurisdiction - Jurisdiction string (e.g., "US", "UK", "CA")
 * @param returnHex - If true, return hex string instead of decimal string
 * @returns Hash as a string number or hex string (for contract compatibility)
 */
export function jurisdictionStringToHash(
  jurisdiction: string,
  returnHex: boolean = false
): string {
  if (!jurisdiction || typeof jurisdiction !== 'string') {
    throw new Error('Jurisdiction must be a non-empty string');
  }

  // Normalize the jurisdiction string (uppercase, trim)
  const normalized = jurisdiction.trim().toUpperCase();

  // Hash using keccak256
  const hash = ethers.keccak256(ethers.toUtf8Bytes(normalized));

  if (returnHex) {
    // Return as hex string (backend can convert to BigInt)
    return hash;
  }

  // Convert hex hash to BigInt, then to string for JSON serialization
  // The contract expects uint256, so we use the full hash as a number
  const hashBigInt = BigInt(hash);

  // Return as string to avoid precision issues with large numbers
  return hashBigInt.toString();
}

/**
 * Convert multiple jurisdiction strings to hash numbers
 * @param jurisdictions - Array of jurisdiction strings
 * @returns Array of hash numbers as strings
 */
export function jurisdictionStringsToHashes(jurisdictions: string[]): string[] {
  if (!Array.isArray(jurisdictions)) {
    throw new Error('Jurisdictions must be an array');
  }

  return jurisdictions
    .map((j) => j.trim())
    .filter((j) => j.length > 0)
    .map((j) => {
      // If it's already a number string, return as-is
      // This allows mixing strings and numbers
      if (/^\d+$/.test(j)) {
        return j;
      }
      // Otherwise, convert string to hash
      return jurisdictionStringToHash(j);
    });
}

/**
 * Parse jurisdiction input (comma-separated string) and convert to hashes
 * @param input - Comma-separated jurisdiction strings or numbers
 * @returns Array of hash numbers as strings
 */
export function parseJurisdictions(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const jurisdictions = input
    .split(',')
    .map((j) => j.trim())
    .filter((j) => j.length > 0);

  return jurisdictionStringsToHashes(jurisdictions);
}






