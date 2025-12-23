import { Contract } from 'ethers';
import type { Signer, Provider, ContractTransactionReceipt } from 'ethers';
import {
  Requirements,
  TransactionResult,
  ProtocolClientConfig,
  SetRequirementsParams,
  VerifyUserAccessParams,
} from '../utils/types';
import { jurisdictionStringsToHashes } from '../utils/jurisdiction';

/**
 * Protocol Access Control ABI (minimal for required operations)
 */
const PROTOCOL_ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function getRequirements(address protocol) view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function verifyAndGrantAccess(uint[2] a, uint[2][2] b, uint[2] c, uint[13] publicSignals, bytes32 credentialHash, address user)',
  'event AccessGranted(address indexed user, address indexed protocol, bytes32 credentialHash, uint256 timestamp)',
  'event RequirementsSet(address indexed protocol, uint256 minAge, uint256[] allowedJurisdictions, bool requireAccredited)',
] as const;

/**
 * Default Protocol Access Control contract address (Mantle Sepolia)
 * Can be overridden via config
 */
const DEFAULT_PROTOCOL_ACCESS_CONTROL_ADDRESS = '0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A';

/**
 * ProtocolClient - High-level API for DeFi protocol integration
 * 
 * Provides a simple interface for protocols to:
 * - Set KYC requirements (minAge, jurisdictions, accredited status)
 * - Check if users have access
 * - Verify ZK proofs and grant access to users
 * 
 * @example
 * ```typescript
 * import { ProtocolClient } from '@noah-protocol/sdk';
 * import { ethers } from 'ethers';
 * 
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const protocol = new ProtocolClient(signer);
 * 
 * // Set requirements
 * await protocol.setRequirements({
 *   minAge: 21,
 *   jurisdictions: ['US', 'UK', 'CA'],
 *   requireAccredited: true
 * });
 * 
 * // Check user access
 * const hasAccess = await protocol.checkUserAccess(protocolAddress, userAddress);
 * ```
 */
export class ProtocolClient {
  private signer: Signer;
  private provider: Provider;
  private protocolAccessControlAddress: string;
  private contract: Contract | null = null;

  /**
   * Create a new ProtocolClient instance
   * 
   * @param signer - Ethers signer (from wallet connection)
   * @param config - Optional configuration (contract address, provider)
   */
  constructor(signer: Signer, config?: ProtocolClientConfig) {
    if (!signer) {
      throw new Error('Signer is required');
    }

    this.signer = signer;
    this.provider = config?.provider || signer.provider!;
    
    if (!this.provider) {
      throw new Error('Provider is required. Pass it via config or ensure signer has a provider.');
    }

    this.protocolAccessControlAddress = 
      config?.protocolAccessControlAddress || 
      DEFAULT_PROTOCOL_ACCESS_CONTROL_ADDRESS;
  }

  /**
   * Get or create the ProtocolAccessControl contract instance
   * Uses signer for write operations, provider for read operations
   */
  private getContract(): Contract {
    if (!this.contract) {
      this.contract = new Contract(
        this.protocolAccessControlAddress,
        PROTOCOL_ACCESS_CONTROL_ABI,
        this.signer
      );
    }
    return this.contract;
  }

  /**
   * Get read-only contract instance (for queries)
   */
  private getReadOnlyContract(): Contract {
    return new Contract(
      this.protocolAccessControlAddress,
      PROTOCOL_ACCESS_CONTROL_ABI,
      this.provider
    );
  }

