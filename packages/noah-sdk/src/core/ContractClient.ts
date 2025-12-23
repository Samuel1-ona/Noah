import { 
  ethers, 
  type Provider, 
  type Signer, 
  type Contract,
  type ContractTransactionResponse
} from 'ethers';
import type {
  ContractAddresses,
  Requirements,
  IssuerInfo,
  Proof,
  ZKProof,
  TransactionResult,
  ContractClientConfig,
  EventCallback
} from '../utils/types.js';

/**
 * Contract ABIs (minimal for read operations)
 */
const CREDENTIAL_REGISTRY_ABI = [
  'function isCredentialValid(bytes32 credentialHash) view returns (bool)',
  'function credentials(bytes32) view returns (bool)',
  'function revokedCredentials(bytes32) view returns (bool)',
  'function credentialIssuers(bytes32) view returns (address)',
  'function getIssuerInfo(address issuer) view returns (bool isTrusted, string memory name)',
  'function registerCredential(bytes32 credentialHash, address user)',
  'function revokeCredential(bytes32 credentialHash)',
  'event CredentialIssued(address indexed user, bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
  'event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
] as const;

const PROTOCOL_ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function checkAccess(address user) view returns (bool)',
  'function getRequirements(address protocol) view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function protocolRequirements(address) view returns (uint256 minAge, bool requireAccredited, bool isSet)',
  'function userCredentials(address protocol, address user) view returns (bytes32)',
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function verifyAndGrantAccess(uint[2] a, uint[2][2] b, uint[2] c, uint[13] publicSignals, bytes32 credentialHash, address user)',
  'event AccessGranted(address indexed user, address indexed protocol, bytes32 indexed credentialHash, uint256 timestamp)',
  'event AccessRevoked(address indexed user, address indexed protocol, uint256 timestamp)',
  'event RequirementsSet(address indexed protocol, uint256 minAge, uint256[] allowedJurisdictions, bool requireAccredited)',
] as const;

/**
 * Contract Client Service
 * Handles direct smart contract interactions for read and write operations
 */
export class ContractClient {
  private provider: Provider | null = null;
  private credentialRegistry: Contract | null = null;
  private protocolAccessControl: Contract | null = null;
  private contractAddresses: ContractAddresses;
  private rpcUrl: string;

  /**
   * Create a new ContractClient instance
   * @param config - Configuration options including provider, contract addresses, and RPC URL
   */
  constructor(config?: ContractClientConfig) {
    // Default contract addresses (can be overridden via config)
    this.contractAddresses = config?.contractAddresses || {
      CredentialRegistry: '0x5d311f246ef87d24B045D961aA6da62a758514f7',
      ZKVerifier: '0x96f43E12280676866bBe13E0120Bb5892fCbfE0b',
      ProtocolAccessControl: '0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A',
    };
    
    this.rpcUrl = config?.rpcUrl || 'https://rpc.sepolia.mantle.xyz';
    
    // Initialize if provider is provided
    if (config?.provider) {
      this.initialize(config.provider);
    }
  }

  /**
   * Initialize provider and contracts
   * @param provider - Optional provider (defaults to RPC provider)
   */
  initialize(provider?: Provider): void {
    this.provider = provider || new ethers.JsonRpcProvider(this.rpcUrl);
    this.credentialRegistry = new ethers.Contract(
      this.contractAddresses.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      this.provider
    );
    this.protocolAccessControl = new ethers.Contract(
      this.contractAddresses.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      this.provider
    );
  }

