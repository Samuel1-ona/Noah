# NOAH SDK Examples - Developer Documentation

This directory contains comprehensive example projects demonstrating how to integrate the NOAH SDK into your applications. These examples cover both **end-to-end user flows** and **DeFi protocol integration** scenarios.

## Table of Contents

- [Overview](#overview)
- [Available Examples](#available-examples)
- [Quick Start](#quick-start)
- [Use Cases](#use-cases)
  - [For End Users](#for-end-users)
  - [For DeFi Protocols](#for-defi-protocols)
- [Example Projects](#example-projects)
  - [React Example](#react-example)
  - [Next.js Example](#nextjs-example)
- [Integration Guide](#integration-guide)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The NOAH SDK examples demonstrate how to:

- **For End Users**: Generate zero-knowledge proofs, verify credentials, and gain access to DeFi protocols while maintaining privacy
- **For DeFi Protocols**: Set KYC requirements, verify user proofs, and manage access control
- **For Issuers**: Register credentials, manage credential lifecycle, and revoke credentials when needed

All examples are production-ready and can be used as starting points for your own implementations.

## Available Examples

### 1. React Example (`react-example/`)
A React application built with Vite demonstrating client-side SDK usage with React hooks.

**Best for:**
- Client-side only applications
- Quick prototyping
- Learning React hooks integration
- Single-page applications

**Technologies:**
- React 18
- Vite
- React Query
- ethers.js

### 2. Next.js Example (`nextjs-example/`)
A full-stack Next.js application with TypeScript, demonstrating both client and server-side SDK usage.

**Best for:**
- Production applications
- Full-stack development
- Server-side rendering needs
- TypeScript projects

**Technologies:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- React Query

## Quick Start

### Prerequisites

Before running any example, ensure you have:

1. **Node.js 18+** and npm installed
2. **MetaMask** or compatible Web3 wallet
3. **Backend API** running (for proof generation)
4. **Network Access** to Mantle Sepolia testnet (or your configured network)

### Step 1: Build the SDK

All examples depend on the NOAH SDK package. Build it first:

```bash
cd ../../packages/noah-sdk
npm install
npm run build
```

### Step 2: Choose an Example

Navigate to your preferred example:

```bash
# For React example
cd react-example

# OR for Next.js example
cd nextjs-example
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment

Create an `.env` or `.env.local` file (see each example's README for specific variables):

```env
# Network Configuration
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5003

# Contract Addresses
NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS=0x5d311f246ef87d24B045D961aA6da62a758514f7
NEXT_PUBLIC_PROTOCOL_ACCESS_CONTROL_ADDRESS=0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

### Step 5: Start Development Server

```bash
# React example
npm run dev

# Next.js example
npm run dev
```

### Step 6: Connect Wallet

1. Open the application in your browser
2. Click "Connect MetaMask" (or your wallet)
3. Approve the connection request
4. Ensure you're connected to the correct network (Mantle Sepolia)

## Use Cases

### For End Users

End users can use the NOAH SDK to:

#### 1. **Check Credential Validity**

Verify that your credential is registered and not revoked:

```typescript
import { UserClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const userClient = new UserClient(signer, {
  apiBaseUrl: 'http://localhost:3000/api/v1'
});

// Check if credential is valid
const isValid = await userClient.checkCredentialValidity(
  '0x1234...' // credential hash
);

if (isValid) {
  console.log('Credential is valid and ready to use');
}
```

#### 2. **View Protocol Requirements**

Before generating a proof, check what requirements a protocol has:

```typescript
// Get protocol requirements
const requirements = await userClient.getProtocolRequirements(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' // protocol address
);

console.log('Minimum Age:', requirements.minAge);
console.log('Allowed Jurisdictions:', requirements.allowedJurisdictions);
console.log('Requires Accredited:', requirements.requireAccredited);
```

#### 3. **Generate Zero-Knowledge Proof**

Generate a proof that you meet protocol requirements without revealing your actual data:

```typescript
// Generate proof
const proof = await userClient.generateProof(
  {
    credentialHash: '0x1234...',
    age: 25,
    jurisdiction: 'US',
    accredited: 1
  },
  {
    protocolAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    minAge: 21,
    allowedJurisdictions: ['US', 'UK', 'CA'],
    requireAccredited: true
  }
);

console.log('Proof generated:', proof.proof);
console.log('Public signals:', proof.publicSignals);
```

#### 4. **Verify Proof and Gain Access**

Submit your proof to gain access to a DeFi protocol:

```typescript
// Verify proof and grant access
const result = await userClient.verifyAndGrantAccess(
  {
    proof: proof.proof,
    publicSignals: proof.publicSignals,
    credentialHash: proof.credentialHash,
    success: true
  },
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' // protocol address
);

console.log('Access granted! Transaction:', result.transactionHash);
```

#### 5. **Check Access Status**

Verify if you currently have access to a protocol:

```typescript
// Check access status
const hasAccess = await userClient.checkAccess(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // protocol address
  await signer.getAddress() // your address
);

if (hasAccess) {
  console.log('You have access to this protocol');
} else {
  console.log('You do not have access. Generate and verify a proof first.');
}
```

#### Complete User Flow Example

```typescript
import { UserClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

async function userAccessFlow() {
  // 1. Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userClient = new UserClient(signer, {
    apiBaseUrl: 'http://localhost:3000/api/v1'
  });

  const protocolAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const credentialHash = '0x1234...';

  // 2. Check credential validity
  const isValid = await userClient.checkCredentialValidity(credentialHash);
  if (!isValid) {
    throw new Error('Credential is invalid or revoked');
  }

  // 3. Get protocol requirements
  const requirements = await userClient.getProtocolRequirements(protocolAddress);

  // 4. Generate proof
  const proof = await userClient.generateProof(
    {
      credentialHash,
      age: 25,
      jurisdiction: 'US',
      accredited: 1
    },
    {
      ...requirements,
      protocolAddress
    }
  );

  // 5. Verify and gain access
  const result = await userClient.verifyAndGrantAccess(
    {
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      credentialHash: proof.credentialHash,
      success: true
    },
    protocolAddress
  );

  console.log('Access granted!', result.transactionHash);
}
```

### For DeFi Protocols

DeFi protocols can use the NOAH SDK to:

#### 1. **Set KYC Requirements**

Define what requirements users must meet to access your protocol:

```typescript
import { ProtocolClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const protocolClient = new ProtocolClient(signer);

// Set requirements
await protocolClient.setRequirements({
  minAge: 21,
  jurisdictions: ['US', 'UK', 'CA'], // Automatically converted to hashes
  requireAccredited: true
});

console.log('Requirements set successfully');
```

#### 2. **Get Current Requirements**

Retrieve the current requirements for your protocol:

```typescript
const requirements = await protocolClient.getRequirements(
  await signer.getAddress() // protocol address
);

console.log('Min Age:', requirements.minAge);
console.log('Jurisdictions:', requirements.allowedJurisdictions);
console.log('Requires Accredited:', requirements.requireAccredited);
```

#### 3. **Verify User Access**

Check if a user has been granted access to your protocol:

```typescript
const hasAccess = await protocolClient.checkUserAccess(
  await signer.getAddress(), // protocol address
  '0x8ba1f109551bD432803012645Hac136c22C9c8d' // user address
);

if (hasAccess) {
  console.log('User has access');
  // Allow user to interact with protocol
} else {
  console.log('User does not have access');
  // Prompt user to verify credentials
}
```

#### 4. **Revoke User Access**

Revoke a user's access if needed (e.g., compliance violation):

```typescript
await protocolClient.revokeAccess(
  await signer.getAddress(), // protocol address
  '0x8ba1f109551bD432803012645Hac136c22C9c8d' // user address
);

console.log('User access revoked');
```

#### Complete Protocol Flow Example

```typescript
import { ProtocolClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

async function protocolSetupFlow() {
  // 1. Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const protocolClient = new ProtocolClient(signer);

  const protocolAddress = await signer.getAddress();

  // 2. Set KYC requirements
  await protocolClient.setRequirements({
    minAge: 21,
    jurisdictions: ['US', 'UK', 'CA', 'DE', 'FR'],
    requireAccredited: true
  });

  // 3. Get requirements (verify they were set)
  const requirements = await protocolClient.getRequirements(protocolAddress);
  console.log('Requirements set:', requirements);

  // 4. Check user access (in your protocol logic)
  const userAddress = '0x8ba1f109551bD432803012645Hac136c22C9c8d';
  const hasAccess = await protocolClient.checkUserAccess(
    protocolAddress,
    userAddress
  );

  if (hasAccess) {
    // User can access protocol features
    console.log('User has verified access');
  }
}
```

#### Integration in Your Protocol

Here's how to integrate NOAH into your DeFi protocol:

```typescript
import { ProtocolClient } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

class MyDeFiProtocol {
  private protocolClient: ProtocolClient;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.protocolClient = new ProtocolClient(signer);
  }

  async initialize() {
    // Set requirements on deployment or admin action
    await this.protocolClient.setRequirements({
      minAge: 18,
      jurisdictions: ['US', 'UK'],
      requireAccredited: false
    });
  }

  async checkUserEligibility(userAddress: string): Promise<boolean> {
    const protocolAddress = await this.signer.getAddress();
    return await this.protocolClient.checkUserAccess(protocolAddress, userAddress);
  }

  async deposit(userAddress: string, amount: bigint) {
    // Check access before allowing deposit
    const hasAccess = await this.checkUserEligibility(userAddress);
    
    if (!hasAccess) {
      throw new Error('User must verify KYC credentials first');
    }

    // Proceed with deposit
    // ... your deposit logic
  }

  async withdraw(userAddress: string, amount: bigint) {
    // Check access before allowing withdrawal
    const hasAccess = await this.checkUserEligibility(userAddress);
    
    if (!hasAccess) {
      throw new Error('User must verify KYC credentials first');
    }

    // Proceed with withdrawal
    // ... your withdrawal logic
  }
}
```

## Example Projects

### React Example

**Location:** `react-example/`

**Features:**
- ✅ React Query integration for data fetching
- ✅ Protocol management with `useProtocol` hook
- ✅ User operations with `useUser` hook
- ✅ Issuer operations with `IssuerClient`
- ✅ Real-time wallet connection
- ✅ Modern UI with CSS

**Setup:**

```bash
cd react-example
npm install
npm run dev
```

**Key Components:**

1. **ProtocolSection**: Demonstrates setting and viewing protocol requirements
2. **UserSection**: Shows proof generation and access verification
3. **IssuerSection**: Credential management interface

**Code Example:**

```jsx
import { useProtocol, useUser } from '@noah-protocol/sdk';

function MyComponent({ signer }) {
  // Protocol operations
  const { 
    requirements, 
    setRequirements,
    hasAccess 
  } = useProtocol(signer, {
    protocolAddress: '0x...'
  });

  // User operations
  const { 
    generateProof,
    verifyAndGrantAccess 
  } = useUser(signer, {
    apiBaseUrl: 'http://localhost:3000/api/v1'
  });

  // Use the hooks...
}
```

See [`react-example/README.md`](./react-example/README.md) for detailed setup instructions.

### Next.js Example

**Location:** `nextjs-example/`

**Features:**
- ✅ Next.js 16 with App Router
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ Server-side rendering ready
- ✅ API routes support
- ✅ React Query integration

**Setup:**

```bash
cd nextjs-example
npm install
npm run dev
```

**Key Components:**

1. **ProtocolSection.tsx**: TypeScript component for protocol management
2. **UserSection.tsx**: TypeScript component for user operations
3. **IssuerSection.tsx**: TypeScript component for issuer operations

**Code Example:**

```tsx
'use client';

import { useProtocol } from '@noah-protocol/sdk';
import { ethers } from 'ethers';

export default function ProtocolPage() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const { requirements, setRequirements } = useProtocol(signer, {
    protocolAddress: '0x...'
  });

  // Component implementation...
}
```

See [`nextjs-example/README.md`](./nextjs-example/README.md) for detailed setup instructions.

## Integration Guide

### Step 1: Install the SDK

```bash
npm install @noah-protocol/sdk ethers
```

### Step 2: Import Required Components

```typescript
// For protocol operations
import { ProtocolClient } from '@noah-protocol/sdk';

// For user operations
import { UserClient } from '@noah-protocol/sdk';

// For issuer operations
import { IssuerClient } from '@noah-protocol/sdk';

// For React applications
import { useProtocol, useUser } from '@noah-protocol/sdk';
```

### Step 3: Initialize Clients

```typescript
import { ethers } from 'ethers';

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Initialize clients
const protocolClient = new ProtocolClient(signer);
const userClient = new UserClient(signer, {
  apiBaseUrl: 'http://localhost:3000/api/v1'
});
```

### Step 4: Use in Your Application

See the [Use Cases](#use-cases) section above for complete code examples.

## API Reference

### ProtocolClient

**Purpose:** Manage protocol KYC requirements and access control

**Key Methods:**
- `setRequirements(options)`: Set protocol requirements
- `getRequirements(address)`: Get current requirements
- `checkUserAccess(protocolAddress, userAddress)`: Check if user has access
- `revokeAccess(protocolAddress, userAddress)`: Revoke user access

**Example:**
```typescript
const protocol = new ProtocolClient(signer);
await protocol.setRequirements({
  minAge: 21,
  jurisdictions: ['US', 'UK'],
  requireAccredited: true
});
```

### UserClient

**Purpose:** Generate proofs and verify access for end users

**Key Methods:**
- `getProtocolRequirements(protocolAddress)`: Get protocol requirements
- `generateProof(credential, requirements)`: Generate ZK proof
- `verifyAndGrantAccess(proof, protocolAddress)`: Verify proof and gain access
- `checkAccess(protocolAddress, userAddress)`: Check access status
- `checkCredentialValidity(credentialHash)`: Verify credential validity

**Example:**
```typescript
const user = new UserClient(signer, {
  apiBaseUrl: 'http://localhost:3000/api/v1'
});

const proof = await user.generateProof(credential, requirements);
await user.verifyAndGrantAccess(proof, protocolAddress);
```

### IssuerClient

**Purpose:** Register and manage credentials for issuers

**Key Methods:**
- `registerCredential(credentialHash, userAddress, options?)`: Register credential
- `revokeCredential(credentialHash)`: Revoke credential
- `checkCredential(credentialHash)`: Check credential status

**Example:**
```typescript
const issuer = new IssuerClient(signer, {
  apiBaseUrl: 'http://localhost:3000/api/v1'
});

await issuer.registerCredential(
  '0x1234...',
  '0x5678...',
  { age: 25, jurisdiction: 'US', accredited: 1 }
);
```

### React Hooks

**useProtocol(signer, options)**

Hook for protocol operations with React Query integration.

```typescript
const {
  requirements,
  isLoadingRequirements,
  setRequirements,
  hasAccess,
  isLoadingAccess
} = useProtocol(signer, {
  protocolAddress: '0x...'
});
```

**useUser(signer, options)**

Hook for user operations with React Query integration.

```typescript
const {
  generateProof,
  verifyAndGrantAccess,
  checkAccess,
  checkCredentialValidity
} = useUser(signer, {
  apiBaseUrl: 'http://localhost:3000/api/v1'
});
```

For complete API documentation, see the [SDK README](../../packages/noah-sdk/README.md).

## Troubleshooting

### Common Issues

#### 1. "Module not found: Can't resolve '@noah-protocol/sdk'"

**Solution:**
- Ensure you've built the SDK: `cd ../../packages/noah-sdk && npm run build`
- Check that the SDK is properly linked in your example's configuration
- For Next.js: Check `next.config.js` for webpack alias configuration
- For React/Vite: Check `vite.config.js` for alias configuration

#### 2. "Failed to connect wallet"

**Solution:**
- Ensure MetaMask (or your wallet) is installed
- Check that you're on the correct network (Mantle Sepolia)
- Try refreshing the page and reconnecting

#### 3. "Failed to generate proof"

**Solution:**
- Ensure the backend API is running at the configured URL
- Verify your credential data is correct
- Check that you meet the protocol requirements
- Verify the credential hash is valid and not revoked

#### 4. "Transaction failed" or "Proof verification failed"

**Solution:**
- Check you have sufficient gas/ETH
- Verify the proof was generated with correct requirements
- Ensure the credential is not revoked
- Check that protocol requirements match the proof

#### 5. "Cannot convert jurisdiction to BigInt"

**Solution:**
- The SDK automatically converts jurisdiction strings (e.g., "US") to hashes
- Ensure you're using the latest SDK version
- If using raw jurisdiction hashes, ensure they're valid BigInt values

### Getting Help

- Check the [SDK README](../../packages/noah-sdk/README.md) for detailed API documentation
- Review the example code in `react-example/` or `nextjs-example/`
- Check the main [NOAH README](../../README.md) for system architecture and flows

## Environment Variables

All examples support the following environment variables:

```env
# Network Configuration
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5003

# Contract Addresses
NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS=0x5d311f246ef87d24B045D961aA6da62a758514f7
NEXT_PUBLIC_PROTOCOL_ACCESS_CONTROL_ADDRESS=0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

**Note:** Contract addresses are typically configured in the SDK package itself. These environment variables are optional and used for overriding defaults.

## Next Steps

1. **Explore the Examples**: Run both examples to see different integration patterns
2. **Read the SDK Documentation**: See [packages/noah-sdk/README.md](../../packages/noah-sdk/README.md) for complete API reference
3. **Customize for Your Use Case**: Use the examples as starting points for your own implementation
4. **Join the Community**: Contribute improvements and share your integrations

## License

MIT
