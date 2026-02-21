import type { Signer } from 'ethers';
import type { Requirements, ZKProof, TransactionResult, ContractAddresses } from '../utils/types';
import { ContractClient } from '../core/ContractClient';
import { ProofGenerator, type ProverInput } from './ProofGenerator';
import { IdentityManager } from '../utils/identity';
import { jurisdictionStringToHash } from '../utils/jurisdiction';
import { generateCredentialHash } from '../utils/credentials';

/**
 * Credential data structure for proof generation
 */
export interface Credential {
  credentialHash: string;
  age: number;
  jurisdiction: string | number;
  accredited: number; // 0 or 1
  passportNumber?: string;
  expiryDate?: number;
  userAddress?: string;
}

/**
 * Proof generation result
 */
export interface ProofResult {
  proof: ZKProof;
  publicSignals: string[]; // 28 elements
  nullifier: string;
  packedFlags: number;
  credentialHash: string;
  success: boolean;
}

/**
 * UserClient configuration options
 */
export interface UserClientConfig {
  contractAddresses?: Partial<ContractAddresses>;
  rpcUrl?: string;
  wasmUrl?: string;
  mockMode?: boolean;
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
 * const user = new UserClient(signer);
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
  private proofGenerator: ProofGenerator;
  private mockMode: boolean;
  private wasmUrl?: string;
  private identityManager: IdentityManager;

  constructor(signer: Signer, config: UserClientConfig = {}) {
    if (!signer) {
      throw new Error('Signer is required');
    }

    this.signer = signer;
    this.mockMode = config.mockMode || false;
    this.wasmUrl = config.wasmUrl;

    this.contractClient = new ContractClient({
      provider: signer.provider || undefined,
      contractAddresses: config.contractAddresses as ContractAddresses | undefined,
      rpcUrl: config.rpcUrl,
    });

    this.proofGenerator = new ProofGenerator();
    this.identityManager = new IdentityManager();
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
    if (this.mockMode) {
      return this.generateMockProof(credential, requirements);
    }

    // 1. Pre-flight checks
    await this.performPreFlightChecks(credential, requirements);

    try {
      // 2. Prepare inputs for Gnark circuit
      const jurisdictionValue = typeof credential.jurisdiction === 'string'
        ? BigInt(jurisdictionStringToHash(credential.jurisdiction))
        : BigInt(credential.jurisdiction);

      const userAddr = await this.signer.getAddress();
      const passportNum = BigInt('0x' + Buffer.from(credential.passportNumber || '0').toString('hex'));

      const input: ProverInput = {
        actualAge: credential.age,
        actualJurisdiction: Number(jurisdictionValue),
        actualAccredited: credential.accredited,
        credentialHash: credential.credentialHash,
        passportNumber: passportNum.toString(),
        expiryDate: 20300101, // Placeholder: YYYYMMDD
        minAge: requirements.minAge,
        recipientAddress: BigInt(userAddr).toString(),
        currentDate: Math.floor(Date.now() / 1000),
        allowedJurisdictions: (requirements.allowedJurisdictions || []).map(j => Number(BigInt(j))),
        sanctionedCountries: [], // To be populated from on-chain or config
        requireAccredited: requirements.requireAccredited ? 1 : 0,
        credentialHashPublic: credential.credentialHash
      };

      // 3. Load and execute WASM prover
      await this.proofGenerator.loadProver(this.wasmUrl);
      const result = await this.proofGenerator.generateProof(input);

      return {
        proof: result.proof,
        publicSignals: result.publicSignals,
        nullifier: result.nullifier,
        packedFlags: result.packedFlags,
        credentialHash: credential.credentialHash,
        success: result.success,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate proof: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * High-level method to generate proof directly from an image (OCR -> MRZ -> ZK)
   * 
   * @param imageSource - URL, File, or Blob of the document image
   * @param requirements - Protocol requirements
   * @returns Promise resolving to proof result
   */
  async proveFromImage(
    imageSource: string | File | Blob,
    requirements: Requirements & { protocolAddress: string }
  ): Promise<ProofResult> {
    if (this.mockMode) {
      // Mock credential for testing
      const mockCredential: Credential = {
        credentialHash: generateCredentialHash({
          userAddress: 'mock-user',
          age: 25,
          jurisdiction: 'US',
          accredited: true
        }).credentialHash,
        age: 25,
        jurisdiction: 'US',
        accredited: 1,
        passportNumber: 'P12345678',
      };
      return this.generateMockProof(mockCredential, requirements);
    }

    try {
      // 1. Extract data via OCR
      const profile = await this.identityManager.extractFromImage(imageSource);

      // 2. Prepare credential
      const credential: Credential = {
        credentialHash: generateCredentialHash({
          userAddress: await this.signer.getAddress(),
          age: profile.age,
          jurisdiction: profile.nationality,
          accredited: false // Default non-accredited, can be updated if logic allows
        }).credentialHash,
        age: profile.age,
        jurisdiction: profile.nationality,
        accredited: 0,
        passportNumber: profile.passportNumber,
        expiryDate: Math.floor(profile.expiryDate.getTime() / 1000)
      };

      // 3. Generate proof
      return await this.generateProof(credential, requirements);
    } catch (error: any) {
      throw new Error(`Failed to prove from image: ${error.message}`);
    } finally {
      await this.identityManager.cleanup();
    }
  }

  private async performPreFlightChecks(credential: Credential, requirements: Requirements) {
    // Check if credential is valid on-chain
    const isValid = await this.contractClient.isCredentialValid(credential.credentialHash);
    if (!isValid) throw new Error('Credential is not valid or has been revoked');

    // Check if nullifier is already used (if we can derive it here)
    // In production, the nullifier should be derived the same way as in the circuit
    // const nullifier = deriveNullifier(credential.passportNumber, requirements.protocolAddress);
    // const isUsed = await this.contractClient.isNullifierUsed(nullifier);
    // if (isUsed) throw new Error('This document has already been used for this protocol');
  }

  private async generateMockProof(credential: Credential, requirements: Requirements): Promise<ProofResult> {
    console.log('[MockMode] Generating proof for', credential.credentialHash);
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      proof: { a: ["0", "0"], b: [["0", "0"], ["0", "0"]], c: ["0", "0"] } as ZKProof,
      publicSignals: new Array(28).fill("0"),
      nullifier: "0xmocknullifier" + Math.random().toString(16).substring(2, 8),
      packedFlags: 15,
      credentialHash: credential.credentialHash,
      success: true
    };
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

