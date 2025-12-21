import express from 'express';
import cors from 'cors';
import { config } from '../config/env.js';
import { getProtocolAccessControl, getSigner, getProvider, CONTRACT_ADDRESSES } from '../config/contracts.js';
import { logger, requestLogger } from '../utils/logger.js';
import { errorHandler, asyncHandler, notFoundHandler } from '../middleware/error-handler.js';
import { apiLimiter, strictLimiter } from '../middleware/rate-limiter.js';
import { setRequirementsValidator, addressParamValidator, addressValidator, validate } from '../middleware/validators.js';
import { ethers } from 'ethers';

const app = express();
const PORT = config.ports.protocol;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'protocol' });
});

// Set protocol requirements
app.post('/requirements/set',
  strictLimiter,
  (req, res, next) => {
    // Debug: log request body
    console.log('📥 Request received:', {
      body: req.body,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.get('content-type'),
      bodyType: typeof req.body,
      bodyEmpty: !req.body || Object.keys(req.body).length === 0,
      allowedJurisdictions: req.body?.allowedJurisdictions?.map((j, i) => ({
        index: i,
        value: typeof j === 'string' ? j.substring(0, 30) + '...' : j,
        type: typeof j,
        isString: typeof j === 'string',
        length: typeof j === 'string' ? j.length : undefined,
      })),
    });
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Request body is empty or not parsed',
          hint: 'Make sure Content-Type header is set to application/json and body is valid JSON',
        },
      });
    }
    next();
  },
  setRequirementsValidator,
  asyncHandler(async (req, res) => {
    const { protocolAddress, minAge, allowedJurisdictions, requireAccredited, privateKey } = req.body;

    // Use provided private key or env variable
    const protocolPrivateKey = privateKey || process.env.PROTOCOL_PRIVATE_KEY;
    if (!protocolPrivateKey) {
      throw new Error('Protocol private key required');
    }

    const signer = getSigner(protocolPrivateKey);
    const accessControl = getProtocolAccessControl(signer);

    // Convert jurisdictions to array of BigInt/uint256
    // Handles both numbers and string numbers (for large hash values)
    const jurisdictionsArray = allowedJurisdictions.map(j => {
      if (typeof j === 'string') {
        if (j.startsWith('0x')) {
          return BigInt(j);
        }
        // Handle large numeric strings (from jurisdiction hash conversion)
        return BigInt(j);
      }
      // Handle numbers
      return BigInt(j);
    });

    // Set requirements
    const tx = await accessControl.setRequirements(
      BigInt(minAge),
      jurisdictionsArray,
      requireAccredited
    );
    await tx.wait();

    logger.info('Requirements set', { protocolAddress, minAge, txHash: tx.hash });

    res.json({
      success: true,
      transactionHash: tx.hash,
      protocolAddress,
      requirements: {
        minAge,
        allowedJurisdictions,
        requireAccredited,
      },
    });
  })
);

// Get protocol requirements
app.get('/requirements/:protocolAddress',
  addressParamValidator('protocolAddress'),
  validate,
  asyncHandler(async (req, res) => {
    const { protocolAddress } = req.params;
    const provider = getProvider();
    const accessControl = getProtocolAccessControl(provider);

    const requirements = await accessControl.getRequirements(protocolAddress);

    res.json({
      protocol: protocolAddress,
      minAge: requirements.minAge.toString(),
      allowedJurisdictions: requirements.allowedJurisdictions.map(j => j.toString()),
      requireAccredited: requirements.requireAccredited,
      isSet: requirements.isSet,
    });
  })
);

// Revoke user access
app.post('/access/revoke',
  strictLimiter,
  addressValidator('protocolAddress'),
  addressValidator('userAddress'),
  validate,
  asyncHandler(async (req, res) => {
    const { protocolAddress, userAddress, privateKey } = req.body;

    const protocolPrivateKey = privateKey || process.env.PROTOCOL_PRIVATE_KEY;
    if (!protocolPrivateKey) {
      throw new Error('Protocol private key required');
    }

    const signer = getSigner(protocolPrivateKey);
    const accessControl = getProtocolAccessControl(signer);

    const tx = await accessControl.revokeAccess(userAddress);
    await tx.wait();

    logger.info('Access revoked', { protocolAddress, userAddress, txHash: tx.hash });

    res.json({
      success: true,
      transactionHash: tx.hash,
      protocolAddress,
      userAddress,
    });
  })
);

