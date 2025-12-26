# NOAH SDK - Next.js Example

A full-stack Next.js application demonstrating NOAH SDK usage with server-side rendering and API routes.

## Features

- Next.js 16 with App Router
- TypeScript support
- Tailwind CSS for styling
- React Query integration
- Protocol management interface
- User operations interface
- Server-side API routes (ready for extension)

## Setup

1. **Build the SDK first:**
   ```bash
   cd ../../packages/noah-sdk
   npm install
   npm run build
   ```

2. **Install dependencies:**
   ```bash
   cd ../../examples/nextjs-example
   npm install
   ```

3. **Configure environment (optional):**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

4. **Start the development server:**
```bash
npm run dev
   ```

5. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - Make sure MetaMask is installed and connected to Mantle Sepolia

## Usage

1. **Connect Wallet:**
   - Click "Connect MetaMask" button
   - Approve the connection in MetaMask

2. **Protocol Operations:**
   - Set minimum age, allowed jurisdictions, and accredited requirement
   - Click "Set Requirements" to save
   - View current requirements

3. **User Operations:**
   - Enter protocol address and credential hash
   - Fill in credential details
   - Check credential validity
   - Generate ZK proof (requires backend API)

## Project Structure

```
nextjs-example/
├── app/
│   ├── components/        # React components
│   │   ├── ProtocolSection.tsx
│   │   └── UserSection.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # React Query provider
│   └── globals.css        # Global styles
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

## Technologies

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **@tanstack/react-query** - Data fetching and caching
- **ethers.js** - Ethereum library
- **NOAH SDK** - NOAH protocol SDK

## API Routes

You can extend this example by adding API routes in `app/api/` for:
- Proof generation (server-side)
- Credential management
- Protocol requirements caching

## Notes

- The SDK is configured via webpack alias in `next.config.js`
- Make sure the backend API is running for proof generation
- Contract addresses are configured in the SDK package
- This example uses client components for wallet interaction
