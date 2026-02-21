# @noah-protocol/sdk

**NOAH SDK** - Privacy-Preserving KYC with Selective Disclosure for DeFi

A TypeScript/JavaScript SDK that enables DeFi protocols and developers to easily integrate NOAH's privacy-preserving KYC functionality into their applications. The SDK provides high-level APIs for protocols, users, and issuers to interact with the NOAH smart contracts and backend services.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [ProtocolClient](#protocolclient)
  - [UserClient](#userclient)
  - [ContractClient](#contractclient)
  - [APIClient](#apiclient)
  - [IssuerClient](#issuerclient)
  - [Utilities](#utilities)
  - [React Hooks](#react-hooks)
- [Usage Examples](#usage-examples)
- [Type Definitions](#type-definitions)
- [Migration Guide](#migration-guide)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

The NOAH SDK provides a clean, type-safe interface for interacting with the NOAH protocol. It abstracts away the complexity of smart contract interactions and proof generation, making it easy to:

- **For DeFi Protocols**: Set KYC requirements and verify user access
- **For End Users**: Generate ZK proofs and verify access to protocols
- **For Issuers**: Register and manage KYC credentials

### Key Features

- 🔒 **Privacy-Preserving**: Personal data never leaves the user's device
- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Easy Integration**: Simple, high-level APIs for common operations
- 🔌 **Wallet Agnostic**: Works with any ethers.js-compatible wallet
- 📦 **Modular**: Import only what you need
- ⚛️ **React Support**: Optional React hooks for easy integration

## Installation

```bash
npm install @noah-protocol/sdk ethers
# or
yarn add @noah-protocol/sdk ethers
# or
pnpm add @noah-protocol/sdk ethers
```

### Peer Dependencies

- `ethers` (^6.9.0) - Required for blockchain interactions
- `react` (^18.0.0) - Optional, only needed for React hooks

## Quick Start

### For DeFi Protocols

```typescript
import { ProtocolClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Initialize protocol client
const protocol = new ProtocolClient(signer);

// Set KYC requirements
await protocol.setRequirements({
  minAge: 21,
  jurisdictions: ['US', 'UK', 'CA'],
  requireAccredited: true
});

// Check if a user has access
const hasAccess = await protocol.checkUserAccess(
  await signer.getAddress(), // protocol address
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' // user address
);
```

### For End Users

```typescript
import { UserClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Initialize user client
const user = new UserClient(signer, {
  apiBaseUrl: 'https://api.noah.xyz'
});

// Get protocol requirements
const requirements = await user.getProtocolRequirements(protocolAddress);

// Generate proof (requires credential data)
const proof = await user.generateProof({
  credential: {
    age: 25,
    jurisdiction: 'US',
    accredited: true,
    credentialHash: '0x...'
  },
  requirements
});

// Verify and grant access
await user.verifyAndGrantAccess({
  proof,
  protocolAddress,
  credentialHash: '0x...'
});
```

## API Reference

### ProtocolClient

High-level API for DeFi protocols to manage KYC requirements and verify user access.

#### Constructor

```typescript
new ProtocolClient(signer: Signer, config?: ProtocolClientConfig)
```

**Parameters:**
- `signer: Signer` - An ethers.js Signer instance (from wallet)
- `config?: ProtocolClientConfig` - Optional configuration
  - `protocolAccessControlAddress?: string` - Custom contract address
  - `provider?: Provider` - Custom provider for read operations

#### Methods

##### `setRequirements(params: SetRequirementsParams): Promise<TransactionResult>`

Set KYC requirements for the protocol.

```typescript
await protocol.setRequirements({
  minAge: 21,
  jurisdictions: ['US', 'UK', 'CA'], // or jurisdiction hashes
  requireAccredited: true
});
```

**Parameters:**
- `minAge: number` - Minimum age required
- `jurisdictions: string[] | number[]` - Array of allowed jurisdictions (country codes or hashes)
- `requireAccredited: boolean` - Whether accredited investor status is required

**Returns:** `Promise<TransactionResult>` - Transaction hash and receipt

##### `getRequirements(protocolAddress: string): Promise<Requirements>`

Get the requirements for a protocol.

```typescript
const requirements = await protocol.getRequirements(protocolAddress);
// Returns: { minAge: 21, allowedJurisdictions: [...], requireAccredited: true }
```

**Parameters:**
- `protocolAddress: string` - The protocol contract address

**Returns:** `Promise<Requirements>` - Protocol requirements

##### `checkUserAccess(protocolAddress: string, userAddress: string): Promise<boolean>`

Check if a user has access to a protocol.

```typescript
const hasAccess = await protocol.checkUserAccess(protocolAddress, userAddress);
```

**Parameters:**
- `protocolAddress: string` - The protocol contract address
- `userAddress: string` - The user's wallet address

**Returns:** `Promise<boolean>` - True if user has access

##### `verifyAndGrantAccess(params: VerifyUserAccessParams): Promise<TransactionResult>`

Verify a ZK proof and grant access to a user.

```typescript
await protocol.verifyAndGrantAccess({
  userAddress: '0x...',
  proof: { a: [...], b: [...], c: [...] },
  publicSignals: [...],
  credentialHash: '0x...'
});
```

**Parameters:**
- `userAddress: string` - User's wallet address
- `proof: Proof` - ZK proof object
- `publicSignals: string[] | number[]` - Public signals from proof
- `credentialHash: string` - Credential hash (bytes32)

**Returns:** `Promise<TransactionResult>` - Transaction hash and receipt

### UserClient

High-level API for end-users to interact with protocols and generate proofs.

#### Constructor

```typescript
new UserClient(signer: Signer, config?: UserClientConfig)
```

**Parameters:**
- `signer: Signer` - An ethers.js Signer instance
- `config?: UserClientConfig` - Optional configuration
  - `apiBaseUrl?: string` - Backend API base URL (default: 'http://localhost:3000/api/v1')
  - `protocolAccessControlAddress?: string` - Custom contract address
  - `provider?: Provider` - Custom provider for read operations

#### Methods

##### `generateProof(proofData: ProofGenerationData): Promise<ProofResult>`

Generate a ZK proof for credential verification.

```typescript
const proof = await user.generateProof({
  credential: {
    age: 25,
    jurisdiction: 'US',
    accredited: true,
    credentialHash: '0x...'
  },
  requirements: {
    minAge: 21,
    allowedJurisdictions: ['US', 'UK'],
    requireAccredited: true
  }
});
```

**Parameters:**
- `credential: Credential` - User's credential data
- `requirements: Requirements` - Protocol requirements

**Returns:** `Promise<ProofResult>` - Generated proof and public signals

##### `verifyAndGrantAccess(params: VerifyAndGrantAccessParams): Promise<TransactionResult>`

Verify proof and grant access to a protocol.

```typescript
await user.verifyAndGrantAccess({
  proof: { a: [...], b: [...], c: [...] },
  publicSignals: [...],
  protocolAddress: '0x...',
  credentialHash: '0x...'
});
```

**Parameters:**
- `proof: Proof` - ZK proof object
- `publicSignals: string[] | number[]` - Public signals
- `protocolAddress: string` - Protocol contract address
- `credentialHash: string` - Credential hash

**Returns:** `Promise<TransactionResult>` - Transaction hash and receipt

##### `checkCredentialValidity(credentialHash: string): Promise<boolean>`

Check if a credential is valid (exists and not revoked).

```typescript
const isValid = await user.checkCredentialValidity(credentialHash);
```

**Parameters:**
- `credentialHash: string` - Credential hash to check

**Returns:** `Promise<boolean>` - True if credential is valid

##### `getProtocolRequirements(protocolAddress: string): Promise<Requirements>`

Get requirements for a protocol.

```typescript
const requirements = await user.getProtocolRequirements(protocolAddress);
```

**Parameters:**
- `protocolAddress: string` - Protocol contract address

**Returns:** `Promise<Requirements>` - Protocol requirements

### ContractClient

Low-level client for direct smart contract interactions.

#### Constructor

```typescript
new ContractClient(provider?: Provider, config?: ContractClientConfig)
```

**Parameters:**
- `provider?: Provider` - Optional provider (defaults to RPC provider)
- `config?: ContractClientConfig` - Optional configuration with contract addresses

#### Methods

##### `isCredentialValid(credentialHash: string): Promise<boolean>`

Check if a credential is valid.

##### `hasAccess(protocolAddress: string, userAddress: string): Promise<boolean>`

Check if user has access to a protocol.

##### `getRequirements(protocolAddress: string): Promise<Requirements>`

Get protocol requirements.

##### `getUserCredential(protocolAddress: string, userAddress: string): Promise<string>`

Get user's credential hash for a protocol.

##### `getIssuerInfo(issuerAddress: string): Promise<IssuerInfo>`

Get issuer information.

##### `setRequirements(signer: Signer, minAge: number, allowedJurisdictions: string[] | number[], requireAccredited: boolean): Promise<TransactionResult>`

Set protocol requirements (requires signer).

##### `registerCredential(signer: Signer, credentialHash: string, userAddress: string): Promise<TransactionResult>`

Register a credential (requires issuer signer).

##### `revokeCredential(signer: Signer, credentialHash: string): Promise<TransactionResult>`

Revoke a credential (requires issuer signer).

##### `verifyAndGrantAccess(signer: Signer, proof: Proof, publicSignals: string[] | number[], credentialHash: string, userAddress: string): Promise<TransactionResult>`

Verify proof and grant access (requires protocol signer).

### APIClient

Client for interacting with the NOAH backend API.

#### Constructor

```typescript
new APIClient(config?: APIClientConfig)
```

**Parameters:**
- `config?: APIClientConfig` - Optional configuration
  - `baseURL?: string` - API base URL
  - `timeout?: number` - Request timeout in ms
  - `authToken?: string` - Authentication token

#### Methods

##### `generateProof(proofData: ProofGenerationData): Promise<ProofResult>`

Generate a ZK proof via the backend API.

##### `getProtocolRequirements(protocolAddress: string): Promise<Requirements>`

Get protocol requirements from API.

##### `checkAccess(protocolAddress: string, userAddress: string): Promise<AccessStatus>`

Check user access status from API.

##### `registerCredential(credentialHash: string, userAddress: string): Promise<TransactionResult>`

Register a credential via API (issuer only).

##### `revokeCredential(credentialHash: string): Promise<TransactionResult>`

Revoke a credential via API (issuer only).

### IssuerClient

High-level API for credential issuers.

#### Constructor

```typescript
new IssuerClient(signer: Signer, config?: IssuerClientConfig)
```

#### Methods

##### `registerCredential(credentialHash: string, userAddress: string): Promise<TransactionResult>`

Register a credential on-chain.

##### `revokeCredential(credentialHash: string): Promise<TransactionResult>`

Revoke a credential.

##### `checkCredential(credentialHash: string): Promise<CredentialStatus>`

Check credential status.

### Utilities

#### Jurisdiction Utilities

```typescript
import { jurisdictionStringToHash, jurisdictionStringsToHashes, parseJurisdictions } from '@noah-protocol/sdk';

// Convert single jurisdiction
const hash = jurisdictionStringToHash('US'); // Returns hash as string

// Convert multiple jurisdictions
const hashes = jurisdictionStringsToHashes(['US', 'UK', 'CA']);

// Parse comma-separated string
const hashes = parseJurisdictions('US, UK, CA');
```

#### Credential Utilities

```typescript
import { computeCredentialHash } from '@noah-protocol/sdk';

// Compute credential hash from credential data
const hash = computeCredentialHash({
  age: 25,
  jurisdiction: 'US',
  accredited: true
});
```

### React Hooks

Optional React hooks for easy integration in React applications.

#### `useProtocol(signer: Signer | null)`

Hook for protocol operations.

```typescript
import { useProtocol } from '@noah-protocol/sdk';

function ProtocolComponent() {
  const { setRequirements, checkUserAccess, isLoading } = useProtocol(signer);
  
  // Use the methods...
}
```

#### `useUser(signer: Signer | null, config?: UserClientConfig)`

Hook for user operations.

```typescript
import { useUser } from '@noah-protocol/sdk';

function UserComponent() {
  const { generateProof, verifyAndGrantAccess, isLoading } = useUser(signer);
  
  // Use the methods...
}
```

#### `useCredentials()`

Hook for credential management.

```typescript
import { useCredentials } from '@noah-protocol/sdk';

function CredentialComponent() {
  const { checkValidity, getCredential } = useCredentials();
  
  // Use the methods...
}
```

## Usage Examples

### Example 1: DeFi Protocol Integration

```typescript
import { ProtocolClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

async function setupProtocol() {
  // Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Initialize client
  const protocol = new ProtocolClient(signer);
  
  // Set requirements
  const tx = await protocol.setRequirements({
    minAge: 21,
    jurisdictions: ['US', 'UK', 'CA'],
    requireAccredited: false
  });
  
  console.log('Requirements set:', tx.transactionHash);
  
  // Check user access
  const userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const hasAccess = await protocol.checkUserAccess(
    await signer.getAddress(),
    userAddress
  );
  
  console.log('User has access:', hasAccess);
}
```

### Example 2: User Access Flow

```typescript
import { UserClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

async function requestAccess() {
  // Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Initialize user client
  const user = new UserClient(signer, {
    apiBaseUrl: 'https://api.noah.xyz'
  });
  
  const protocolAddress = '0x...';
  
  // Get protocol requirements
  const requirements = await user.getProtocolRequirements(protocolAddress);
  console.log('Protocol requires:', requirements);
  
  // Check if credential is valid
  const credentialHash = '0x...';
  const isValid = await user.checkCredentialValidity(credentialHash);
  if (!isValid) {
    throw new Error('Credential is invalid or revoked');
  }

// Generate proof
  const proofResult = await user.generateProof({
    credential: {
      age: 25,
      jurisdiction: 'US',
      accredited: true,
      credentialHash
    },
    requirements
  });

// Verify and grant access
  const tx = await user.verifyAndGrantAccess({
    proof: proofResult.proof,
    publicSignals: proofResult.publicSignals,
    protocolAddress,
    credentialHash
  });
  
  console.log('Access granted:', tx.transactionHash);
}
```

### Example 3: Issuer Credential Management

```typescript
import { IssuerClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

async function manageCredentials() {
  // Connect issuer wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Initialize issuer client
  const issuer = new IssuerClient(signer);
  
  // Register credential
  const credentialHash = '0x...';
  const userAddress = '0x...';
  
  const tx = await issuer.registerCredential(credentialHash, userAddress);
  console.log('Credential registered:', tx.transactionHash);
  
  // Later, revoke credential if needed
  const revokeTx = await issuer.revokeCredential(credentialHash);
  console.log('Credential revoked:', revokeTx.transactionHash);
}
```

### Example 4: React Integration

```typescript
import { useProtocol, useUser } from '@noah-protocol/sdk';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

function ProtocolDashboard() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const { setRequirements, checkUserAccess, isLoading } = useProtocol(signer);
  const { generateProof, verifyAndGrantAccess } = useUser(signer);
  
  useEffect(() => {
    async function connectWallet() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const s = await provider.getSigner();
      setSigner(s);
    }
    connectWallet();
  }, []);
  
  const handleSetRequirements = async () => {
    await setRequirements({
      minAge: 21,
      jurisdictions: ['US', 'UK'],
      requireAccredited: false
    });
  };
  
  return (
    <div>
      <button onClick={handleSetRequirements} disabled={isLoading}>
        Set Requirements
      </button>
    </div>
  );
}
```

## Type Definitions

### Core Types

```typescript
// Protocol requirements
interface Requirements {
  minAge: number;
  allowedJurisdictions: string[] | number[];
  requireAccredited: boolean;
  isSet?: boolean;
}

// ZK Proof (Groth16 format)
interface Proof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
}

// Transaction result
interface TransactionResult {
  transactionHash: string;
  receipt: ContractTransactionReceipt | null;
}

// Credential data
interface Credential {
  age: number;
  jurisdiction: string;
  accredited: boolean;
  credentialHash: string;
}

// Proof generation data
interface ProofGenerationData {
  credential: Credential;
  requirements: Requirements;
}

// Proof result
interface ProofResult {
  proof: Proof;
  publicSignals: string[];
}
```

## Migration Guide

If you're currently using the frontend services directly (`contractClient.js`, `apiClient.js`), here's how to migrate to the SDK:

### Before (Direct Service Usage)

```javascript
// Old way - using services directly
import contractClient from './services/contractClient.js';
import { proofService } from './services/apiClient.js';

// Set requirements
await contractClient.setRequirements(
  signer,
  21,
  ['US', 'UK'],
  true
);

// Generate proof
const proof = await proofService.generateProof({
  credential: { ... },
  requirements: { ... }
});
```

### After (Using SDK)

```typescript
// New way - using SDK
import { ProtocolClient, UserClient } from '@noah-protocol/sdk';

// Initialize clients
const protocol = new ProtocolClient(signer);
const user = new UserClient(signer, { apiBaseUrl: '...' });

// Set requirements (cleaner API)
await protocol.setRequirements({
  minAge: 21,
  jurisdictions: ['US', 'UK'],
  requireAccredited: true
});

// Generate proof (same API, but typed)
const proofResult = await user.generateProof({
  credential: { ... },
  requirements: { ... }
});
```

### Key Changes

1. **Type Safety**: All methods are now fully typed with TypeScript
2. **Cleaner API**: Methods use object parameters instead of positional arguments
3. **Better Error Handling**: Consistent error types across all methods
4. **Wallet Agnostic**: Works with any ethers.js-compatible wallet
5. **Modular**: Import only what you need

### Migration Steps

1. **Install SDK**: `npm install @noah-protocol/sdk`
2. **Replace Imports**: Replace service imports with SDK imports
3. **Update Method Calls**: Update to use new API signatures
4. **Add Types**: Add TypeScript types if using TypeScript
5. **Test**: Test all functionality to ensure compatibility

## Advanced Usage

### Custom Contract Addresses

```typescript
const protocol = new ProtocolClient(signer, {
  protocolAccessControlAddress: '0xCustomAddress...'
});
```

### Custom Provider

```typescript
import { ethers } from 'ethers';

const customProvider = new ethers.JsonRpcProvider('https://custom-rpc.com');
const protocol = new ProtocolClient(signer, {
  provider: customProvider
});
```

### Event Listeners

```typescript
import { ContractClient } from '@noah-protocol/sdk';

const contractClient = new ContractClient();

// Listen for credential issued events
contractClient.onCredentialIssued((user, credentialHash, issuer, timestamp) => {
  console.log('Credential issued:', { user, credentialHash, issuer });
});

// Listen for access granted events
contractClient.onAccessGranted((user, protocol, credentialHash, timestamp) => {
  console.log('Access granted:', { user, protocol, credentialHash });
});
```

### Error Handling

```typescript
import { ProtocolClient } from '@noah-protocol/sdk';

try {
  await protocol.setRequirements({ ... });
} catch (error) {
  if (error.code === 'ACTION_REJECTED') {
    console.error('User rejected transaction');
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Insufficient funds');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "Signer is required" Error

**Problem**: You're trying to call a write operation without a signer.

**Solution**: Make sure you pass a signer to the client constructor:

```typescript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const protocol = new ProtocolClient(signer); // ✅ Pass signer
```

#### 2. "Requirements not set" Error

**Problem**: Trying to verify access before setting requirements.

**Solution**: Set requirements first:

```typescript
await protocol.setRequirements({ ... });
// Then verify access
```

#### 3. "Invalid or revoked credential" Error

**Problem**: The credential hash doesn't exist or has been revoked.

**Solution**: Check credential validity first:

```typescript
const isValid = await user.checkCredentialValidity(credentialHash);
if (!isValid) {
  // Handle invalid credential
}
```

#### 4. Network/Provider Issues

**Problem**: Cannot connect to blockchain.

**Solution**: Check your provider configuration:

```typescript
const provider = new ethers.BrowserProvider(window.ethereum);
// Or use custom RPC
const provider = new ethers.JsonRpcProvider('https://rpc.example.com');
```

#### 5. API Connection Issues

**Problem**: Cannot connect to backend API.

**Solution**: Check API base URL and network:

```typescript
const user = new UserClient(signer, {
  apiBaseUrl: 'https://api.noah.xyz' // Make sure this is correct
});
```

### Getting Help

- Check the [main NOAH README](../../README.md) for more information
- Review the [API documentation](#api-reference) for method signatures
- Check contract addresses in `deployments.json`
- Verify your network configuration matches the deployed contracts

## License

MIT