  /**
   * Set protocol requirements for KYC verification
   * 
   * @param params - Requirements parameters
   * @param params.minAge - Minimum age required (must be positive integer)
   * @param params.jurisdictions - Array of allowed jurisdiction hashes (strings or numbers)
   * @param params.requireAccredited - Whether accredited investor status is required
   * @returns Promise resolving to transaction result
   * 
   * @example
   * ```typescript
   * const tx = await protocol.setRequirements({
   *   minAge: 21,
   *   jurisdictions: ['1234567890', '1111111111'],
   *   requireAccredited: true
   * });
   * console.log('Transaction hash:', tx.transactionHash);
   * ```
   */
  async setRequirements(params: SetRequirementsParams): Promise<TransactionResult> {
    const { minAge, jurisdictions, requireAccredited } = params;

    if (minAge < 0 || !Number.isInteger(minAge)) {
      throw new Error('minAge must be a non-negative integer');
    }

    if (!Array.isArray(jurisdictions)) {
      throw new Error('jurisdictions must be an array');
    }

    if (jurisdictions.length > 10) {
      throw new Error('Maximum 10 jurisdictions allowed');
    }

    // Convert jurisdictions to BigInt array
    // First, check if they're jurisdiction strings (like "US", "UK") or already hashes
    let jurisdictionsToProcess: (string | number)[];
    
    // Check if any jurisdiction is a string that's not numeric (like "US", "UK")
    const hasStringJurisdictions = jurisdictions.some(j => 
      typeof j === 'string' && !j.startsWith('0x') && !/^\d+$/.test(j)
    );
    
    if (hasStringJurisdictions) {
      // Convert jurisdiction strings to hashes
      const jurisdictionStrings = jurisdictions.map(j => String(j));
      const hashes = jurisdictionStringsToHashes(jurisdictionStrings);
      jurisdictionsToProcess = hashes;
    } else {
      jurisdictionsToProcess = jurisdictions;
    }
    
    // Convert to BigInt array
    const jurisdictionsArray = jurisdictionsToProcess.map(j => {
      if (typeof j === 'string') {
        if (j.startsWith('0x')) {
          return BigInt(j);
        }
        return BigInt(j);
      }
      return BigInt(j);
    });

    try {
      const contract = this.getContract();
      const tx = await contract.setRequirements(
        BigInt(minAge),
        jurisdictionsArray,
        requireAccredited
      );

      const receipt = await tx.wait();

      return {
        transactionHash: tx.hash,
        receipt: receipt as ContractTransactionReceipt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to set requirements: ${errorMessage}`);
    }
  }

  /**
   * Get protocol requirements
   * 
   * @param protocolAddress - The protocol contract address (defaults to signer's address)
   * @returns Promise resolving to requirements object
   * 
   * @example
   * ```typescript
   * const requirements = await protocol.getRequirements(protocolAddress);
   * console.log('Min age:', requirements.minAge);
   * console.log('Jurisdictions:', requirements.allowedJurisdictions);
   * ```
   */
  async getRequirements(protocolAddress?: string): Promise<Requirements> {
    const address = protocolAddress || (await this.signer.getAddress());

    try {
      const contract = this.getReadOnlyContract();
      const [minAge, allowedJurisdictions, requireAccredited] = 
        await contract.getRequirements(address);

      return {
        minAge: Number(minAge),
        allowedJurisdictions: allowedJurisdictions.map((j: bigint) => j.toString()),
        requireAccredited,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get requirements: ${errorMessage}`);
    }
  }

  /**
   * Verify ZK proof and grant access to a user
   * 
   * @param params - Verification parameters
   * @param params.userAddress - The user's wallet address
   * @param params.proof - ZK proof object (Groth16 format)
   * @param params.publicSignals - Public signals array (13 elements)
   * @param params.credentialHash - The credential hash (bytes32)
   * @returns Promise resolving to transaction result
   * 
   * @example
   * ```typescript
   * const tx = await protocol.verifyUserAccess({
   *   userAddress: '0x...',
   *   proof: { a: [...], b: [...], c: [...] },
   *   publicSignals: ['21', '1234567890', ...],
   *   credentialHash: '0x...'
   * });
   * ```
   */
  async verifyUserAccess(params: VerifyUserAccessParams): Promise<TransactionResult> {
    const { userAddress, proof, publicSignals, credentialHash } = params;

    if (!proof.a || !Array.isArray(proof.a) || proof.a.length !== 2) {
      throw new Error('Proof.a must be an array of 2 elements');
    }

    if (!proof.b || !Array.isArray(proof.b) || proof.b.length !== 2) {
      throw new Error('Proof.b must be an array of 2 arrays');
    }

    if (!proof.c || !Array.isArray(proof.c) || proof.c.length !== 2) {
      throw new Error('Proof.c must be an array of 2 elements');
    }

    if (!Array.isArray(publicSignals) || publicSignals.length < 13) {
      throw new Error('publicSignals must be an array of at least 13 elements');
    }

    // Convert proof arrays to BigInt arrays
    const a: [bigint, bigint] = [BigInt(proof.a[0]), BigInt(proof.a[1])];
    const b: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
      [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])],
    ];
    const c: [bigint, bigint] = [BigInt(proof.c[0]), BigInt(proof.c[1])];

    // Convert public signals to BigInt array (13 elements)
    const publicSignalsArray = publicSignals.slice(0, 13).map(s => BigInt(s));

    try {
      const contract = this.getContract();
      const tx = await contract.verifyAndGrantAccess(
        a,
        b,
        c,
        publicSignalsArray,
        credentialHash,
        userAddress
      );

      const receipt = await tx.wait();

      return {
        transactionHash: tx.hash,
        receipt: receipt as ContractTransactionReceipt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify and grant access: ${errorMessage}`);
    }
  }

  /**
   * Check if a user has access to a protocol
   * 
   * @param protocolAddress - The protocol contract address (defaults to signer's address)
   * @param userAddress - The user's wallet address
   * @returns Promise resolving to boolean indicating access status
   * 
   * @example
   * ```typescript
   * const hasAccess = await protocol.checkUserAccess(protocolAddress, userAddress);
   * if (hasAccess) {
   *   console.log('User has access');
   * }
   * ```
   */
  async checkUserAccess(
    protocolAddress: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      const contract = this.getReadOnlyContract();
      return await contract.hasAccess(protocolAddress, userAddress);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to check user access: ${errorMessage}`);
    }
  }
}

