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
    const { credential, requirements } = req.body;

    // Create proof input
    const proofInput = createProofInput(credential, requirements);

    // Generate proof
    logger.info('Generating proof', { credentialHash: credential.credentialHash });
    const proofData = await generateProof(proofInput);

    // Format for on-chain submission (pass original input and credential hash to reconstruct public signals)
    const formattedProof = formatProofForOnChain(proofData, proofInput, credential.credentialHash);

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

