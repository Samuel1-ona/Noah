import { ethers } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY || "090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a";
const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.mantle.xyz";

// Load deployments
const deployments = JSON.parse(readFileSync('deployments.json', 'utf8'));
const CONTRACT_ADDRESSES = deployments.contracts;

// Load ABIs
const loadABI = (contractName) => {
  const abiPath = join('out', `${contractName}.sol`, `${contractName}.json`);
  const contractJson = JSON.parse(readFileSync(abiPath, 'utf8'));
  return contractJson.abi;
};

// Setup provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const deployerAddress = await signer.getAddress();

// Helper to get current nonce
const getCurrentNonce = async () => {
  return await provider.getTransactionCount(deployerAddress, 'pending');
};

console.log('🔧 Setup:');
console.log('  Deployer:', deployerAddress);
console.log('  RPC URL:', RPC_URL);
console.log('  CredentialRegistry:', CONTRACT_ADDRESSES.CredentialRegistry);
console.log('  ZKVerifier:', CONTRACT_ADDRESSES.ZKVerifier);
console.log('  ProtocolAccessControl:', CONTRACT_ADDRESSES.ProtocolAccessControl);
console.log('');

// Get contract instances
const credentialRegistry = new ethers.Contract(
  CONTRACT_ADDRESSES.CredentialRegistry,
  loadABI('CredentialRegistry'),
  signer
);

const protocolAccessControl = new ethers.Contract(
  CONTRACT_ADDRESSES.ProtocolAccessControl,
  loadABI('ProtocolAccessControl'),
  signer
);

// Step 1: Generate a credential hash (with timestamp to make it unique)
console.log('📝 Step 1: Generating credential hash...');
const userAddress = deployerAddress; // Using deployer as user for testing
const timestamp = Date.now();
const credentialData = `user:${userAddress},age:28,jurisdiction:1234567890,accredited:true,timestamp:${timestamp}`;
const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));
console.log('  Credential Hash:', credentialHash);
console.log('');

// Step 2: Register credential in CredentialRegistry
console.log('📝 Step 2: Registering credential in CredentialRegistry...');
try {
  // First, add deployer as a trusted issuer (if owner)
  const owner = await credentialRegistry.owner();
  if (owner.toLowerCase() === deployerAddress.toLowerCase()) {
    console.log('  Adding deployer as trusted issuer...');
    const tx1 = await credentialRegistry.addIssuer(deployerAddress, "Test Issuer");
    await tx1.wait();
    console.log('  ✅ Added as trusted issuer');
  }
} catch (error) {
  console.log('  ℹ️  Issuer already added or not owner');
}

// Check if credential already exists
const credentialExists = await credentialRegistry.credentials(credentialHash);
if (credentialExists) {
  console.log('  ℹ️  Credential already exists, skipping registration');
} else {
  // Register the credential
  console.log('  Registering credential...');
  const tx2 = await credentialRegistry.registerCredential(credentialHash, userAddress);
  const receipt2 = await tx2.wait();
  console.log('  ✅ Credential registered!');
  console.log('  Transaction:', receipt2.hash);
}
console.log('');

// Step 3: Set protocol requirements
console.log('📝 Step 3: Setting protocol requirements...');
const minAge = 18;
const allowedJurisdictions = [1234567890, 1111111111];
const requireAccredited = true;

const nonce3 = await getCurrentNonce();
const tx3 = await protocolAccessControl.setRequirements(
  minAge,
  allowedJurisdictions,
  requireAccredited,
  { nonce: nonce3 }
);
const receipt3 = await tx3.wait();
console.log('  ✅ Requirements set!');
console.log('  Transaction:', receipt3.hash);
console.log('  Min Age:', minAge);
console.log('  Allowed Jurisdictions:', allowedJurisdictions);
console.log('  Require Accredited:', requireAccredited);
console.log('');

// Step 4: Generate proof
console.log('📝 Step 4: Generating ZK proof...');
const proofInput = {
  actualAge: 28,
  actualJurisdiction: 1234567890,
  actualAccredited: 1,
  credentialHash: parseInt(credentialHash.slice(2, 18), 16), // First 8 bytes (64 bits)
  minAge: minAge,
  allowedJurisdictions: [1234567890, 1111111111, 0, 0, 0, 0, 0, 0, 0, 0],
  requireAccredited: 1,
  credentialHashPublic: parseInt(credentialHash.slice(2, 18), 16)
};

