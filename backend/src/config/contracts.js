import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABIs
// Try local contracts directory first (for deployment), then fall back to out/ (for local dev)
const loadABI = (contractName) => {
  // First try: local contracts directory (for production deployment)
  try {
    const localAbiPath = join(__dirname, '../../contracts', `${contractName}.json`);
    const contractJson = JSON.parse(readFileSync(localAbiPath, 'utf8'));
    return contractJson.abi;
  } catch (localError) {
    // Fallback: try out/ directory (for local development)
    try {
      const abiPath = join(__dirname, '../../../out', `${contractName}.sol`, `${contractName}.json`);
      const contractJson = JSON.parse(readFileSync(abiPath, 'utf8'));
      return contractJson.abi;
    } catch (error) {
      console.error(`Error loading ABI for ${contractName}:`, error.message);
      return null;
    }
  }
};

// Contract addresses from deployments.json
let deployments;
try {
  deployments = JSON.parse(
    readFileSync(join(__dirname, '../../../deployments.json'), 'utf8')
  );
} catch (error) {
  console.error('Error loading deployments.json:', error.message);
  // Fallback to hardcoded addresses if file not found
  deployments = {
    contracts: {
      CredentialRegistry: process.env.CREDENTIAL_REGISTRY_ADDRESS || '0x5B005bC07121C9bbcD640da44a94Fa80dBf0Cc19',
      ZKVerifier: process.env.ZK_VERIFIER_ADDRESS || '0x0350078bACf0F37CD32b90Aa6920012F504d056b',
      ProtocolAccessControl: process.env.PROTOCOL_ACCESS_CONTROL_ADDRESS || '0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1',
    }
  };
}

export const CONTRACT_ADDRESSES = {
  CredentialRegistry: deployments.contracts.CredentialRegistry,
  ZKVerifier: deployments.contracts.ZKVerifier,
  ProtocolAccessControl: deployments.contracts.ProtocolAccessControl,
};

export const CONTRACT_ABIS = {
  CredentialRegistry: loadABI('CredentialRegistry'),
  ZKVerifier: loadABI('ZKVerifier'),
  ProtocolAccessControl: loadABI('ProtocolAccessControl'),
};

// Get provider with error handling for rate limiting
export const getProvider = () => {
  const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
  
  // Handle RPC errors gracefully (especially rate limiting)
  provider.on('error', (error) => {
    // Suppress rate limiting errors from event listeners
    if (error?.code === 'BAD_DATA' && error?.value?.[0]?.code === -32005) {
      // Rate limiting error - log but don't crash
      console.warn('RPC rate limit warning (non-critical):', error.message);
      return;
    }
    // Log other errors
    console.error('RPC provider error:', error.message);
  });
  
  return provider;
};

// Get signer (for transactions)
export const getSigner = (privateKey) => {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
};

// Get contract instances
export const getCredentialRegistry = (signerOrProvider) => {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.CredentialRegistry,
    CONTRACT_ABIS.CredentialRegistry,
    signerOrProvider
  );
};

export const getZKVerifier = (signerOrProvider) => {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ZKVerifier,
    CONTRACT_ABIS.ZKVerifier,
    signerOrProvider
  );
};

export const getProtocolAccessControl = (signerOrProvider) => {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ProtocolAccessControl,
    CONTRACT_ABIS.ProtocolAccessControl,
    signerOrProvider
  );
};