// Verify proof and grant access
app.post('/access/verify',
  strictLimiter,
  (req, res, next) => {
    // Debug: log request body
    console.log('📥 Verify request received:', {
      body: req.body,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.get('content-type'),
      bodyEmpty: !req.body || Object.keys(req.body).length === 0,
    });
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Request body is empty or not parsed',
          hint: 'Make sure Content-Type header is set to application/json and body is valid JSON',
        },
      });
    }
    next();
  },
  asyncHandler(async (req, res) => {
    let { protocolAddress, userAddress, credentialHash, proof, publicSignals, privateKey } = req.body;

    console.log('🔍 Extracting fields from request:', {
      hasProtocolAddress: !!protocolAddress,
      hasUserAddress: !!userAddress,
      hasCredentialHash: !!credentialHash,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      proofKeys: proof ? Object.keys(proof) : null,
      proofHasPublicSignals: proof?.publicSignals ? true : false,
    });

    // Handle case where publicSignals is inside proof object (from proof/generate response)
    if (proof && proof.publicSignals && !publicSignals) {
      console.log('📦 Extracting publicSignals from proof object');
      publicSignals = proof.publicSignals;
      // Extract just the proof components (a, b, c) from the full proof object
      proof = {
        a: proof.a,
        b: proof.b,
        c: proof.c,
      };
    }

    // Validate required fields
    if (!protocolAddress || !userAddress || !credentialHash || !proof || !publicSignals) {
      const missing = [];
      if (!protocolAddress) missing.push('protocolAddress');
      if (!userAddress) missing.push('userAddress');
      if (!credentialHash) missing.push('credentialHash');
      if (!proof) missing.push('proof');
      if (!publicSignals) missing.push('publicSignals');
      
      console.error('❌ Missing fields:', missing);
      console.error('📋 Received body:', JSON.stringify(req.body, null, 2));
      
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    console.log('✅ All required fields present');

    // Use provided private key or env variable
    const protocolPrivateKey = privateKey || process.env.PROTOCOL_PRIVATE_KEY;
    if (!protocolPrivateKey) {
      throw new Error('Protocol private key required');
    }

    const signer = getSigner(protocolPrivateKey);
    const accessControl = getProtocolAccessControl(signer);

    // Convert proof arrays to BigInt arrays
    const a = [BigInt(proof.a[0]), BigInt(proof.a[1])];
    const b = [
      [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
      [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])]
    ];
    const c = [BigInt(proof.c[0]), BigInt(proof.c[1])];

    // Ensure publicSignals is an array
    let publicSignalsArray;
    if (Array.isArray(publicSignals)) {
      publicSignalsArray = publicSignals.slice(0, 13).map(s => BigInt(s));
    } else if (typeof publicSignals === 'object' && publicSignals !== null) {
      // If it's an object, try to extract array from common properties
      publicSignalsArray = (publicSignals.signals || Object.values(publicSignals))
        .slice(0, 13)
        .map(s => BigInt(s));
    } else {
      throw new Error('publicSignals must be an array');
    }

    // Debug logging
    console.log('🔍 Proof verification details:', {
      proofA: a.map(x => x.toString()),
      proofB: b.map(row => row.map(x => x.toString())),
      proofC: c.map(x => x.toString()),
      publicSignals: publicSignalsArray.map(s => s.toString()),
      credentialHash,
      protocolAddress,
      userAddress,
    });

    let tx;
    let verificationError = null;
    try {
      // Call verifyAndGrantAccess
      tx = await accessControl.verifyAndGrantAccess(
        a,
        b,
        c,
        publicSignalsArray,
        credentialHash,
        userAddress
      );
      
      await tx.wait();
    } catch (error) {
      verificationError = error;
      throw error;
    }

    logger.info('Access granted via proof verification', {
      protocolAddress,
      userAddress,
      credentialHash,
      txHash: tx.hash,
    });

    res.json({
      success: true,
      transactionHash: tx.hash,
      protocolAddress,
      userAddress,
      credentialHash,
      message: 'Access granted successfully',
    });
  })
);

// Check user access
app.get('/access/:protocolAddress/:userAddress',
  addressParamValidator('protocolAddress'),
  addressParamValidator('userAddress'),
  validate,
  asyncHandler(async (req, res) => {
    const { protocolAddress, userAddress } = req.params;
    const provider = getProvider();
    const accessControl = getProtocolAccessControl(provider);

    const hasAccess = await accessControl.hasAccess(protocolAddress, userAddress);

    res.json({
      protocol: protocolAddress,
      user: userAddress,
      hasAccess,
    });
  })
);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('Protocol service started', { port: PORT, network: config.network.network });
  console.log(`🚀 Protocol service running on port ${PORT}`);
  console.log(`📡 Network: ${config.network.network}`);
});