// Write input file
const inputPath = 'build/test-proof-input.json';
writeFileSync(inputPath, JSON.stringify(proofInput, null, 2));
console.log('  Input file created:', inputPath);

// Generate proof using Go tool
console.log('  Running proof generation...');
const { stdout, stderr } = await execAsync(`./prove ${inputPath}`);
if (stderr) {
  console.log('  stderr:', stderr);
}

// Read generated proof
const proofPath = 'build/proof.json';
const proofData = JSON.parse(readFileSync(proofPath, 'utf8'));
console.log('  ✅ Proof generated!');
console.log('');

// Step 5: Format proof for on-chain verification
console.log('📝 Step 5: Formatting proof for on-chain verification...');
const proof = proofData.proof;
const publicInputs = proofData.publicInputs;

// Extract proof components (gnark format: Ar, Bs, Krs)
const a = [
  proof.Ar.X,
  proof.Ar.Y
];

const b = [
  [proof.Bs.X.A0, proof.Bs.X.A1],
  [proof.Bs.Y.A0, proof.Bs.Y.A1]
];

const c = [
  proof.Krs.X,
  proof.Krs.Y
];

// Extract public signals - the Go tool outputs public witness as a vector
// We need to reconstruct the 14-element array: [0]=minAge, [1-10]=allowedJurisdictions, [11]=requireAccredited, [12]=credentialHashPublic, [13]=isValid
let publicSignals = [];

// Try to extract from publicInputs (gnark outputs as vector)
if (Array.isArray(publicInputs) && publicInputs.length > 0) {
  publicSignals = publicInputs.map(s => s.toString());
} else if (publicInputs?.signals && Array.isArray(publicInputs.signals)) {
  publicSignals = publicInputs.signals.map(s => s.toString());
} else if (typeof publicInputs === 'object' && publicInputs !== null) {
  // Try to extract values from object
  const values = Object.values(publicInputs).filter(v => v !== null && v !== undefined);
  if (values.length > 0) {
    publicSignals = values.map(v => v.toString());
  }
}

// If still empty, reconstruct from proof input
// The circuit has 14 public inputs: minAge, 10 jurisdictions, requireAccredited, credentialHashPublic, isValid
if (publicSignals.length === 0) {
  publicSignals = [
    proofInput.minAge.toString(),
    ...proofInput.allowedJurisdictions.slice(0, 10).map(j => j.toString()),
    proofInput.requireAccredited.toString(),
    proofInput.credentialHashPublic.toString(),
    '1' // isValid
  ];
} else if (publicSignals.length < 14) {
  // Pad to 14 elements if needed
  while (publicSignals.length < 13) {
    publicSignals.push('0');
  }
  if (publicSignals.length === 13) {
    publicSignals.push('1'); // isValid
  }
}

// Ensure exactly 13 elements for ProtocolAccessControl (it will add isValid=1 to make 14)
const publicSignalsForProtocol = publicSignals.slice(0, 13);
console.log('  Public signals (13 for ProtocolAccessControl):', publicSignalsForProtocol);

console.log('  Proof components extracted');
console.log('  Public signals length:', publicSignals.length);
console.log('');

// Step 6: Verify proof on-chain
console.log('📝 Step 6: Verifying proof on-chain...');
console.log('  Calling verifyAndGrantAccess...');

try {
  const tx4 = await protocolAccessControl.verifyAndGrantAccess(
    a,
    b,
    c,
    publicSignalsForProtocol, // 13 elements - ProtocolAccessControl will add isValid=1 to make 14
    credentialHash,
    userAddress
  );
  
  console.log('  Transaction sent:', tx4.hash);
  const receipt4 = await tx4.wait();
  console.log('  ✅ Proof verified and access granted!');
  console.log('  Transaction:', receipt4.hash);
  console.log('  Gas used:', receipt4.gasUsed.toString());
  console.log('');
  
  // Check if access was granted
  const hasAccess = await protocolAccessControl.hasAccess(protocolAccessControl.target, userAddress);
  console.log('  ✅ Access status:', hasAccess);
  
} catch (error) {
  console.error('  ❌ Verification failed:', error.message);
  if (error.reason) {
    console.error('  Reason:', error.reason);
  }
  if (error.data) {
    console.error('  Data:', error.data);
  }
  process.exit(1);
}

console.log('');
console.log('🎉 Proof generation and verification test completed successfully!');

