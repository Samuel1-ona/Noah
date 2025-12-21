import dotenv from 'dotenv';
import { getProvider, getCredentialRegistry, getProtocolAccessControl } from './src/config/contracts.js';
import { initDatabase } from './src/config/database.js';

dotenv.config();

async function testConnection() {
  console.log('🧪 Testing Backend Connection...\n');

  try {
    // Test 1: Database initialization
    console.log('1️⃣ Testing database...');
    await initDatabase();
    console.log('   ✅ Database initialized\n');

    // Test 2: Provider connection
    console.log('2️⃣ Testing RPC connection...');
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Connected to network. Latest block: ${blockNumber}\n`);

    // Test 3: Contract addresses
    console.log('3️⃣ Testing contract addresses...');
    const { CONTRACT_ADDRESSES } = await import('./src/config/contracts.js');
    console.log(`   CredentialRegistry: ${CONTRACT_ADDRESSES.CredentialRegistry}`);
    console.log(`   ZKVerifier: ${CONTRACT_ADDRESSES.ZKVerifier}`);
    console.log(`   ProtocolAccessControl: ${CONTRACT_ADDRESSES.ProtocolAccessControl}\n`);

    // Test 4: Contract instances
    console.log('4️⃣ Testing contract instances...');
    const registry = getCredentialRegistry(provider);
    const accessControl = getProtocolAccessControl(provider);
    
    // Try to read from contracts
    const owner = await registry.owner();
    console.log(`   ✅ CredentialRegistry owner: ${owner}`);
    
    const zkVerifier = await accessControl.zkVerifier();
    console.log(`   ✅ ProtocolAccessControl zkVerifier: ${zkVerifier}`);
    
    const credentialRegistry = await accessControl.credentialRegistry();
    console.log(`   ✅ ProtocolAccessControl credentialRegistry: ${credentialRegistry}\n`);

    console.log('✅ All tests passed! Backend is ready to use.\n');
    console.log('📋 Next steps:');
    console.log('   1. Set ISSUER_PRIVATE_KEY in .env file');
    console.log('   2. Run: npm start (or npm run dev)');
    console.log('   3. Services will start on ports 3001-3004');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConnection();

