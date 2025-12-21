import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, RPC_URL } from '../config/constants.js';

// Contract ABIs (minimal for read operations)
const CREDENTIAL_REGISTRY_ABI = [
  'function isCredentialValid(bytes32 credentialHash) view returns (bool)',
  'function credentials(bytes32) view returns (bool)',
  'function revokedCredentials(bytes32) view returns (bool)',
  'function credentialIssuers(bytes32) view returns (address)',
  'function getIssuerInfo(address issuer) view returns (bool isTrusted, string memory name)',
  'event CredentialIssued(address indexed user, bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
  'event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
];

const PROTOCOL_ACCESS_CONTROL_ABI = [
  'function hasAccess(address protocol, address user) view returns (bool)',
  'function checkAccess(address user) view returns (bool)',
  'function getRequirements(address protocol) view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function protocolRequirements(address) view returns (uint256 minAge, bool requireAccredited, bool isSet)',
  'function userCredentials(address protocol, address user) view returns (bytes32)',
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
}

// Export singleton instance
export default new ContractClient();

