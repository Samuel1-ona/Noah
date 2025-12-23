# NOAH SDK Examples

This directory contains example projects demonstrating how to use the NOAH SDK in different environments.

## Examples

### 1. Next.js Example (`nextjs-example/`)
A full-stack Next.js application demonstrating protocol and user flows.

**Features:**
- Protocol dashboard for setting requirements
- User interface for generating proofs and requesting access
- Server-side API routes for backend integration

### 2. React Example (`react-example/`)
A React application built with Vite, similar to the main NOAH frontend.

**Features:**
- Protocol management interface
- User credential verification
- Access request flow

### 3. Vanilla JS Example (`vanilla-js-example/`)
A simple HTML/JavaScript example showing basic SDK usage.

**Features:**
- Minimal setup
- Direct SDK usage without frameworks
- Perfect for quick testing

## Getting Started

Each example has its own README with setup instructions. Generally:

1. Navigate to the example directory
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Run the development server
5. Open in browser and connect your wallet

## Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible wallet
- Access to Mantle Sepolia testnet (or configured network)
- Backend API running (for proof generation)

## Environment Variables

All examples need these environment variables:

```env
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS=0x5d311f246ef87d24B045D961aA6da62a758514f7
NEXT_PUBLIC_PROTOCOL_ACCESS_CONTROL_ADDRESS=0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```


