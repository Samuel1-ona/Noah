import type { Signer } from 'ethers';
import type { Requirements, ZKProof, TransactionResult, ContractAddresses } from '../utils/types';
import { ContractClient } from '../core/ContractClient';
import { APIClient, type ProofGenerationData } from '../core/APIClient';
import { jurisdictionStringToHash } from '../utils/jurisdiction';

/**
 * Credential data structure for proof generation
 */
export interface Credential {
  credentialHash: string;
  age: number;
  jurisdiction: string | number;
  accredited: number; // 0 or 1
  userAddress?: string;
}

/**
 * Proof generation result
 */
export interface ProofResult {
  proof: ZKProof;
  publicSignals: string[]; // 13 elements
  publicInputs?: string[]; // For backward compatibility
  credentialHash: string;
  success: boolean;
}

/**
 * UserClient configuration options
 */
export interface UserClientConfig {
  apiBaseUrl?: string;
  contractAddresses?: Partial<ContractAddresses>;
  rpcUrl?: string;
}

/**
 * UserClient - High-level API for end-user applications
 * 
 * Provides a simple interface for users to:
 * - Generate ZK proofs from credentials
 * - Verify and grant access to protocols
 * - Check credential validity
 * - Get protocol requirements
 * 
 * @example
 * ```typescript
 * import { UserClient } from '@noah-protocol/sdk';
 * import { ethers } from 'ethers';
 * 
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const user = new UserClient(signer, { apiBaseUrl: 'https://api.noah.xyz' });
 * 
 * // Generate proof
 * const proof = await user.generateProof(credential, requirements);
 * 
 * // Verify and grant access
 * await user.verifyAndGrantAccess(proof, protocolAddress);
 * ```
 */
export class UserClient {
  private signer: Signer;
  private contractClient: ContractClient;
  private apiClient: APIClient;

  /**
   * Create a new UserClient instance
   * @param signer - Ethers.js signer from user's wallet
   * @param config - Optional configuration
   */
  constructor(signer: Signer, config: UserClientConfig = {}) {
    if (!signer) {
      throw new Error('Signer is required');
    }

    this.signer = signer;

    // Initialize ContractClient with signer
    this.contractClient = new ContractClient({
      provider: signer.provider || undefined,
      contractAddresses: config.contractAddresses as ContractAddresses | undefined,
      rpcUrl: config.rpcUrl,
    });

    // Initialize APIClient with base URL
    this.apiClient = new APIClient({
      baseURL: config.apiBaseUrl,
    });
  }

