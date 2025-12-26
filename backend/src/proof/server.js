import express from 'express';
import cors from 'cors';
import { config } from '../config/env.js';
import { generateProof, formatProofForOnChain, createProofInput } from '../utils/proof-generator.js';
import { proofDB } from '../config/database.js';
import { authenticateToken } from '../utils/auth.js';
import { logger, requestLogger } from '../utils/logger.js';
import { errorHandler, asyncHandler, notFoundHandler } from '../middleware/error-handler.js';
import { apiLimiter, strictLimiter } from '../middleware/rate-limiter.js';
import { generateProofValidator, hashValidator, validate } from '../middleware/validators.js';

const app = express();
const PORT = config.ports.proof;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
// Rate limiting is handled at the gateway level, no need to apply here
// app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'proof' });
});

// Generate proof
app.post('/generate',
  strictLimiter,
  authenticateToken,
  generateProofValidator,
  asyncHandler(async (req, res) => {
    // #region agent log
    logger.info('Proof generation request received', {
      hasCredential: !!req.body.credential,
      hasRequirements: !!req.body.requirements,
      credentialKeys: req.body.credential ? Object.keys(req.body.credential) : [],
      requirementsKeys: req.body.requirements ? Object.keys(req.body.requirements) : [],
      credentialAge: req.body.credential?.age,
      credentialJurisdiction: req.body.credential?.jurisdiction,
      credentialJurisdictionType: typeof req.body.credential?.jurisdiction,
      requirementsMinAge: req.body.requirements?.minAge,
      requirementsAllowedJurisdictions: req.body.requirements?.allowedJurisdictions,
      requirementsAllowedJurisdictionsType: Array.isArray(req.body.requirements?.allowedJurisdictions) ? 'array' : typeof req.body.requirements?.allowedJurisdictions,
      requirementsRequireAccredited: req.body.requirements?.requireAccredited,
    });
    // #endregion
    const { credential, requirements } = req.body;

    // #region agent log
    logger.info('Before createProofInput', {
      credentialAge: credential?.age,
      credentialJurisdiction: credential?.jurisdiction,
      credentialJurisdictionType: typeof credential?.jurisdiction,
      requirementsAllowedJurisdictions: requirements?.allowedJurisdictions,
    });
    // #endregion

    // Create proof input
    let proofInput;
    try {
      proofInput = createProofInput(credential, requirements);
      // #region agent log
      logger.info('After createProofInput', {
        proofInputKeys: Object.keys(proofInput),
        actualAge: proofInput.actualAge,
        actualJurisdiction: proofInput.actualJurisdiction,
        allowedJurisdictionsLength: proofInput.allowedJurisdictions?.length,
      });
      // #endregion
    } catch (error) {
      // #region agent log
      logger.error('Error in createProofInput', {
        error: error.message,
        stack: error.stack,
        credential,
        requirements,
      });
      // #endregion
      throw error;
    }

    // Generate proof
    logger.info('Generating proof', { credentialHash: credential.credentialHash });
    let proofData;
    try {
      proofData = await generateProof(proofInput);
      // #region agent log
      logger.info('After generateProof', {
        hasProof: !!proofData.proof,
        hasPublicInputs: !!proofData.publicInputs,
        publicInputsLength: proofData.publicInputs?.length,
      });
      // #endregion
    } catch (error) {
      // #region agent log
      logger.error('Error in generateProof', {
        error: error.message,
        stack: error.stack,
        proofInput,
      });
      // #endregion
      throw error;
    }

    // Format for on-chain submission (pass original input and credential hash to reconstruct public signals)
    let formattedProof;
    try {
      formattedProof = formatProofForOnChain(proofData, proofInput, credential.credentialHash);
      // #region agent log
      logger.info('After formatProofForOnChain', {
        hasFormattedProof: !!formattedProof,
        hasA: !!formattedProof.a,
        hasB: !!formattedProof.b,
        hasC: !!formattedProof.c,
      });
      // #endregion
    } catch (error) {
      // #region agent log
      logger.error('Error in formatProofForOnChain', {
        error: error.message,
        stack: error.stack,
        proofData,
        proofInput,
        credentialHash: credential.credentialHash,
      });
      // #endregion
      throw error;
    }

    // Store proof in database
    if (proofDB) {
      await proofDB.create({
      credentialHash: credential.credentialHash,
      userAddress: credential.userAddress || req.user.address,
      protocolAddress: requirements.protocolAddress,
      proofData: formattedProof,
      publicSignals: proofData.publicInputs,
      status: 'generated',
      });
    }

    logger.info('Proof generated', { credentialHash: credential.credentialHash });

    res.json({
      success: true,
      proof: formattedProof,
      publicSignals: formattedProof.publicSignals, // Use formatted proof's publicSignals (has correct truncated hash)
      publicInputs: proofData.publicInputs, // Keep for backward compatibility
      credentialHash: credential.credentialHash,
    });
  })
);

// Get proofs for a credential
app.get('/credential/:hash',
  authenticateToken,
  hashValidator('hash'),
  validate,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const proofs = proofDB ? await proofDB.findByCredential(hash) : [];

    res.json({
      credentialHash: hash,
      proofs,
    });
  })
);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('Proof service started', { port: PORT });
  console.log(`🚀 Proof service running on port ${PORT}`);
});

