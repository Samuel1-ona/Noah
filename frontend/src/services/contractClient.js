import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, RPC_URL } from '../config/constants.js';

// Contract ABIs (minimal for read operations)
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
];

const PROTOCOL_ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function checkAccess(address user) view returns (bool)',
  'function getRequirements(address protocol) view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function protocolRequirements(address) view returns (uint256 minAge, bool requireAccredited, bool isSet)',
  'function userCredentials(address protocol, address user) view returns (bytes32)',
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function verifyAndGrantAccess(uint[2] a, uint[2][2] b, uint[2] c, uint[13] publicSignals, bytes32 credentialHash, address user)',
  'event AccessGranted(address indexed user, address indexed protocol, bytes32 credentialHash, uint256 timestamp)',
  'event AccessRevoked(address indexed user, address indexed protocol, uint256 timestamp)',
  'event RequirementsSet(address indexed protocol, uint256 minAge, uint256[] allowedJurisdictions, bool requireAccredited)',
];

/**
 * Contract Client Service
 * Handles direct smart contract interactions for read operations
 */
class ContractClient {
  constructor() {
    this.provider = null;
    this.credentialRegistry = null;
    this.protocolAccessControl = null;
  }

  /**
   * Initialize provider and contracts
   * @param {ethers.Provider} provider - Optional provider (defaults to RPC provider)
   */
  initialize(provider = null) {
    this.provider = provider || new ethers.JsonRpcProvider(RPC_URL);
    this.credentialRegistry = new ethers.Contract(
      CONTRACT_ADDRESSES.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      this.provider
    );
    this.protocolAccessControl = new ethers.Contract(
      CONTRACT_ADDRESSES.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      this.provider
    );
  }

