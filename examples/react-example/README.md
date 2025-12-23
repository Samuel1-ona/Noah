# NOAH SDK - React Example

A React application built with Vite demonstrating NOAH SDK usage with React hooks.

## Features

- React Query integration for data fetching
- Protocol management with `useProtocol` hook
- User operations with `useUser` hook
- Real-time wallet connection
- Modern UI with CSS

## Setup

1. **Build the SDK first:**
   ```bash
   cd ../../packages/noah-sdk
   npm install
   npm run build
   ```

2. **Install dependencies:**
   ```bash
   cd ../../examples/react-example
   npm install
   ```

3. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - The app will open automatically at `http://localhost:5174`
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
   - Fill in credential details (age, jurisdiction, accredited status)
   - Check credential validity
   - Generate ZK proof

## Project Structure

```
react-example/
├── src/
│   ├── App.jsx          # Main app component
│   ├── App.css          # Styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **@tanstack/react-query** - Data fetching and caching
- **ethers.js** - Ethereum library
- **NOAH SDK** - NOAH protocol SDK

## Notes

- The SDK hooks (`useProtocol`, `useUser`) require React Query to be set up
- Make sure the backend API is running for proof generation
- Contract addresses are configured in the SDK package