  /**
   * Check if a credential is valid (exists and not revoked)
   * @param credentialHash - The credential hash to check (bytes32)
   * @returns Promise resolving to true if credential is valid
   * @throws Error if the contract call fails
   */
  async isCredentialValid(credentialHash: string): Promise<boolean> {
    if (!this.credentialRegistry) {
      this.initialize();
    }
    try {
      return await this.credentialRegistry!.isCredentialValid(credentialHash);
    } catch (error) {
      console.error('Error checking credential validity:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a protocol
   * @param protocolAddress - The protocol contract address
   * @param userAddress - The user's wallet address
   * @returns Promise resolving to true if user has access
   * @throws Error if the contract call fails
   */
  async hasAccess(protocolAddress: string, userAddress: string): Promise<boolean> {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    try {
      return await this.protocolAccessControl!.hasAccess(protocolAddress, userAddress);
    } catch (error) {
      console.error('Error checking access:', error);
      throw error;
    }
  }

  /**
   * Get protocol requirements
   * @param protocolAddress - The protocol contract address
   * @returns Promise resolving to Requirements object
   * @throws Error if the contract call fails
   */
  async getRequirements(protocolAddress: string): Promise<Requirements> {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    try {
      const [minAge, allowedJurisdictions, requireAccredited] = 
        await this.protocolAccessControl!.getRequirements(protocolAddress);
      return {
        minAge: Number(minAge),
        allowedJurisdictions: allowedJurisdictions.map((j: bigint) => j.toString()),
        requireAccredited,
      };
    } catch (error) {
      console.error('Error getting requirements:', error);
      throw error;
    }
  }

  /**
   * Get user's credential hash for a protocol
   * @param protocolAddress - The protocol contract address
   * @param userAddress - The user's wallet address
   * @returns Promise resolving to credential hash (bytes32)
   * @throws Error if the contract call fails
   */
  async getUserCredential(protocolAddress: string, userAddress: string): Promise<string> {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    try {
      return await this.protocolAccessControl!.userCredentials(protocolAddress, userAddress);
    } catch (error) {
      console.error('Error getting user credential:', error);
      throw error;
    }
  }

  /**
   * Get issuer information
   * @param issuerAddress - The issuer's wallet address
   * @returns Promise resolving to IssuerInfo object
   * @throws Error if the contract call fails
   */
  async getIssuerInfo(issuerAddress: string): Promise<IssuerInfo> {
    if (!this.credentialRegistry) {
      this.initialize();
    }
    try {
      const [isTrusted, name] = await this.credentialRegistry!.getIssuerInfo(issuerAddress);
      return { isTrusted, name };
    } catch (error) {
      console.error('Error getting issuer info:', error);
      throw error;
    }
  }

  /**
   * Listen for credential issued events
   * @param callback - Callback function to handle events
   * @returns Contract event listener
   */
  onCredentialIssued(callback: EventCallback): void {
    if (!this.credentialRegistry) {
      this.initialize();
    }
    this.credentialRegistry!.on('CredentialIssued', callback);
  }

  /**
   * Remove listener for credential issued events
   * @param callback - The callback function that was registered
   */
  offCredentialIssued(callback: EventCallback): void {
    if (this.credentialRegistry) {
      this.credentialRegistry.off('CredentialIssued', callback);
    }
  }

  /**
   * Listen for access granted events
   * @param callback - Callback function to handle events
   * @returns Contract event listener
   */
  onAccessGranted(callback: EventCallback): void {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    this.protocolAccessControl!.on('AccessGranted', callback);
  }

  /**
   * Remove listener for access granted events
   * @param callback - The callback function that was registered
   */
  offAccessGranted(callback: EventCallback): void {
    if (this.protocolAccessControl) {
      this.protocolAccessControl.off('AccessGranted', callback);
    }
  }

  /**
   * Set protocol requirements (requires signer)
   * @param signer - The signer (from user's wallet)
   * @param minAge - Minimum age required
   * @param allowedJurisdictions - Array of jurisdiction hashes (as strings or numbers)
   * @param requireAccredited - Whether accredited status is required
   * @returns Promise resolving to TransactionResult with hash and receipt
   * @throws Error if signer is not provided or transaction fails
   */
  async setRequirements(
    signer: Signer,
    minAge: number,
    allowedJurisdictions: (string | number)[],
    requireAccredited: boolean
  ): Promise<TransactionResult> {
    if (!signer) {
      throw new Error('Signer is required to set requirements');
    }

    // Initialize contract with signer
    const accessControl = new ethers.Contract(
      this.contractAddresses.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      signer
    );

    // Convert jurisdictions to BigInt array
    const jurisdictionsArray = allowedJurisdictions.map(j => {
      if (typeof j === 'string') {
        return BigInt(j);
      }
      return BigInt(j);
    });

    try {
      const tx = await accessControl.setRequirements(
        BigInt(minAge),
        jurisdictionsArray,
        requireAccredited
      ) as ContractTransactionResponse;
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      
      return {
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Error setting requirements:', error);
      throw error;
    }
  }

  /**
   * Register a credential (requires issuer signer)
   * @param signer - The signer (from issuer's wallet)
   * @param credentialHash - The credential hash (bytes32)
   * @param userAddress - The user's address
   * @returns Promise resolving to TransactionResult with hash and receipt
   * @throws Error if signer is not provided or transaction fails
   */
  async registerCredential(
    signer: Signer,
    credentialHash: string,
    userAddress: string
  ): Promise<TransactionResult> {
    if (!signer) {
      throw new Error('Signer is required to register credential');
    }

    // Initialize contract with signer
    const credentialRegistry = new ethers.Contract(
      this.contractAddresses.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      signer
    );

    try {
      const tx = await credentialRegistry.registerCredential(
        credentialHash, 
        userAddress
      ) as ContractTransactionResponse;
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      
      return {
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Error registering credential:', error);
      throw error;
    }
  }

  /**
   * Revoke a credential (requires issuer signer)
   * @param signer - The signer (from issuer's wallet)
   * @param credentialHash - The credential hash (bytes32)
   * @returns Promise resolving to TransactionResult with hash and receipt
   * @throws Error if signer is not provided or transaction fails
   */
  async revokeCredential(
    signer: Signer,
    credentialHash: string
  ): Promise<TransactionResult> {
    if (!signer) {
      throw new Error('Signer is required to revoke credential');
    }

    // Initialize contract with signer
    const credentialRegistry = new ethers.Contract(
      this.contractAddresses.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      signer
    );

    try {
      const tx = await credentialRegistry.revokeCredential(credentialHash) as ContractTransactionResponse;
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      
      return {
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw error;
    }
  }

  /**
   * Verify proof and grant access (requires protocol signer)
   * @param signer - The signer (from protocol's wallet)
   * @param proof - Proof object with a, b, c arrays
   * @param publicSignals - Public signals array (13 elements)
   * @param credentialHash - The credential hash (bytes32)
   * @param userAddress - The user's address
   * @returns Promise resolving to TransactionResult with hash and receipt
   * @throws Error if signer is not provided or transaction fails
   */
  async verifyAndGrantAccess(
    signer: Signer,
    proof: Proof | ZKProof,
    publicSignals: (string | number)[],
    credentialHash: string,
    userAddress: string
  ): Promise<TransactionResult> {
    if (!signer) {
      throw new Error('Signer is required to verify and grant access');
    }

    // Initialize contract with signer
    const accessControl = new ethers.Contract(
      this.contractAddresses.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      signer
    );

    // Convert proof arrays to BigInt arrays
    const a: [bigint, bigint] = [BigInt(proof.a[0]), BigInt(proof.a[1])];
    const b: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
      [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])]
    ];
    const c: [bigint, bigint] = [BigInt(proof.c[0]), BigInt(proof.c[1])];

    // Convert public signals to BigInt array (13 elements)
    const publicSignalsArray = publicSignals.slice(0, 13).map(s => BigInt(s));

    try {
      const tx = await accessControl.verifyAndGrantAccess(
        a,
        b,
        c,
        publicSignalsArray,
        credentialHash,
        userAddress
      ) as ContractTransactionResponse;
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      
      return {
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Error verifying proof and granting access:', error);
      throw error;
    }
  }

  /**
   * Get the current provider
   * @returns The current provider or null if not initialized
   */
  getProvider(): Provider | null {
    return this.provider;
  }

  /**
   * Get the credential registry contract instance
   * @returns The credential registry contract or null if not initialized
   */
  getCredentialRegistry(): Contract | null {
    return this.credentialRegistry;
  }

  /**
   * Get the protocol access control contract instance
   * @returns The protocol access control contract or null if not initialized
   */
  getProtocolAccessControl(): Contract | null {
    return this.protocolAccessControl;
  }
}
