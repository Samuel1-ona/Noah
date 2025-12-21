import express from 'express';
import cors from 'cors';
import { config } from '../config/env.js';
import { getProtocolAccessControl, getProvider, getCredentialRegistry } from '../config/contracts.js';
import { logger, requestLogger } from '../utils/logger.js';
import { errorHandler, asyncHandler, notFoundHandler } from '../middleware/error-handler.js';
import { apiLimiter } from '../middleware/rate-limiter.js';
import { addressParamValidator, hashValidator, validate } from '../middleware/validators.js';

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
const PORT = config.ports.user;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user' });
});

// Get protocol requirements
app.get('/protocol/:address/requirements',
  addressParamValidator('address'),
  validate,
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const provider = getProvider();
    const accessControl = getProtocolAccessControl(provider);

    const requirements = await accessControl.getRequirements(address);

    res.json({
      protocol: address,
      minAge: requirements.minAge.toString(),
      allowedJurisdictions: requirements.allowedJurisdictions.map(j => j.toString()),
      requireAccredited: requirements.requireAccredited,
    });
  })
);

// Check user access
app.get('/access/:protocol/:user',
  addressParamValidator('protocol'),
  addressParamValidator('user'),
  validate,
  asyncHandler(async (req, res) => {
    const { protocol, user } = req.params;
    const provider = getProvider();
    const accessControl = getProtocolAccessControl(provider);

    const hasAccess = await accessControl.hasAccess(protocol, user);

    res.json({
      protocol,
      user,
      hasAccess,
    });
  })
);

// Get credentials for a user
app.get('/credentials/:user',
  addressParamValidator('user'),
  validate,
  asyncHandler(async (req, res) => {
    const { user } = req.params;

    if (!credentialDB) {
      // Fallback: return empty array if database not available
      return res.json([]);
    }

    try {
      const credentials = await credentialDB.findByUser(user);
      res.json(credentials || []);
    } catch (error) {
      logger.error('Error fetching user credentials', { error: error.message, user });
      // Return empty array on error
      res.json([]);
    }
  })
);

// Get credential data by hash
app.get('/credential/:hash',
  hashValidator('hash'),
  validate,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:101',message:'Credential lookup started',data:{hash,hasCredentialDB:!!credentialDB},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log

    // First, try to get from database
    if (credentialDB) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:110',message:'Before database query',data:{hash,hashLength:hash?.length,hashType:typeof hash},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion agent log
        
        const credential = await credentialDB.findByHash(hash);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:110',message:'After database query',data:{hash,found:!!credential,credentialHash:credential?.credential_hash,credentialAge:credential?.age,credentialJurisdiction:credential?.jurisdiction},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion agent log
        
        if (credential) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:112',message:'Credential found in database',data:{hash,credentialHash:credential.credential_hash},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion agent log
          return res.json(credential);
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:115',message:'Database query error',data:{hash,error:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion agent log
        logger.error('Error fetching credential from database', { error: error.message, hash });
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:117',message:'CredentialDB not available',data:{hash},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion agent log
    }

    // If not in database, check on-chain
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:120',message:'Checking credential on-chain',data:{hash},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion agent log
      
      const provider = getProvider();
      const registry = getCredentialRegistry(provider);
      const isValid = await registry.isCredentialValid(hash);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:125',message:'On-chain check result',data:{hash,isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion agent log
      
      if (isValid) {
        // Credential exists on-chain but not in database
        // Get issuer address from contract
        const issuerAddress = await registry.credentialIssuers(hash);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/server.js:130',message:'Credential exists on-chain but not in DB',data:{hash,issuerAddress,existsOnChain:true,existsInDB:false},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion agent log
        
        return res.status(404).json({
          error: {
            message: 'Credential found on-chain but data not available in database',
            details: 'The credential hash is registered on-chain, but the credential data (age, jurisdiction, accredited) is not available. Please contact the issuer to ensure the credential is properly registered in the system.',
            credentialHash: hash,
            issuerAddress: issuerAddress,
            existsOnChain: true,
          },
        });
      } else {
        // Credential doesn't exist on-chain either
        return res.status(404).json({
          error: {
            message: 'Credential not found',
            details: 'The credential hash is not registered on-chain. Please ensure the credential has been registered by an issuer.',
            credentialHash: hash,
            existsOnChain: false,
          },
        });
      }
    } catch (error) {
      logger.error('Error checking credential on-chain', { error: error.message, hash });
      return res.status(500).json({
        error: {
          message: 'Failed to check credential',
          details: error.message,
        },
      });
    }
  })
);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('User service started', { port: PORT, network: config.network.network });
  console.log(`🚀 User service running on port ${PORT}`);
  console.log(`📡 Network: ${config.network.network}`);
});

