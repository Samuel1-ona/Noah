# NOAH Frontend

Frontend application for the NOAH system, built with React and Vite.

## Features

- **Web3 Wallet Integration**: Connect with MetaMask to interact with smart contracts
- **API Integration**: Communicate with backend services for proof generation and verification
- **Contract Interaction**: Direct read operations with deployed smart contracts
- **Modern UI**: Built with Material-UI for a polished user experience

## Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask browser extension (for wallet functionality)
- Backend services running (see backend README)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the frontend directory (or use the provided `.env` template):

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_RPC_URL=https://rpc.sepolia.mantle.xyz
VITE_CHAIN_ID=5003
VITE_NETWORK=mantle-sepolia
VITE_CREDENTIAL_REGISTRY_ADDRESS=0x5d311f246ef87d24B045D961aA6da62a758514f7
VITE_ZK_VERIFIER_ADDRESS=0x96f43E12280676866bBe13E0120Bb5892fCbfE0b
VITE_PROTOCOL_ACCESS_CONTROL_ADDRESS=0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A
```

Contract addresses are automatically loaded from `deployments.json` in the project root, but can be overridden via environment variables.

## Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

```bash
# Build for production
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── services/       # API and contract clients
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── context/        # React context providers
│   ├── config/         # Configuration constants
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── package.json
└── vite.config.js
```

## Services

### API Client (`src/services/apiClient.js`)
Handles all HTTP requests to backend services:
- Issuer service methods
- User service methods
- Protocol service methods
- Proof service methods

### Contract Client (`src/services/contractClient.js`)
Direct smart contract interactions for read operations:
- Check credential validity
- Check user access
- Get protocol requirements
- Listen to contract events

### Wallet Service (`src/services/walletService.js`)
Web3 wallet management:
- Connect/disconnect MetaMask
- Switch networks
- Handle account changes
- Provide provider and signer instances

## Usage

1. **Connect Wallet**: Click "Connect Wallet" button to connect MetaMask
2. **Switch Network**: The app will prompt to switch to Mantle Sepolia if needed
3. **Use Features**: Navigate through the app to use issuer, user, or protocol features

## Technology Stack

- **React 18+**: UI framework
- **Vite**: Build tool and dev server
- **Material-UI**: Component library
- **ethers.js v6**: Web3 interactions
- **React Router**: Navigation
- **React Query**: Data fetching and caching
- **Zustand**: State management (if needed)

## Backend Integration

The frontend communicates with backend services through the API Gateway at `http://localhost:3000/api/v1`. Make sure all backend services are running before using the frontend.

## Smart Contract Integration

Contract addresses are loaded from `deployments.json` in the project root. The frontend uses these addresses to interact with:
- `CredentialRegistry`: Credential management
- `ProtocolAccessControl`: Access control and verification
- `ZKVerifier`: ZK proof verification (used internally by ProtocolAccessControl)

## License

MIT

