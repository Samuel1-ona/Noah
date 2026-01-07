# NOAH Vault Example

A complete example demonstrating how to integrate the NOAH SDK with a DeFi vault contract. This example shows how to:

- Create a vault contract that requires KYC verification via NOAH
- Build a frontend that allows users to verify credentials and interact with the vault
- Demonstrate the complete flow from credential verification to deposit/withdrawal

## Overview

This example consists of:

1. **Vault Contract** (`contracts/Vault.sol`): A simple vault that integrates with ProtocolAccessControl to enforce KYC requirements
2. **Frontend Application**: A React app that demonstrates the complete user flow

## Features

- ✅ KYC-gated vault deposits
- ✅ Zero-knowledge proof generation and verification
- ✅ Real-time balance tracking
- ✅ Deposit and withdrawal functionality
- ✅ Access control based on NOAH credentials

## Prerequisites

Before running this example, ensure you have:

1. **Node.js 18+** and npm installed
2. **MetaMask** or compatible Web3 wallet
3. **Backend API** running (for proof generation)
4. **Network Access** to Mantle Sepolia testnet (or your configured network)
5. **Deployed Contracts**:
   - ProtocolAccessControl contract
   - Vault contract (deployed with ProtocolAccessControl address)

## Setup

### Step 1: Build the SDK

Build the NOAH SDK package first:

```bash
cd ../../packages/noah-sdk
npm install
npm run build
```

### Step 2: Install Dependencies

```bash
cd examples/vault-example
npm install
```

### Step 3: Deploy the Vault Contract

Before using the frontend, you need to deploy the Vault contract. The contract is located at `contracts/Vault.sol`.

**Using Foundry:**

```bash
# From the project root
forge build
forge create Vault --constructor-args <PROTOCOL_ACCESS_CONTROL_ADDRESS> --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
```

**Using Hardhat:**

```javascript
// In your deployment script
const Vault = await ethers.getContractFactory("Vault");
const vault = await Vault.deploy(PROTOCOL_ACCESS_CONTROL_ADDRESS);
await vault.waitForDeployment();
console.log("Vault deployed to:", await vault.getAddress());
```

### Step 4: Configure Contracts

The vault address is automatically loaded from `contracts.json`. The file is already configured with the deployed vault address:

```json
{
  "contracts": {
    "Vault": "0x216896Cab28d2DbAB19cA3f08f36daD40705e9AF",
    "ProtocolAccessControl": "0xF599F186aC6fD2a9bECd9eDEE91fd58D3Dc3dB0A"
  }
}
```

Create a `.env` file in the root directory (required):

```env
# Backend API Base URL (required)
# This should point to your Noah Protocol backend API
VITE_API_BASE_URL=https://noah-abw7.onrender.com

# Optional: Override contract addresses if needed
# VITE_VAULT_ADDRESS=0x...
# VITE_PROTOCOL_ACCESS_CONTROL_ADDRESS=0x...
# VITE_CREDENTIAL_HASH=0x...
```

You can copy `.env.example` to `.env` and update the values as needed.

### Deployment to Vercel

For deploying to Vercel, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions and required environment variables.

### Step 5: Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5175`

## Usage Flow

### 1. Connect Wallet

Click "Connect MetaMask" and approve the connection request.

### 2. Enter Vault Address

Enter the deployed vault contract address in the "Vault Address" field.

### 3. Verify Credentials

In the "Verify Your Credentials" section:

1. Enter your credential hash
2. Enter your age, jurisdiction, and accredited status
3. Click "Check Credential" to verify it's valid
4. Click "Generate Proof" to create a zero-knowledge proof
5. Click "Verify & Grant Access" to submit the proof and gain access

### 4. Interact with Vault

Once you have access:

1. View your balance and total vault deposits
2. Deposit ETH by entering an amount and clicking "Deposit"
3. Withdraw ETH by entering an amount and clicking "Withdraw"

## Contract Details

### Vault.sol

The vault contract provides:

- **Deposit**: Users can deposit ETH after verifying KYC credentials
- **Withdraw**: Users can withdraw their deposited funds
- **Access Control**: All operations check user access via ProtocolAccessControl
- **Requirements Management**: Vault can set and retrieve KYC requirements

### Key Functions

```solidity
// Set KYC requirements for the vault
function setRequirements(
    uint256 minAge,
    uint256[] memory allowedJurisdictions,
    bool requireAccredited
) external;

// Deposit funds (requires KYC verification)
function deposit() external payable;

// Withdraw funds
function withdraw(uint256 amount) external;

// Check if user has access
function hasAccess(address user) external view returns (bool);

// Get user balance
function getBalance(address user) external view returns (uint256);
```

## Frontend Components

### App.jsx

Main application component that:
- Manages wallet connection
- Handles vault address input
- Checks user access status
- Coordinates between verification and vault components

### UserVerification.jsx

Component for credential verification:
- Credential hash validation
- Proof generation
- Access verification and granting

### VaultComponent.jsx

Component for vault interactions:
- Balance display
- Deposit functionality
- Withdrawal functionality
- Requirements display

## Integration with NOAH SDK

This example uses the NOAH SDK in two ways:

### 1. User Operations (UserVerification)

```javascript
import { useUser } from 'noah-protocol-sdk';

const {
  protocolRequirements,
  generateProof,
  verifyAndGrantAccess,
  checkCredentialValidity,
} = useUser(signer, {
  userAddress: account,
  protocolAddress: vaultAddress,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
});
```

### 2. Protocol Operations (VaultComponent)

The vault contract itself uses ProtocolAccessControl, which is managed through the SDK's ProtocolClient (used in other examples for setting requirements).

## Troubleshooting

### "User must verify KYC credentials before depositing"

- Ensure you've completed the credential verification flow
- Check that your proof was successfully verified
- Verify the vault address is correct

### "Failed to generate proof"

- Ensure the backend API is running
- Verify your credential data matches the requirements
- Check that the credential hash is valid and not revoked

### "Transaction failed"

- Check you have sufficient ETH for gas
- Verify you're on the correct network
- Ensure the vault contract is deployed correctly

### "Cannot read properties of undefined"

- Make sure the SDK is built: `cd ../../packages/noah-sdk && npm run build`
- Check that all environment variables are set correctly
- Verify the vault address is a valid contract address

## Next Steps

1. **Customize Requirements**: Modify the vault to set specific KYC requirements
2. **Add Features**: Implement additional vault features (interest, staking, etc.)
3. **Enhanced UI**: Improve the user interface with better error handling and loading states
4. **Testing**: Add comprehensive tests for the contract and frontend

## Related Examples

- [React Example](../react-example/): Basic SDK usage with React
- [Next.js Example](../nextjs-example/): Full-stack Next.js integration

## License

MIT

