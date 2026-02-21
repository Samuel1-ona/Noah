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
  error?: string;
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
 */
export class APIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(config: APIClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || 'http://localhost:3000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000,
    });

    if (config.authToken) {
      this.setAuthToken(config.authToken);
    }

    this.client.interceptors.response.use(
      (response) => response.data as any,
      (error) => {
        const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  async generateProof(proofData: ProofGenerationData): Promise<ProofGenerationResult> {
    try {
      const response = await this.client.post('/proof/generate', proofData) as any;
      return {
        proof: response.proof,
        publicSignals: response.publicSignals || response.publicInputs || [],
        credentialHash: response.credentialHash || proofData.credential.credentialHash,
        success: response.success !== false,
      };
    } catch (error) {
      throw new Error(`Failed to generate proof: ${error}`);
    }
  }

  async generateAgeProof(data: {
    mrzData: any;
    minAge: number;
    recipientAddress: string;
  }): Promise<ProofGenerationResult> {
    return this.generateProof({
      credential: {
        age: 0,
        jurisdiction: "",
        accredited: 0,
        credentialHash: "",
        userAddress: data.recipientAddress
      },
      requirements: {
        minAge: data.minAge,
        allowedJurisdictions: [],
        requireAccredited: false
      }
    });
  }

  async getProtocolRequirements(protocolAddress: string): Promise<Requirements> {
    const response = await this.client.get(`/user/protocol/${protocolAddress}/requirements`) as any;
    return {
      minAge: Number(response.minAge),
      allowedJurisdictions: response.allowedJurisdictions || [],
      requireAccredited: response.requireAccredited || false,
      isSet: response.isSet !== false,
    };
  }

  async checkAccess(protocolAddress: string, userAddress: string): Promise<AccessStatus> {
    const response = await this.client.get(`/user/access/${protocolAddress}/${userAddress}`) as any;
    return {
      hasAccess: response.hasAccess || false,
      protocolAddress,
      userAddress,
      credentialHash: response.credentialHash,
    };
  }

  async registerCredential(credentialHash: string, userAddress: string): Promise<TransactionResult> {
    const response = await this.client.post('/issuer/credential/register', { credentialHash, userAddress }) as any;
    return { transactionHash: response.transactionHash, receipt: response.receipt || null };
  }

  async revokeCredential(credentialHash: string): Promise<TransactionResult> {
    const response = await this.client.post('/issuer/credential/revoke', { credentialHash }) as any;
    return { transactionHash: response.transactionHash, receipt: response.receipt || null };
  }

  async checkCredential(credentialHash: string): Promise<CredentialStatus> {
    const response = await this.client.get(`/issuer/credential/check/${credentialHash}`) as any;
    return {
      isValid: response.isValid || false,
      credentialHash,
      isRevoked: response.isRevoked || false,
      issuer: response.issuer,
    };
  }
}
