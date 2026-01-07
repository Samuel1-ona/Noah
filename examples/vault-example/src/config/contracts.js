// Contract addresses configuration
// This file loads contract addresses from contracts.json

let contractsConfig = null;

// Load contracts.json
async function loadContractsConfig() {
  if (contractsConfig) {
    return contractsConfig;
  }

  try {
    const response = await fetch('/contracts.json');
    const config = await response.json();
    contractsConfig = config;
    return config;
  } catch (error) {
    console.warn('Failed to load contracts.json, using defaults:', error);
    // Fallback to environment variables or defaults
    const defaultConfig = {
      network: 'mantle-sepolia',
      chainId: 5003,
      contracts: {
        Vault: import.meta.env.VITE_VAULT_ADDRESS || '0x216896Cab28d2DbAB19cA3f08f36daD40705e9AF',
        ProtocolAccessControl: import.meta.env.VITE_PROTOCOL_ACCESS_CONTROL_ADDRESS || '0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A',
        CredentialRegistry: '0x5d311f246ef87d24B045D961aA6da62a758514f7',
      },
      // API base URL from environment variable only
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    };
    contractsConfig = defaultConfig;
    return defaultConfig;
  }
}

// Get contract address
export async function getContractAddress(contractName) {
  const config = await loadContractsConfig();
  return config.contracts[contractName] || '';
}

// Get all contracts
export async function getContracts() {
  const config = await loadContractsConfig();
  return config.contracts;
}

// Get vault address (most common use case)
export async function getVaultAddress() {
  return await getContractAddress('Vault');
}

// Get credential hash (if configured)
export async function getCredentialHash() {
  const config = await loadContractsConfig();
  return config.credentialHash || import.meta.env.VITE_CREDENTIAL_HASH || '';
}

// Get API base URL
export async function getApiBaseUrl() {
  // Only use environment variable, no hardcoded defaults
  return import.meta.env.VITE_API_BASE_URL || '';
}

// Export default config loader
export default loadContractsConfig;

