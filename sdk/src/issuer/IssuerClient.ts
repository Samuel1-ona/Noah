import type { Signer } from 'ethers';
import type { TransactionResult, ContractAddresses } from '../utils/types';
import { ContractClient } from '../core/ContractClient';
import { APIClient } from '../core/APIClient';

/**
 * IssuerClient configuration options
 */
export interface IssuerClientConfig {
  apiBaseUrl?: string;
  contractAddresses?: Partial<ContractAddresses>;
  rpcUrl?: string;
}

/**
 * Credential status information
 */
export interface CredentialStatus {
  isValid: boolean;
  credentialHash: string;
  isRevoked: boolean;
  issuer?: string;
}

/**
 * IssuerClient - High-level API for credential issuers
 * 
 * Provides a simple interface for issuers to:
 * - Register credentials on-chain
 * - Revoke credentials
 * - Check credential status
 * 
 * @example
 * ```typescript
 * import { IssuerClient } from '@noah-protocol/sdk';
 * import { ethers } from 'ethers';
 * 
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const issuer = new IssuerClient(signer, { apiBaseUrl: 'https://api.noah.xyz' });
 * 
 * // Register credential
 * await issuer.registerCredential(credentialHash, userAddress);
 * 
 * // Revoke credential
 * await issuer.revokeCredential(credentialHash);
 * ```
 */
export class IssuerClient {
  private signer: Signer;
  private contractClient: ContractClient;
  private apiClient: APIClient;

  /**
   * Create a new IssuerClient instance
   * @param signer - Ethers.js signer from issuer's wallet
   * @param config - Optional configuration
   */
  constructor(signer: Signer, config: IssuerClientConfig = {}) {
    if (!signer) {
      throw new Error('Signer is required');
    }

    this.signer = signer;

    // Initialize ContractClient
    this.contractClient = new ContractClient({
      provider: signer.provider || undefined,
      contractAddresses: config.contractAddresses as ContractAddresses | undefined,
      rpcUrl: config.rpcUrl,
    });

    // Initialize APIClient
    this.apiClient = new APIClient({
      baseURL: config.apiBaseUrl,
    });
  }

  /**
   * Register a credential on-chain
   * 
   * @param credentialHash - The credential hash to register (bytes32)
   * @param userAddress - The user's wallet address
   * @param useAPI - If true, use backend API (gasless). If false, use direct contract call.
   * @returns Promise resolving to transaction result
   * 
   * @example
   * ```typescript
   * const tx = await issuer.registerCredential('0x1234...', '0x5678...');
   * console.log('Transaction hash:', tx.transactionHash);
   * ```
   */
  async registerCredential(
    credentialHash: string,
    userAddress: string,
    useAPI: boolean = false
  ): Promise<TransactionResult> {
    if (!credentialHash) {
      throw new Error('Credential hash is required');
    }

    if (!userAddress) {
      throw new Error('User address is required');
    }

    try {
      if (useAPI) {
        // Use backend API for gasless transactions
        return await this.apiClient.registerCredential(credentialHash, userAddress);
      } else {
        // Use direct contract call
        return await this.contractClient.registerCredential(
          this.signer,
          credentialHash,
          userAddress
        );
      }
    } catch (error: any) {
      throw new Error(
        `Failed to register credential: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Revoke a credential
   * 
   * @param credentialHash - The credential hash to revoke (bytes32)
   * @param useAPI - If true, use backend API (gasless). If false, use direct contract call.
   * @returns Promise resolving to transaction result
   * 
   * @example
   * ```typescript
   * const tx = await issuer.revokeCredential('0x1234...');
   * console.log('Transaction hash:', tx.transactionHash);
   * ```
   */
  async revokeCredential(
    credentialHash: string,
    useAPI: boolean = false
  ): Promise<TransactionResult> {
    if (!credentialHash) {
      throw new Error('Credential hash is required');
    }

    try {
      if (useAPI) {
        // Use backend API for gasless transactions
        return await this.apiClient.revokeCredential(credentialHash);
      } else {
        // Use direct contract call
        return await this.contractClient.revokeCredential(
          this.signer,
          credentialHash
        );
      }
    } catch (error: any) {
      throw new Error(
        `Failed to revoke credential: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Check credential status
   * 
   * @param credentialHash - The credential hash to check (bytes32)
   * @returns Promise resolving to credential status information
   * 
   * @example
   * ```typescript
   * const status = await issuer.checkCredential('0x1234...');
   * console.log('Is valid:', status.isValid);
   * console.log('Is revoked:', status.isRevoked);
   * ```
   */
  async checkCredential(credentialHash: string): Promise<CredentialStatus> {
    if (!credentialHash) {
      throw new Error('Credential hash is required');
    }

    try {
      // Check on-chain validity
      const isValid = await this.contractClient.isCredentialValid(credentialHash);
      
      // Get additional info from API if available
      try {
        const apiStatus = await this.apiClient.checkCredential(credentialHash);
        return {
          isValid: apiStatus.isValid && isValid,
          credentialHash,
          isRevoked: apiStatus.isRevoked,
          issuer: apiStatus.issuer,
        };
      } catch {
        // If API fails, return on-chain status
        return {
          isValid,
          credentialHash,
          isRevoked: !isValid,
        };
      }
    } catch (error: any) {
      throw new Error(
        `Failed to check credential: ${error.message || 'Unknown error'}`
      );
    }
  }
}
