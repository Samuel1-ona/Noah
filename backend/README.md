# ZK-KYC Backend Services

Backend services for interacting with the ZK-KYC smart contracts.

## Structure

```
backend/
├── src/
│   ├── issuer/          # Issuer service (KYC provider)
│   │   └── server.js    # API for credential registration/revocation
│   ├── user/            # User service
│   │   └── server.js    # API for checking access, requirements
│   ├── protocol/        # Protocol service (DeFi protocols)
│   ├── config/          # Contract configuration
│   │   └── contracts.js # Contract ABIs and addresses
│   └── utils/           # Utility functions
├── config/              # Configuration files
└── scripts/             # Helper scripts
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the `.env` file with:
- Contract addresses (already set from deployments.json)
- Issuer private key (for credential registration)
- RPC URL

### 3. Run Services

#### Issuer Service

```bash
npm run issuer:dev
# or
node src/issuer/server.js
```

Runs on port 3001 by default.

#### User Service

```bash
npm run user:dev
# or
node src/user/server.js
```

Runs on port 3002 by default.

## API Endpoints

### Issuer Service (Port 3001)

#### Register Credential
```bash
POST /credential/register
Body: {
  "credentialHash": "0x...",
  "userAddress": "0x..."
}
```

#### Revoke Credential
```bash
POST /credential/revoke
Body: {
  "credentialHash": "0x..."
}
```

#### Check Credential Validity
```bash
GET /credential/check/:hash
```

### User Service (Port 3002)

#### Get Protocol Requirements
```bash
GET /protocol/:address/requirements
```

#### Check User Access
```bash
GET /access/:protocol/:user
```

## Contract Addresses

Loaded from `deployments.json`:
- CredentialRegistry: `0x5B005bC07121C9bbcD640da44a94Fa80dBf0Cc19`
- ZKVerifier: `0x0350078bACf0F37CD32b90Aa6920012F504d056b`
- ProtocolAccessControl: `0x1f6E70a8F73c556E7722e2F82c0E83aAe31046c1`

## Next Steps

1. Add database for credential storage
2. Add authentication/authorization
3. Add proof generation service
4. Add event listeners for on-chain events
5. Add monitoring and logging

