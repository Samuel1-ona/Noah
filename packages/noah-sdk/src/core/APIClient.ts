import axios, { type AxiosInstance } from 'axios';
import type { Proof, Requirements, TransactionResult } from '../utils/types.js';

/**
 * APIClient configuration
 */
export interface APIClientConfig {
  baseURL?: string;
  timeout?: number;
  authToken?: string;
}

/**
 * Proof generation data
 */
export interface ProofGenerationData {
  credential: {
    age: number;
    jurisdiction: string | number;
    accredited: number; // 0 or 1
    credentialHash: string;
    userAddress?: string;
  };
  requirements: Requirements;
}

/**
 * Proof generation result
 */
export interface ProofGenerationResult {
  proof: Proof;
  publicSignals: string[]; // 13 elements
  credentialHash: string;
  success: boolean;
}

/**
 * Access status information
 */
export interface AccessStatus {
  hasAccess: boolean;
  protocolAddress: string;
  userAddress: string;
  credentialHash?: string;
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
 * APIClient - Handles backend API interactions
 * 
 * Provides methods for:
 * - Proof generation
 * - Credential management
 * - Protocol requirements retrieval
 * - Access checking
 */
export class APIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  /**
   * Create a new APIClient instance
   * @param config - Configuration options
   */
  constructor(config: APIClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || 'http://localhost:3000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000, // 30 seconds
    });

    if (config.authToken) {
      this.setAuthToken(config.authToken);
    }

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data as any,
      (error) => {
        const errorMessage =
          error.response?.data?.error?.message ||
          error.message ||
          'An error occurred';
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).response = error.response;
        (enhancedError as any).status = error.response?.status;
        if (error.response?.data) {
          (enhancedError as any).responseData = error.response.data;
        }
        return Promise.reject(enhancedError);
      }
    );
  }

  /**
   * Set authentication token
   * @param token - JWT token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Generate a ZK proof
   * @param proofData - Proof generation data
   * @returns Generated proof and public signals
   */
  async generateProof(
    proofData: ProofGenerationData
  ): Promise<ProofGenerationResult> {
    try {
      const response = await this.client.post('/proof/generate', proofData) as any;
      return {
        proof: response.proof,
        publicSignals: response.publicSignals || response.publicInputs || [],
        credentialHash: response.credentialHash || proofData.credential.credentialHash,
        success: response.success !== false,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate proof: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get protocol requirements
   * @param protocolAddress - Protocol contract address
   * @returns Protocol requirements
   */
  async getProtocolRequirements(
    protocolAddress: string
  ): Promise<Requirements> {
    try {
      const response = await this.client.get(
        `/user/protocol/${protocolAddress}/requirements`
      ) as any;
      return {
        minAge: Number(response.minAge),
        allowedJurisdictions: response.allowedJurisdictions || [],
        requireAccredited: response.requireAccredited || false,
        isSet: response.isSet !== false,
      };
    } catch (error) {
      throw new Error(
        `Failed to get protocol requirements: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check user access status
   * @param protocolAddress - Protocol contract address
   * @param userAddress - User's wallet address
   * @returns Access status information
   */
  async checkAccess(
    protocolAddress: string,
    userAddress: string
  ): Promise<AccessStatus> {
    try {
      const response = await this.client.get(
        `/user/access/${protocolAddress}/${userAddress}`
      ) as any;
      return {
        hasAccess: response.hasAccess || false,
        protocolAddress,
        userAddress,
        credentialHash: response.credentialHash,
      };
    } catch (error) {
      throw new Error(
        `Failed to check access: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Register a credential (issuer only)
   * @param credentialHash - Credential hash to register
   * @param userAddress - User's wallet address
   * @returns Transaction result
   */
  async registerCredential(
    credentialHash: string,
    userAddress: string
  ): Promise<TransactionResult> {
    try {
      const response = await this.client.post('/issuer/credential/register', {
        credentialHash,
        userAddress,
      }) as any;
      return {
        transactionHash: response.transactionHash,
        receipt: response.receipt || null,
      };
    } catch (error) {
      throw new Error(
        `Failed to register credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Revoke a credential (issuer only)
   * @param credentialHash - Credential hash to revoke
   * @returns Transaction result
   */
  async revokeCredential(
    credentialHash: string
  ): Promise<TransactionResult> {
    try {
      const response = await this.client.post('/issuer/credential/revoke', {
        credentialHash,
      }) as any;
      return {
        transactionHash: response.transactionHash,
        receipt: response.receipt || null,
      };
    } catch (error) {
      throw new Error(
        `Failed to revoke credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check credential status
   * @param credentialHash - Credential hash to check
   * @returns Credential status information
   */
  async checkCredential(credentialHash: string): Promise<CredentialStatus> {
    try {
      const response = await this.client.get(
        `/issuer/credential/check/${credentialHash}`
      ) as any;
      return {
        isValid: response.isValid || false,
        credentialHash,
        isRevoked: response.isRevoked || false,
        issuer: response.issuer,
      };
    } catch (error) {
      throw new Error(
        `Failed to check credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Health check
   * @returns Health status
   */
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    try {
      return await this.client.get('/health') as { status: string; timestamp: number };
    } catch (error) {
      throw new Error(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