  /**
   * Generate a ZK proof from credential data and protocol requirements
   * 
   * @param credential - Credential data (age, jurisdiction, accredited, credentialHash)
   * @param requirements - Protocol requirements (minAge, allowedJurisdictions, requireAccredited)
   * @returns Promise resolving to proof result with proof, publicSignals, and credentialHash
   * 
   * @example
   * ```typescript
   * const credential = {
   *   credentialHash: '0x1234...',
   *   age: 25,
   *   jurisdiction: 'US',
   *   accredited: 1,
   *   userAddress: '0x...'
   * };
   * 
   * const requirements = {
   *   protocolAddress: '0x...',
   *   minAge: 21,
   *   allowedJurisdictions: ['US', 'UK'],
   *   requireAccredited: true
   * };
   * 
   * const proof = await user.generateProof(credential, requirements);
   * ```
   */
  async generateProof(
    credential: Credential,
    requirements: Requirements & { protocolAddress: string }
  ): Promise<ProofResult> {
    if (!credential || !requirements) {
      throw new Error('Credential and requirements are required');
    }

    if (!credential.credentialHash) {
      throw new Error('Credential hash is required');
    }

    if (typeof credential.age !== 'number' || credential.age < 0 || credential.age > 150) {
      throw new Error('Valid age (0-150) is required');
    }

    if (!credential.jurisdiction) {
      throw new Error('Jurisdiction is required');
    }

    if (credential.accredited !== 0 && credential.accredited !== 1) {
      throw new Error('Accredited must be 0 or 1');
    }

    if (!requirements.protocolAddress) {
      throw new Error('Protocol address is required');
    }

    try {
      // Convert jurisdiction to hash if it's a string (like "US", "UK")
      let jurisdictionValue: string | number;
      if (typeof credential.jurisdiction === 'string') {
        // Check if it's already a numeric string (hash) or a jurisdiction string
        if (/^\d+$/.test(credential.jurisdiction)) {
          // Already a numeric string (hash)
          jurisdictionValue = credential.jurisdiction;
        } else if (credential.jurisdiction.startsWith('0x')) {
          // Already a hex hash
          jurisdictionValue = credential.jurisdiction;
        } else {
          // It's a jurisdiction string (like "US", "UK") - convert to hash
          const hash = jurisdictionStringToHash(credential.jurisdiction, true); // Return hex
          // Convert hex to decimal string for backend compatibility
          jurisdictionValue = BigInt(hash).toString();
        }
      } else {
        // Already a number
        jurisdictionValue = credential.jurisdiction;
      }

      const proofData: ProofGenerationData = {
        credential: {
          credentialHash: credential.credentialHash,
          age: credential.age,
          jurisdiction: jurisdictionValue,
          accredited: credential.accredited,
          userAddress: credential.userAddress,
        },
        requirements: {
          minAge: requirements.minAge,
          allowedJurisdictions: requirements.allowedJurisdictions,
          requireAccredited: requirements.requireAccredited ?? false,
        },
      };

      const result = await this.apiClient.generateProof(proofData);

      return {
        proof: result.proof,
        publicSignals: result.publicSignals,
        publicInputs: result.publicSignals, // For backward compatibility
        credentialHash: result.credentialHash || credential.credentialHash,
        success: result.success,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to generate proof: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Verify proof and grant access to a protocol
   * 
   * This method calls the smart contract's verifyAndGrantAccess function,
   * which verifies the ZK proof and grants the user access to the protocol.
   * 
   * @param proofResult - Proof result from generateProof()
   * @param protocolAddress - Protocol contract address (optional, can be inferred from proof)
   * @param userAddress - User's wallet address (optional, defaults to signer address)
   * @returns Promise resolving to transaction result with hash and receipt
   * 
   * @example
   * ```typescript
   * const proof = await user.generateProof(credential, requirements);
   * const tx = await user.verifyAndGrantAccess(proof, protocolAddress);
   * console.log('Transaction hash:', tx.transactionHash);
   * ```
   */
  async verifyAndGrantAccess(
    proofResult: ProofResult,
    protocolAddress?: string,
    userAddress?: string
  ): Promise<TransactionResult> {
    // Remove unused protocolAddress parameter warning
    void protocolAddress;
    if (!proofResult || !proofResult.proof) {
      throw new Error('Proof result is required');
    }

    if (!proofResult.publicSignals || proofResult.publicSignals.length < 13) {
      throw new Error('Public signals are required and must have at least 13 elements');
    }

    if (!proofResult.credentialHash) {
      throw new Error('Credential hash is required in proof result');
    }

    // Get user address from signer if not provided
    const finalUserAddress = userAddress || (await this.signer.getAddress());

    // Note: The contract uses msg.sender (the signer's address) as the protocol address
    // The protocolAddress parameter is kept for API consistency but is not used in the contract call

    try {
      const result = await this.contractClient.verifyAndGrantAccess(
        this.signer,
        proofResult.proof,
        proofResult.publicSignals,
        proofResult.credentialHash,
        finalUserAddress
      );

      return result;
    } catch (error: any) {
      throw new Error(
        `Failed to verify proof and grant access: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a credential is valid (exists and not revoked)
   * 
   * @param credentialHash - The credential hash to check (bytes32)
   * @returns Promise resolving to true if credential is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const isValid = await user.checkCredentialValidity('0x1234...');
   * if (isValid) {
   *   console.log('Credential is valid');
   * }
   * ```
   */
  async checkCredentialValidity(credentialHash: string): Promise<boolean> {
    if (!credentialHash) {
      throw new Error('Credential hash is required');
    }

    try {
      return await this.contractClient.isCredentialValid(credentialHash);
    } catch (error: any) {
      throw new Error(
        `Failed to check credential validity: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Get protocol requirements
   * 
   * @param protocolAddress - The protocol contract address
   * @returns Promise resolving to requirements object (minAge, allowedJurisdictions, requireAccredited)
   * 
   * @example
   * ```typescript
   * const requirements = await user.getProtocolRequirements('0x...');
   * console.log('Min age:', requirements.minAge);
   * console.log('Allowed jurisdictions:', requirements.allowedJurisdictions);
   * ```
   */
  async getProtocolRequirements(protocolAddress: string): Promise<Requirements> {
    if (!protocolAddress) {
      throw new Error('Protocol address is required');
    }

    try {
      return await this.contractClient.getRequirements(protocolAddress);
    } catch (error: any) {
      throw new Error(
        `Failed to get protocol requirements: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Check if user has access to a protocol
   * 
   * @param protocolAddress - The protocol contract address
   * @param userAddress - The user's wallet address (optional, defaults to signer address)
   * @returns Promise resolving to true if user has access, false otherwise
   * 
   * @example
   * ```typescript
   * const hasAccess = await user.hasAccess('0x...');
   * if (hasAccess) {
   *   console.log('User has access to protocol');
   * }
   * ```
   */
  async hasAccess(
    protocolAddress: string,
    userAddress?: string
  ): Promise<boolean> {
    if (!protocolAddress) {
      throw new Error('Protocol address is required');
    }

    const finalUserAddress = userAddress || (await this.signer.getAddress());

    try {
      return await this.contractClient.hasAccess(protocolAddress, finalUserAddress);
    } catch (error: any) {
      throw new Error(
        `Failed to check access: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Get user's credential hash for a protocol
   * 
   * @param protocolAddress - The protocol contract address
   * @param userAddress - The user's wallet address (optional, defaults to signer address)
   * @returns Promise resolving to credential hash (bytes32) or empty string if not set
   * 
   * @example
   * ```typescript
   * const credentialHash = await user.getUserCredential('0x...');
   * if (credentialHash) {
   *   console.log('User credential:', credentialHash);
   * }
   * ```
   */
  async getUserCredential(
    protocolAddress: string,
    userAddress?: string
  ): Promise<string> {
    if (!protocolAddress) {
      throw new Error('Protocol address is required');
    }

    const finalUserAddress = userAddress || (await this.signer.getAddress());

    try {
      return await this.contractClient.getUserCredential(protocolAddress, finalUserAddress);
    } catch (error: any) {
      throw new Error(
        `Failed to get user credential: ${error.message || 'Unknown error'}`
      );
    }
  }
}

