import {
  ethers,
  BrowserProvider,
  JsonRpcProvider,
  type Provider,
  type Signer,
  type Contract,
  type ContractTransactionResponse,
  type Eip1193Provider
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
 * Contract ABIs (synchronized with production contracts)
 */
const CREDENTIAL_REGISTRY_ABI = [
  'function isCredentialValid(bytes32 credentialHash) view returns (bool)',
  'function credentials(bytes32) view returns (bool)',
  'function revokedCredentials(bytes32) view returns (bool)',
  'function trustedIssuers(address) view returns (bool)',
  'function issuerNames(address) view returns (string)',
  'function credentialIssuers(bytes32) view returns (address)',
  'function nullifierOwners(bytes32) view returns (address)',
  'function userToCredential(address) view returns (bytes32)',
  'function registerCredential(bytes32 credentialHash, address user)',
  'function registerNullifier(bytes32 nullifier, bytes32 credentialHash, address user)',
  'function revokeCredential(bytes32 credentialHash)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event CredentialIssued(address indexed user, bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
  'event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
  'event NullifierRegistered(bytes32 indexed nullifier, bytes32 indexed credentialHash, address indexed user)',
] as const;

const PROTOCOL_ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function checkAccess(address user) view returns (bool)',
  'function protocolRequirements(address) view returns (uint256 minAge, bool requireAccredited, bool isSet)',
  'function userCredentials(address protocol, address user) view returns (bytes32)',
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function verifyAndGrantAccess(uint[2] a, uint[2][2] b, uint[2] c, uint[28] publicSignals, bytes32 credentialHash, address user)',
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
    this.contractAddresses = config?.contractAddresses || {
      CredentialRegistry: '0xa4DfF80B4a1D748BF28BC4A271eD834689Ea3407',
      ZKVerifier: '0xA4cD3b0Eb6E5Ab5d8CE4065BcCD70040ADAB1F00',
      ProtocolAccessControl: '0xe336d36FacA76840407e6836d26119E1EcE0A2b4',
    };

    this.rpcUrl = config?.rpcUrl || 'http://127.0.0.1:9650/ext/bc/noah/rpc';

    if (config?.provider) {
      this.initialize(config.provider);
    }
  }

  /**
   * Initialize provider and contracts with robust support for various provider types
   * @param inputProvider - EIP-1193 provider (window.ethereum), Ethers Provider, or custom
   */
  initialize(inputProvider?: any): void {
    if (!inputProvider) {
      this.provider = new JsonRpcProvider(this.rpcUrl);
    } else if (inputProvider.request) {
      // It's an EIP-1193 provider (MetaMask, etc.)
      this.provider = new BrowserProvider(inputProvider as Eip1193Provider);
    } else {
      // Assume it's already an ethers-compatible provider
      this.provider = inputProvider as Provider;
    }

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
   * Pre-flight validation for proof inputs
   */
  validateProofInput(publicSignals: (string | number)[]): void {
    if (!publicSignals || publicSignals.length < 28) {
      throw new Error(`Invalid public signals length: expected 28, got ${publicSignals?.length || 0}`);
    }
    // Check isValid bit
    if (publicSignals[25] != "1" && publicSignals[25] != 1) {
      throw new Error("ZK Proof internal validation failed (isValid signal is not 1)");
    }
  }

  async isCredentialValid(credentialHash: string): Promise<boolean> {
    if (!this.credentialRegistry) this.initialize();
    try {
      return await this.credentialRegistry!.isCredentialValid(credentialHash);
    } catch (error) {
      throw new Error(`Failed to check credential validity: ${error}`);
    }
  }

  async isNullifierUsed(nullifier: string): Promise<boolean> {
    if (!this.credentialRegistry) this.initialize();
    try {
      const owner = await this.credentialRegistry!.nullifierOwners(nullifier);
      return owner !== ethers.ZeroAddress;
    } catch (error) {
      throw new Error(`Failed to check nullifier status: ${error}`);
    }
  }

  async getCredentialByUser(userAddress: string): Promise<string> {
    if (!this.credentialRegistry) this.initialize();
    try {
      return await this.credentialRegistry!.userToCredential(userAddress);
    } catch (error) {
      throw new Error(`Failed to get credential by user: ${error}`);
    }
  }

  async hasAccess(protocolAddress: string, userAddress: string): Promise<boolean> {
    if (!this.protocolAccessControl) this.initialize();
    try {
      return await this.protocolAccessControl!.hasAccess(protocolAddress, userAddress);
    } catch (error) {
      throw new Error(`Failed to check access: ${error}`);
    }
  }

  async getRequirements(protocolAddress: string): Promise<Requirements> {
    if (!this.protocolAccessControl) this.initialize();
    try {
      const [minAge, requireAccredited, isSet] =
        await this.protocolAccessControl!.protocolRequirements(protocolAddress);

      return {
        minAge: Number(minAge),
        allowedJurisdictions: [],
        requireAccredited,
        isSet,
      };
    } catch (error) {
      throw new Error(`Failed to get protocol requirements: ${error}`);
    }
  }

  async getUserCredential(protocolAddress: string, userAddress: string): Promise<string> {
    if (!this.protocolAccessControl) this.initialize();
    try {
      return await this.protocolAccessControl!.userCredentials(protocolAddress, userAddress);
    } catch (error) {
      throw new Error(`Failed to get user credential: ${error}`);
    }
  }

  async registerCredential(
    signer: Signer,
    credentialHash: string,
    userAddress: string
  ): Promise<TransactionResult> {
    if (!signer) throw new Error('Signer is required');
    const contract = new ethers.Contract(this.contractAddresses.CredentialRegistry, CREDENTIAL_REGISTRY_ABI, signer);
    try {
      const tx = await contract.registerCredential(credentialHash, userAddress) as ContractTransactionResponse;
      const receipt = await tx.wait();
      return { transactionHash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to register credential: ${error}`);
    }
  }

  async revokeCredential(
    signer: Signer,
    credentialHash: string
  ): Promise<TransactionResult> {
    if (!signer) throw new Error('Signer is required');
    const contract = new ethers.Contract(this.contractAddresses.CredentialRegistry, CREDENTIAL_REGISTRY_ABI, signer);
    try {
      const tx = await contract.revokeCredential(credentialHash) as ContractTransactionResponse;
      const receipt = await tx.wait();
      return { transactionHash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to revoke credential: ${error}`);
    }
  }

  async verifyAndGrantAccess(
    signer: Signer,
    proof: Proof | ZKProof,
    publicSignals: (string | number)[],
    credentialHash: string,
    userAddress: string
  ): Promise<TransactionResult> {
    if (!signer) throw new Error('Signer is required to verify and grant access');

    // Pre-flight check
    this.validateProofInput(publicSignals);

    const accessControl = new ethers.Contract(
      this.contractAddresses.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      signer
    );

    const a: [bigint, bigint] = [BigInt(proof.a[0]), BigInt(proof.a[1])];
    const b: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
      [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])]
    ];
    const c: [bigint, bigint] = [BigInt(proof.c[0]), BigInt(proof.c[1])];

    const publicSignalsArray = publicSignals.slice(0, 28).map(s => BigInt(s));

    try {
      const tx = await accessControl.verifyAndGrantAccess(
        a, b, c,
        publicSignalsArray,
        credentialHash,
        userAddress
      ) as ContractTransactionResponse;

      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction failed: No receipt returned');

      return {
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      throw new Error(`Contract verification failed: ${error}`);
    }
  }

  getProvider(): Provider | null { return this.provider; }
}