  /**
   * Check if a credential is valid (exists and not revoked)
   * @param {string} credentialHash - The credential hash to check
   * @returns {Promise<boolean>} True if credential is valid
   */
  async isCredentialValid(credentialHash) {
    if (!this.credentialRegistry) {
      this.initialize();
    }
    try {
      return await this.credentialRegistry.isCredentialValid(credentialHash);
    } catch (error) {
      console.error('Error checking credential validity:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a protocol
   * @param {string} protocolAddress - The protocol contract address
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<boolean>} True if user has access
   */
  async hasAccess(protocolAddress, userAddress) {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    try {
      return await this.protocolAccessControl.hasAccess(protocolAddress, userAddress);
    } catch (error) {
      console.error('Error checking access:', error);
      throw error;
    }
  }

  /**
   * Get protocol requirements
   * @param {string} protocolAddress - The protocol contract address
   * @returns {Promise<Object>} Requirements object
   */
  async getRequirements(protocolAddress) {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    try {
      const [minAge, allowedJurisdictions, requireAccredited] = 
        await this.protocolAccessControl.getRequirements(protocolAddress);
      return {
        minAge: Number(minAge),
        allowedJurisdictions: allowedJurisdictions.map(j => j.toString()),
        requireAccredited,
      };
    } catch (error) {
      console.error('Error getting requirements:', error);
      throw error;
    }
  }

  /**
   * Get user's credential hash for a protocol
   * @param {string} protocolAddress - The protocol contract address
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<string>} Credential hash (bytes32)
   */
  async getUserCredential(protocolAddress, userAddress) {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    try {
      return await this.protocolAccessControl.userCredentials(protocolAddress, userAddress);
    } catch (error) {
      console.error('Error getting user credential:', error);
      throw error;
    }
  }

  /**
   * Get issuer information
   * @param {string} issuerAddress - The issuer's wallet address
   * @returns {Promise<Object>} Issuer info {isTrusted, name}
   */
  async getIssuerInfo(issuerAddress) {
    if (!this.credentialRegistry) {
      this.initialize();
    }
    try {
      const [isTrusted, name] = await this.credentialRegistry.getIssuerInfo(issuerAddress);
      return { isTrusted, name };
    } catch (error) {
      console.error('Error getting issuer info:', error);
      throw error;
    }
  }

  /**
   * Listen for credential issued events
   * @param {Function} callback - Callback function to handle events
   * @returns {Promise<ethers.ContractEventPayload>} Event listener
   */
  async onCredentialIssued(callback) {
    if (!this.credentialRegistry) {
      this.initialize();
    }
    return this.credentialRegistry.on('CredentialIssued', callback);
  }

  /**
   * Listen for access granted events
   * @param {Function} callback - Callback function to handle events
   * @returns {Promise<ethers.ContractEventPayload>} Event listener
   */
  async onAccessGranted(callback) {
    if (!this.protocolAccessControl) {
      this.initialize();
    }
    return this.protocolAccessControl.on('AccessGranted', callback);
  }

  /**
   * Set protocol requirements (requires signer)
   * @param {ethers.Signer} signer - The signer (from user's wallet)
   * @param {number} minAge - Minimum age required
   * @param {string[]|number[]} allowedJurisdictions - Array of jurisdiction hashes (as strings or numbers)
   * @param {boolean} requireAccredited - Whether accredited status is required
   * @returns {Promise<Object>} Transaction receipt with hash
   */
  async setRequirements(signer, minAge, allowedJurisdictions, requireAccredited) {
    if (!signer) {
      throw new Error('Signer is required to set requirements');
    }

    // Initialize contract with signer
    const accessControl = new ethers.Contract(
      CONTRACT_ADDRESSES.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      signer
    );

    // Convert jurisdictions to BigInt array
    const jurisdictionsArray = allowedJurisdictions.map(j => {
      if (typeof j === 'string') {
        if (j.startsWith('0x')) {
          return BigInt(j);
        }
        return BigInt(j);
      }
      return BigInt(j);
    });

    try {
      const tx = await accessControl.setRequirements(
        BigInt(minAge),
        jurisdictionsArray,
        requireAccredited
      );
      
      const receipt = await tx.wait();
      
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
   * @param {ethers.Signer} signer - The signer (from issuer's wallet)
   * @param {string} credentialHash - The credential hash (bytes32)
   * @param {string} userAddress - The user's address
   * @returns {Promise<Object>} Transaction receipt with hash
   */
  async registerCredential(signer, credentialHash, userAddress) {
    if (!signer) {
      throw new Error('Signer is required to register credential');
    }

    // Initialize contract with signer
    const credentialRegistry = new ethers.Contract(
      CONTRACT_ADDRESSES.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      signer
    );

    try {
      const tx = await credentialRegistry.registerCredential(credentialHash, userAddress);
      const receipt = await tx.wait();
      
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
   * @param {ethers.Signer} signer - The signer (from issuer's wallet)
   * @param {string} credentialHash - The credential hash (bytes32)
   * @returns {Promise<Object>} Transaction receipt with hash
   */
  async revokeCredential(signer, credentialHash) {
    if (!signer) {
      throw new Error('Signer is required to revoke credential');
    }

    // Initialize contract with signer
    const credentialRegistry = new ethers.Contract(
      CONTRACT_ADDRESSES.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      signer
    );

    try {
      const tx = await credentialRegistry.revokeCredential(credentialHash);
      const receipt = await tx.wait();
      
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
   * @param {ethers.Signer} signer - The signer (from protocol's wallet)
   * @param {Object} proof - Proof object with a, b, c arrays
   * @param {string[]} publicSignals - Public signals array (13 elements)
   * @param {string} credentialHash - The credential hash (bytes32)
   * @param {string} userAddress - The user's address
   * @returns {Promise<Object>} Transaction receipt with hash
   */
  async verifyAndGrantAccess(signer, proof, publicSignals, credentialHash, userAddress) {
    if (!signer) {
      throw new Error('Signer is required to verify and grant access');
    }

    // Initialize contract with signer
    const accessControl = new ethers.Contract(
      CONTRACT_ADDRESSES.ProtocolAccessControl,
      PROTOCOL_ACCESS_CONTROL_ABI,
      signer
    );

    // Convert proof arrays to BigInt arrays
    const a = [BigInt(proof.a[0]), BigInt(proof.a[1])];
    const b = [
      [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
      [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])]
    ];
    const c = [BigInt(proof.c[0]), BigInt(proof.c[1])];

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
      );
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Error verifying proof and granting access:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ContractClient();

