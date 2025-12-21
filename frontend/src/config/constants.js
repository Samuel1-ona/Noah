// Try to load contract addresses from deployments.json
let deployments = null;
try {
  // In production, this would be loaded via fetch or build-time injection
  // For now, we'll use environment variables as fallback
  if (typeof window !== 'undefined') {
    // Attempt to fetch deployments.json (if served from public folder)
    // This is handled at build/runtime, not here
  }
} catch (error) {
  console.warn('Could not load deployments.json:', error);
}

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Blockchain Configuration
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '5003');
export const NETWORK = import.meta.env.VITE_NETWORK || 'mantle-sepolia';

// Contract Addresses (from env vars or defaults from deployments.json)
export const CONTRACT_ADDRESSES = {
  CredentialRegistry: import.meta.env.VITE_CREDENTIAL_REGISTRY_ADDRESS || '0x5d311f246ef87d24B045D961aA6da62a758514f7',
  ZKVerifier: import.meta.env.VITE_ZK_VERIFIER_ADDRESS || '0x96f43E12280676866bBe13E0120Bb5892fCbfE0b',
  ProtocolAccessControl: import.meta.env.VITE_PROTOCOL_ACCESS_CONTROL_ADDRESS || '0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A',
};

// Mantle Sepolia Chain Configuration
export const MANTLE_SEPOLIA = {
  id: CHAIN_ID,
  name: 'Mantle Sepolia Testnet',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Issuer endpoints
  registerCredential: '/issuer/credential/register',
  revokeCredential: '/issuer/credential/revoke',
  checkCredential: '/issuer/credential/check',
  
  // User endpoints
  getProtocolRequirements: '/user/protocol',
  checkAccess: '/user/access',
  
  // Protocol endpoints
  setRequirements: '/protocol/requirements/set',
  getRequirements: '/protocol/requirements',
  verifyAccess: '/protocol/access/verify',
  revokeAccess: '/protocol/access/revoke',
  
  // Proof endpoints
  generateProof: '/proof/generate',
  getProofs: '/proof/credential',
  
  // Health check
  health: '/health',
};
