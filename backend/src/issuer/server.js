import express from 'express';
import cors from 'cors';
import { config } from '../config/env.js';
import { getCredentialRegistry, getSigner, getProvider } from '../config/contracts.js';
import { logger, requestLogger } from '../utils/logger.js';
import { errorHandler, asyncHandler, notFoundHandler } from '../middleware/error-handler.js';
import { apiLimiter, strictLimiter } from '../middleware/rate-limiter.js';
import { registerCredentialValidator, revokeCredentialValidator, hashValidator, addressParamValidator, validate } from '../middleware/validators.js';
import { ethers } from 'ethers';

// Import database
let credentialDB;
try {
  if (config.database.url || config.database.host) {
    const dbModule = await import('../config/database-pg.js');
    credentialDB = dbModule.credentialDB;
  } else {
    const dbModule = await import('../config/database.js');
    credentialDB = dbModule.credentialDB;
  }
} catch (error) {
  logger.warn('Database not available for credential lookup', { error: error.message });
}

const app = express();
const PORT = config.ports.issuer;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
// Rate limiting is handled at the gateway level, no need to apply here
// app.use(apiLimiter);

// Initialize contract
const issuerPrivateKey = process.env.ISSUER_PRIVATE_KEY;
if (!issuerPrivateKey) {
  console.error('⚠️  ISSUER_PRIVATE_KEY not set in .env');
}

const issuerSigner = issuerPrivateKey ? getSigner(issuerPrivateKey) : null;
const credentialRegistry = issuerSigner ? getCredentialRegistry(issuerSigner) : null;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'issuer' });
});

// Register a credential hash
app.post('/credential/register', 
  strictLimiter,
  registerCredentialValidator,
  asyncHandler(async (req, res) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'issuer/server.js:48',message:'Credential registration endpoint called',data:{credentialHash:req.body?.credentialHash,userAddress:req.body?.userAddress,hasAge:!!req.body?.age,hasJurisdiction:!!req.body?.jurisdiction,hasAccredited:req.body?.accredited!==undefined,hasCredentialDB:!!credentialDB},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion agent log
    
    if (!credentialRegistry) {
      throw new Error('Issuer not configured');
    }

    const { credentialHash, userAddress, age, jurisdiction, accredited } = req.body;
    
    // Get issuer address from the signer
    const issuerAddress = issuerSigner ? await issuerSigner.getAddress() : null;
    if (!issuerAddress) {
      throw new Error('Issuer address not available');
    }

    // Register credential on-chain
    const tx = await credentialRegistry.registerCredential(credentialHash, userAddress);
    await tx.wait();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'issuer/server.js:62',message:'Credential registered on-chain',data:{credentialHash,userAddress,txHash:tx.hash,issuerAddress,willSaveToDB:!!credentialDB},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion agent log

    logger.info('Credential registered', { credentialHash, userAddress, txHash: tx.hash });

    // Save credential to database if available
    if (credentialDB) {
      try {
        // Check if credential already exists
        const existing = await credentialDB.findByHash(credentialHash);
        
        if (existing) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'issuer/server.js:75',message:'Credential already exists in DB, skipping save',data:{credentialHash},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
          // #endregion agent log
          logger.info('Credential already exists in database', { credentialHash });
        } else {
          // Save credential to database (with or without full data)
          await credentialDB.create({
            credentialHash,
            userAddress,
            issuerAddress,
            age: age || null,
            jurisdiction: jurisdiction || null,
            accredited: accredited !== undefined ? (accredited ? 1 : 0) : 0,
          });
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'issuer/server.js:88',message:'Credential saved to database',data:{credentialHash,userAddress,issuerAddress,hasAge:!!age,hasJurisdiction:!!jurisdiction,accredited},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
          // #endregion agent log
          
          logger.info('Credential saved to database', { credentialHash, hasData: !!(age && jurisdiction) });
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'issuer/server.js:95',message:'Error saving credential to database',data:{credentialHash,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion agent log
        logger.error('Error saving credential to database', { error: error.message, credentialHash });
        // Don't fail the request if DB save fails - on-chain registration succeeded
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'issuer/server.js:102',message:'CredentialDB not available, skipping database save',data:{credentialHash},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion agent log
    }

    res.json({
      success: true,
      transactionHash: tx.hash,
      credentialHash,
      userAddress,
    });
  })
);

// Revoke a credential
app.post('/credential/revoke',
  strictLimiter,
  revokeCredentialValidator,
  asyncHandler(async (req, res) => {
    if (!credentialRegistry) {
      throw new Error('Issuer not configured');
    }

    const { credentialHash } = req.body;

    // Revoke credential on-chain
    const tx = await credentialRegistry.revokeCredential(credentialHash);
    await tx.wait();

    logger.info('Credential revoked', { credentialHash, txHash: tx.hash });

    res.json({
      success: true,
      transactionHash: tx.hash,
      credentialHash,
    });
  })
);

// Check credential validity
app.get('/credential/check/:hash',
  hashValidator('hash'),
  validate,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const provider = getProvider();
    const registry = getCredentialRegistry(provider);

    const isValid = await registry.isCredentialValid(hash);

    res.json({
      credentialHash: hash,
      isValid,
    });
  })
);

// Get all credentials issued by an issuer
app.get('/credentials/:issuer',
  addressParamValidator('issuer'),
  validate,
  asyncHandler(async (req, res) => {
    const { issuer } = req.params;

    if (!credentialDB) {
      // Fallback: try to query on-chain events
      logger.warn('Database not available, cannot fetch issuer credentials');
      return res.json([]);
    }

    try {
      const credentials = await credentialDB.findByIssuer(issuer);
      res.json(credentials || []);
    } catch (error) {
      logger.error('Error fetching issuer credentials', { error: error.message, issuer });
      // Return empty array on error
      res.json([]);
    }
  })
);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('Issuer service started', { port: PORT, network: config.network.network });
  console.log(`🚀 Issuer service running on port ${PORT}`);
  console.log(`📡 Network: ${config.network.network}`);
});

