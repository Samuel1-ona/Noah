import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, unlinkSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate ZK proof using the Go proof generation tool
 * @param {Object} input - Proof input data
 * @returns {Promise<Object>} - Proof and public signals
 */
export async function generateProof(input) {
  try {
    // #region agent log
    const logPath = '/Users/machine/Documents/Pyp/.cursor/debug.log';
    try {
      appendFileSync(logPath, JSON.stringify({
        location: 'proof-generator.js:17',
        message: 'generateProof called',
        data: {
          inputKeys: Object.keys(input),
          actualAge: input.actualAge,
          actualJurisdiction: input.actualJurisdiction,
          allowedJurisdictionsLength: input.allowedJurisdictions?.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'A'
      }) + '\n');
    } catch (logError) {}
    // #endregion

    // Create temporary input file
    const inputPath = join(__dirname, '../../../build/proof-input-temp.json');
    
    // #region agent log
    try {
      const buildDir = join(__dirname, '../../../build');
      if (!existsSync(buildDir)) {
        mkdirSync(buildDir, { recursive: true });
      }
      appendFileSync(logPath, JSON.stringify({
        location: 'proof-generator.js:30',
        message: 'Build directory checked',
        data: { buildDir, inputPath, buildDirExists: existsSync(buildDir) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'B'
      }) + '\n');
    } catch (logError) {}
    // #endregion
    // Use a custom replacer to ensure large numbers (like credentialHash) are written correctly
    // Go can parse JSON numbers as int64, but we need to avoid scientific notation
    // CRITICAL: For BigInt values that exceed JavaScript's safe integer precision,
    // we need to write them as exact numeric strings in JSON, then manually fix the JSON
    const jsonString = JSON.stringify(input, (key, value) => {
      // Handle special marker objects for BigInt values
      if (value && typeof value === 'object' && value.__bigint_value__) {
        // Return as string - we'll replace it with the exact number later
        return value.__bigint_value__;
      }
      // Handle BigInt values - these need special handling to preserve precision
      if (typeof value === 'bigint') {
        // Convert to string to preserve exact value, then we'll manually fix the JSON
        return value.toString();
      }
      // Ensure all numeric fields are numbers, not strings
      // Go's json.Unmarshal expects int64 fields to be numbers in JSON
      if (typeof value === 'string') {
        // Try to convert string numbers to actual numbers
        const trimmed = value.trim();
        if (trimmed !== '' && !isNaN(trimmed)) {
          const num = Number(trimmed);
          // Only convert if it's a valid number and not NaN/Infinity
          if (!isNaN(num) && isFinite(num)) {
            return num;
          }
        }
      }
      if (typeof value === 'number') {
        return value;
      }
      return value;
    }, 2);
    
    // CRITICAL FIX: Replace BigInt string values with their exact numeric representation
    // This preserves precision for values that exceed JavaScript's safe integer range
    // Pattern: find "credentialHash": "778858537201909076" and replace with "credentialHash": 778858537201909076
    // Also handle credentialHashPublic
    const fixedJsonString = jsonString.replace(
      /"credentialHash":\s*"(\d+)"/g,
      (match, digits) => `"credentialHash": ${digits}`
    ).replace(
      /"credentialHashPublic":\s*"(\d+)"/g,
      (match, digits) => `"credentialHashPublic": ${digits}`
    );
    writeFileSync(inputPath, fixedJsonString);

    // Path to the prove binary (or Go command)
    const projectRoot = join(__dirname, '../../..');
    const provePath = join(projectRoot, 'prove');
    const proveGoPath = join(projectRoot, 'cmd/prove/main.go');

    // #region agent log
    try {
      const proveExists = existsSync(provePath);
      const proveGoExists = existsSync(proveGoPath);
      const buildDir = join(projectRoot, 'build');
      const provingKeyPath = join(buildDir, 'proving_key.pk');
      const ccsPath = join(buildDir, 'circuit.ccs');
      const provingKeyExists = existsSync(provingKeyPath);
      const ccsExists = existsSync(ccsPath);
      
      appendFileSync(logPath, JSON.stringify({
        location: 'proof-generator.js:75',
        message: 'Before exec prove',
        data: {
          projectRoot,
          provePath,
          proveExists,
          proveGoPath,
          proveGoExists,
          buildDir,
          provingKeyPath,
          provingKeyExists,
          ccsPath,
          ccsExists,
          inputPath,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'C'
      }) + '\n');
      
      if (!provingKeyExists) {
        throw new Error(`Proving key not found at ${provingKeyPath}. Please run 'go run cmd/generate-verifier/main.go' to generate it`);
      }
      if (!ccsExists) {
        throw new Error(`Constraint system not found at ${ccsPath}. Please run 'go run cmd/generate-verifier/main.go' to generate it`);
      }
      if (!proveGoExists) {
        throw new Error(`Prove Go source not found at ${proveGoPath}`);
      }
    } catch (logError) {
      if (logError.message && (logError.message.includes('Proving key not found') || 
          logError.message.includes('Constraint system not found') ||
          logError.message.includes('Prove Go source not found'))) {
        throw logError;
      }
    }
    // #endregion

    // Use 'go run' instead of pre-built binary to avoid architecture mismatch issues
    // This works on any platform where Go is installed
    // Try the binary first, but fall back to 'go run' if it doesn't exist or fails
    // Note: We'll try the binary first, but if it fails with exec format error, we'll catch it and use go run
    let command = `${provePath} ${inputPath}`;
    let useGoRun = false;
    
    // Check if we should use go run instead
    if (!proveExists) {
      command = `go run ${proveGoPath} ${inputPath}`;
      useGoRun = true;
    }
    
    // #region agent log
    try {
      appendFileSync(logPath, JSON.stringify({
        location: 'proof-generator.js:140',
        message: 'Executing prove command',
        data: {
          command,
          usingGoRun: !proveExists,
          cwd: projectRoot,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'D'
      }) + '\n');
    } catch (logError) {}
    // #endregion

    // Run proof generation
    let stdout, stderr;
    try {
      const result = await execAsync(command, {
        cwd: projectRoot,
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError) {
      // If binary execution fails with "Exec format error", try using go run instead
      if (execError.message && execError.message.includes('Exec format error') && !useGoRun) {
        // #region agent log
        try {
          appendFileSync(logPath, JSON.stringify({
            location: 'proof-generator.js:165',
            message: 'Binary exec format error, falling back to go run',
            data: {
              originalCommand: command,
              error: execError.message,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'E'
          }) + '\n');
        } catch (logError) {}
        // #endregion
        
        // Fall back to go run
        const goRunCommand = `go run ${proveGoPath} ${inputPath}`;
        const result = await execAsync(goRunCommand, {
          cwd: projectRoot,
        });
        stdout = result.stdout;
        stderr = result.stderr;
      } else {
        throw execError;
      }
    }

    // #region agent log
    try {
      appendFileSync(logPath, JSON.stringify({
        location: 'proof-generator.js:95',
        message: 'After exec prove',
        data: {
          stdoutLength: stdout?.length,
          stderrLength: stderr?.length,
          stderr: stderr,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'D'
      }) + '\n');
    } catch (logError) {}
    // #endregion

    if (stderr) {
      console.error('Proof generation stderr:', stderr);
    }

    // Read generated proof
    const proofPath = join(projectRoot, 'build/proof.json');
    
    // #region agent log
    try {
      const proofExists = existsSync(proofPath);
      appendFileSync(logPath, JSON.stringify({
        location: 'proof-generator.js:110',
        message: 'Before reading proof.json',
        data: {
          proofPath,
          proofExists,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'E'
      }) + '\n');
      if (!proofExists) {
        throw new Error(`Proof file not found at ${proofPath}. Proof generation may have failed.`);
      }
    } catch (logError) {
      if (logError.message && logError.message.includes('Proof file not found')) {
        throw logError;
      }
    }
    // #endregion
    
    const proofData = JSON.parse(readFileSync(proofPath, 'utf8'));

    // Parse proof and publicInputs (they are stored as JSON strings/RawMessage)
    const proof = typeof proofData.proof === 'string' 
      ? JSON.parse(proofData.proof) 
      : proofData.proof;
    const publicInputs = typeof proofData.publicInputs === 'string'
      ? JSON.parse(proofData.publicInputs)
      : proofData.publicInputs;

    // Clean up temp file
    try {
      unlinkSync(inputPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      proof,
      publicInputs,
    };
  } catch (error) {
    // #region agent log
    const logPath = '/Users/machine/Documents/Pyp/.cursor/debug.log';
    try {
      const logEntry = JSON.stringify({
        location: 'proof-generator.js:104',
        message: 'Error generating proof',
        data: {
          errorMessage: error.message,
          errorStack: error.stack,
          stdout: error.stdout,
          stderr: error.stderr,
          code: error.code,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'A'
      }) + '\n';
      appendFileSync(logPath, logEntry);
    } catch (logError) {
      // Ignore logging errors
    }
    // #endregion
    console.error('Error generating proof:', error);
    throw new Error(`Proof generation failed: ${error.message}`);
  }
}

/**
 * Format proof for on-chain submission
 * @param {Object} proofData - Raw proof data from Go tool
 * @param {Object} originalInput - Original proof input (to reconstruct public signals)
 * @param {string} originalCredentialHash - Original credential hash (hex string) for publicSignals[12]
 * @returns {Object} - Formatted proof for ProtocolAccessControl
 */
export function formatProofForOnChain(proofData, originalInput = null, originalCredentialHash = null) {
  // Extract proof components
  const { proof, publicInputs } = proofData;

  if (!proof) {
    throw new Error('Proof data is missing');
  }

  // gnark proof structure: { Ar, Bs, Krs } where each is a G1 or G2 point
  // We need to extract the coordinates
  let a, b, c;

  // Handle different proof formats
  if (proof.Ar && proof.Bs && proof.Krs) {
    // gnark Groth16 format: Ar, Bs (G2), Krs
    // Ar is G1 point { X, Y }
    // Bs is G2 point { X: { A0, A1 }, Y: { A0, A1 } }
    // Krs is G1 point { X, Y }
    a = [
      proof.Ar.X || proof.Ar[0] || '0',
      proof.Ar.Y || proof.Ar[1] || '0'
    ];
    // Bs is G2 point { X: { A0, A1 }, Y: { A0, A1 } }
    // Contract expects: [b_x0, b_x1, b_y0, b_y1] = [Bs.X.A0, Bs.X.A1, Bs.Y.A0, Bs.Y.A1]
    // The contract's verifyProofGnark copies directly from calldata, so format should match gnark's serialization
    b = [
      [
        proof.Bs.X?.A0 || proof.Bs.X?.[0] || proof.Bs[0]?.[0] || '0',
        proof.Bs.X?.A1 || proof.Bs.X?.[1] || proof.Bs[0]?.[1] || '0'
      ],
      [
        proof.Bs.Y?.A0 || proof.Bs.Y?.[0] || proof.Bs[1]?.[0] || '0',
        proof.Bs.Y?.A1 || proof.Bs.Y?.[1] || proof.Bs[1]?.[1] || '0'
      ]
    ];
    c = [
      proof.Krs.X || proof.Krs[0] || '0',
      proof.Krs.Y || proof.Krs[1] || '0'
    ];
  } else if (proof.a && proof.b && proof.c) {
    // Direct format
    a = [proof.a[0], proof.a[1]];
    b = [
      [proof.b[0][0], proof.b[0][1]],
      [proof.b[1][0], proof.b[1][1]],
    ];
    c = [proof.c[0], proof.c[1]];
  } else {
    console.error('Unknown proof format:', JSON.stringify(proof, null, 2));
    throw new Error('Unknown proof format');
  }

  // Extract public signals
  // publicInputs might be an array or an object with a signals property
  let signals = [];
  if (Array.isArray(publicInputs)) {
    signals = publicInputs.map(s => s.toString());
  } else if (publicInputs?.signals) {
    signals = publicInputs.signals.map(s => s.toString());
  } else if (publicInputs && typeof publicInputs === 'object' && Object.keys(publicInputs).length > 0) {
    // Try to extract numeric values from object
    signals = Object.values(publicInputs)
      .filter(v => typeof v === 'string' || typeof v === 'number')
      .map(v => v.toString());
  }

  // Reconstruct signals if empty or incomplete
  if (signals.length === 0 && originalInput) {
    // Public signals order: [0]=minAge, [1-10]=allowedJurisdictions, [11]=requireAccredited, [12]=credentialHashPublic
    signals = [
      originalInput.minAge.toString(),
      ...originalInput.allowedJurisdictions.slice(0, 10).map(j => j.toString()),
      originalInput.requireAccredited.toString(),
      '0' // Placeholder, will be replaced below
    ];
  } else if (signals.length < 13) {
    // Pad signals if incomplete
    while (signals.length < 12) {
      signals.push('0');
    }
    if (signals.length === 12) {
      signals.push('0'); // Placeholder for credentialHash
    }
  }

  // CRITICAL: Use the TRUNCATED hash (last 60 bits) for publicSignals[12]
  // The Go circuit uses int64 for the hash, so the proof is generated with a truncated hash.
  // The contract will extract the truncated portion from the full credentialHash and compare.
  // IMPORTANT: Always re-extract from originalCredentialHash to preserve precision
  // (originalInput.credentialHash may be a Number which loses precision for values > MAX_SAFE_INTEGER)
  if (originalCredentialHash && typeof originalCredentialHash === 'string' && originalCredentialHash.startsWith('0x')) {
    // ALWAYS extract from the original full hash to ensure exact match with contract
    // This matches the contract extraction: fullHash & 0xFFFFFFFFFFFFFFF
    const fullHash = BigInt(originalCredentialHash);
    const mask = BigInt('0xFFFFFFFFFFFFFFF'); // 60 bits mask
    const truncatedHash = fullHash & mask;
    // Keep as string to preserve precision (value may exceed Number.MAX_SAFE_INTEGER)
    signals[12] = truncatedHash.toString();
    console.log('✅ Set publicSignals[12] to exact truncated hash from originalCredentialHash:', {
      originalHash: originalCredentialHash,
      truncatedHash: truncatedHash.toString(),
      publicSignalsLength: signals.length,
    });
  } else if (originalInput?.credentialHash !== undefined) {
    // Fallback: if we only have the truncated number, use it (but warn about potential precision loss)
    const truncatedHashValue = typeof originalInput.credentialHash === 'number' 
      ? originalInput.credentialHash.toString()
      : String(originalInput.credentialHash);
    signals[12] = truncatedHashValue;
    console.warn('⚠️  Using truncated hash from originalInput (may have precision loss):', truncatedHashValue);
  } else {
    console.warn('⚠️  No credentialHash available - publicSignals[12] may be incorrect!');
  }

  // Ensure exactly 13 elements (minAge + 10 jurisdictions + requireAccredited + credentialHash)
  // Convert all to strings to preserve precision for large numbers
  const publicSignals = signals.slice(0, 13).map(s => {
    // If it's already a string, use it; otherwise convert to string
    if (typeof s === 'string') return s;
    // For numbers, convert to string (but be aware of precision loss for very large numbers)
    if (typeof s === 'bigint') return s.toString();
    return String(s);
  });
  
  // Final check: ALWAYS re-extract from originalCredentialHash to ensure exact match
  if (originalCredentialHash && typeof originalCredentialHash === 'string' && originalCredentialHash.startsWith('0x')) {
    const fullHash = BigInt(originalCredentialHash);
    const mask = BigInt('0xFFFFFFFFFFFFFFF');
    const truncatedHash = fullHash & mask;
    publicSignals[12] = truncatedHash.toString();
    console.log('✅ Final check: Set publicSignals[12] to exact truncated hash:', truncatedHash.toString());
  }

  return {
    a,
    b,
    c,
    publicSignals,
  };
}

/**
 * Create proof input from credential data
 * @param {Object} credential - Credential data
 * @param {Object} requirements - Protocol requirements
 * @returns {Object} - Proof input
 */
export function createProofInput(credential, requirements) {
  // Convert hex string credentialHash to int64-compatible number
  // CRITICAL: Contract extracts first 8 bytes (64 bits) by right-shifting 192 bits: fullHash >> 192
  // However, Go's int64 is signed and can only hold values up to 2^63 - 1
  // We'll extract 15 hex chars (60 bits) which fits safely in int64, and the contract comparison
  // will still work because we're comparing the same truncated portion (first 15 hex chars)
  // Note: The contract extracts 64 bits, but we'll compare only the first 60 bits (15 hex chars)
  // This is acceptable because the first 15 hex chars are the most significant bits
  let credentialHashNum = 0;
  if (credential.credentialHash) {
    // Remove 0x prefix and convert to BigInt
    const hashHex = credential.credentialHash.startsWith('0x') 
      ? credential.credentialHash.slice(2) 
      : credential.credentialHash;
    // Use the same mask method as the contract: fullHash & 0xFFFFFFFFFFFFFFF
    // This extracts the last 60 bits (15 hex chars) to fit in int64 safely
    // The contract uses: uint256 truncatedHash = fullHash & 0xFFFFFFFFFFFFFFF;
    const fullHash = BigInt('0x' + hashHex.padStart(64, '0'));
    const mask = BigInt('0xFFFFFFFFFFFFFFF'); // 60 bits mask
    const truncatedHash = fullHash & mask;
    // CRITICAL: Store as a special marker object that the JSON replacer will recognize
    // This allows us to preserve the exact value while avoiding JSON.stringify's BigInt error
    // The replacer will convert this to a string, then we'll replace it with the exact number
    credentialHashNum = { __bigint_value__: truncatedHash.toString() };
  }

  // Pad allowedJurisdictions array to 10 elements (as expected by Go program)
  const allowedJurisdictions = [...requirements.allowedJurisdictions];
  while (allowedJurisdictions.length < 10) {
    allowedJurisdictions.push(0);
  }

  // Ensure all numeric fields are proper integers (not strings)
  const minAge = typeof requirements.minAge === 'string' 
    ? parseInt(requirements.minAge, 10) 
    : Number(requirements.minAge);
  
  // Ensure allowedJurisdictions are numbers (truncate if too large for int64)
  const allowedJurisdictionsNums = allowedJurisdictions.slice(0, 10).map(j => {
    if (typeof j === 'string') {
      // Try to parse as number, or if it's a hex string, convert to BigInt then truncate
      if (j.startsWith('0x')) {
        // Hex string - extract last 15 hex chars (60 bits) to fit in int64
        const hashHex = j.slice(2);
        const paddedHash = hashHex.padStart(64, '0');
        const truncatedHash = paddedHash.slice(-15); // Last 15 hex chars
        return parseInt(truncatedHash, 16);
      }
      // Numeric string - truncate if too large
      try {
        const bigInt = BigInt(j);
        // Extract last 60 bits (15 hex chars) to fit in int64
        const truncatedBigInt = bigInt & BigInt('0xFFFFFFFFFFFFFFF'); // Mask for 60 bits
        return Number(truncatedBigInt);
      } catch (err) {
        throw new Error(`Invalid jurisdiction value: ${j}`);
      }
    }
    // It's already a number - check if it fits in int64
    const num = Number(j);
    if (num > Number.MAX_SAFE_INTEGER) {
      // Too large, truncate by taking modulo 2^60
      return Number(BigInt(j) & BigInt('0xFFFFFFFFFFFFFFF'));
    }
    return num;
  });
  
  // Pad to exactly 10 elements
  while (allowedJurisdictionsNums.length < 10) {
    allowedJurisdictionsNums.push(0);
  }
  
  // Convert to array of exactly 10 elements (Go expects [10]int64)
  const allowedJurisdictionsArray = new Array(10);
  for (let i = 0; i < 10; i++) {
    allowedJurisdictionsArray[i] = allowedJurisdictionsNums[i] || 0;
  }

  // Convert jurisdiction to int64-compatible number (truncate if too large)
  let actualJurisdictionNum = 0;
  if (credential.jurisdiction !== null && credential.jurisdiction !== undefined) {
    let jurisdictionValue = credential.jurisdiction;
    
    // If it's a string, try to parse it
    if (typeof jurisdictionValue === 'string') {
      if (jurisdictionValue.startsWith('0x')) {
        // Hex string - extract last 15 hex chars (60 bits) to fit in int64
        const hashHex = jurisdictionValue.slice(2);
        const paddedHash = hashHex.padStart(64, '0');
        const truncatedHash = paddedHash.slice(-15); // Last 15 hex chars
        actualJurisdictionNum = parseInt(truncatedHash, 16);
      } else {
        // Try to parse as number string
        const bigInt = BigInt(jurisdictionValue);
        // Extract last 60 bits (15 hex chars) to fit in int64
        const truncatedBigInt = bigInt & BigInt('0xFFFFFFFFFFFFFFF'); // Mask for 60 bits
        actualJurisdictionNum = Number(truncatedBigInt);
      }
    } else {
      // It's already a number - check if it fits in int64
      const num = Number(jurisdictionValue);
      if (num > Number.MAX_SAFE_INTEGER) {
        // Too large, truncate by taking modulo 2^60
        actualJurisdictionNum = Number(BigInt(jurisdictionValue) & BigInt('0xFFFFFFFFFFFFFFF'));
      } else {
        actualJurisdictionNum = num;
      }
    }
  }

  return {
    actualAge: Number(credential.age),
    actualJurisdiction: actualJurisdictionNum,
    actualAccredited: credential.accredited ? 1 : 0,
    credentialHash: credentialHashNum,
    minAge: minAge,
    allowedJurisdictions: allowedJurisdictionsArray,
    requireAccredited: requirements.requireAccredited ? 1 : 0,
    credentialHashPublic: credentialHashNum,
  };
}

