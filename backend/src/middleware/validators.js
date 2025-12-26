import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './error-handler.js';

// Validation result handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location,
    }));
    // #region agent log
    logger.error('Validation failed', {
      errors: errorMessages,
      body: req.body,
      method: req.method,
      url: req.url,
      credential: req.body.credential,
      requirements: req.body.requirements,
    });
    // #endregion
    const error = new AppError('Validation failed', 400);
    error.validationErrors = errorMessages;
    throw error;
  }
  next();
};

// Common validators
export const addressValidator = (field = 'address') => {
  return body(field)
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage(`${field} must be a valid Ethereum address`);
};

export const addressParamValidator = (field = 'address') => {
  return param(field)
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage(`${field} must be a valid Ethereum address`);
};

export const hashValidator = (field = 'hash') => {
  return param(field)
    .isString()
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage(`${field} must be a valid 32-byte hash`);
};

// Credential validators
export const registerCredentialValidator = [
  body('credentialHash')
    .isString()
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('credentialHash must be a valid 32-byte hash'),
  addressValidator('userAddress'),
  body('age')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string' && !isNaN(value)) {
        return parseInt(value, 10);
      }
      return value;
    })
    .isInt({ min: 0, max: 150 })
    .withMessage('age must be between 0 and 150'),
  body('jurisdiction')
    .optional()
    .custom((value) => {
      // Accept numbers, strings, or hex strings
      return typeof value === 'number' || typeof value === 'string';
    })
    .withMessage('jurisdiction must be a number or string'),
  body('accredited')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        if (value === 'true' || value === '1') return 1;
        if (value === 'false' || value === '0') return 0;
      }
      return value ? 1 : 0;
    })
    .isInt({ min: 0, max: 1 })
    .withMessage('accredited must be 0 or 1'),
  validate,
];

export const revokeCredentialValidator = [
  body('credentialHash')
    .isString()
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('credentialHash must be a valid 32-byte hash'),
  validate,
];

// Protocol validators
export const setRequirementsValidator = [
  addressValidator('protocolAddress'),
  body('minAge')
    .customSanitizer((value) => {
      // Convert string numbers to integers
      if (typeof value === 'string' && !isNaN(value)) {
        return parseInt(value, 10);
      }
      return value;
    })
    .isInt({ min: 0, max: 150 })
    .withMessage('minAge must be between 0 and 150'),
  body('allowedJurisdictions')
    .isArray()
    .withMessage('allowedJurisdictions must be an array'),
  body('allowedJurisdictions.*')
    .custom((value, { path }) => {
      // Debug logging
      const valueStr = String(value);
      const valuePreview = valueStr.length > 30 ? valueStr.substring(0, 30) + '...' : valueStr;
      console.log(`🔍 Validating jurisdiction at ${path}:`, {
        value: valuePreview,
        type: typeof value,
        isNumber: typeof value === 'number',
        isString: typeof value === 'string',
        stringLength: typeof value === 'string' ? value.length : undefined,
        stringValue: typeof value === 'string' ? value : 'N/A',
      });
      
      // Accept numbers, string numbers, and hex strings
      // Don't sanitize - keep as-is to preserve large hash values
      
      // Check if it's a number
      if (typeof value === 'number') {
        // Accept all finite numbers (integers and floats, backend will handle)
        const isValid = Number.isFinite(value);
        console.log(`  → Number check: ${isValid ? '✓' : '✗'}`);
        return isValid;
      }
      
      // Check if it's a string
      if (typeof value === 'string') {
        // Accept numeric strings (including very large ones)
        const isNumeric = /^\d+$/.test(value);
        if (isNumeric) {
          console.log(`  → ✓ Accepted numeric string (length: ${value.length})`);
          return true;
        }
        // Accept hex strings
        const isHex = /^0x[a-fA-F0-9]+$/.test(value);
        if (isHex) {
          console.log(`  → ✓ Accepted hex string`);
          return true;
        }
        console.log(`  → ✗ Rejected string (not numeric or hex): ${valuePreview}`);
        return false;
      }
      
      // Reject everything else
      console.log(`  → ✗ Rejected value (type: ${typeof value}, value: ${valuePreview})`);
      return false;
    })
    .withMessage('Each jurisdiction must be an integer, numeric string, or hex string'),
  body('requireAccredited')
    .customSanitizer((value) => {
      // Convert string booleans to actual booleans
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
      }
      return value;
    })
    .isBoolean()
    .withMessage('requireAccredited must be a boolean'),
  validate,
];

// Proof validators
export const generateProofValidator = [
  body('credential')
    .isObject()
    .withMessage('credential must be an object'),
  body('credential.age')
    .customSanitizer((value) => {
      if (typeof value === 'string' && !isNaN(value)) {
        return parseInt(value, 10);
      }
      return value;
    })
    .isInt({ min: 0, max: 150 })
    .withMessage('credential.age must be between 0 and 150'),
  body('credential.jurisdiction')
    .customSanitizer((value) => {
      // Handle both string numbers and hex strings
      if (typeof value === 'string') {
        if (value.startsWith('0x')) {
          // Hex string - convert to number (if it fits in safe integer range)
          const bigInt = BigInt(value);
          if (bigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
            return value; // Keep as string for large values, will be handled in proof-generator
          }
          return Number(bigInt);
        }
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          return num;
        }
      }
      return value;
    })
    .custom((value) => {
      // Accept both numbers and strings (for large jurisdiction hashes)
      return typeof value === 'number' || typeof value === 'string';
    })
    .withMessage('credential.jurisdiction must be an integer or valid hash string'),
  body('requirements')
    .isObject()
    .withMessage('requirements must be an object'),
  body('requirements.minAge')
    .customSanitizer((value) => {
      if (typeof value === 'string' && !isNaN(value)) {
        return parseInt(value, 10);
      }
      return value;
    })
    .isInt({ min: 0, max: 150 })
    .withMessage('requirements.minAge must be between 0 and 150'),
  body('requirements.requireAccredited')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        return value === 'true' || value === '1';
      }
      return Boolean(value);
    })
    .isBoolean()
    .withMessage('requirements.requireAccredited must be a boolean'),
  body('requirements.allowedJurisdictions')
    .isArray()
    .withMessage('requirements.allowedJurisdictions must be an array')
    .customSanitizer((value) => {
      // Convert BigInt values to strings to avoid JSON serialization issues
      if (Array.isArray(value)) {
        return value.map(item => {
          if (typeof item === 'bigint') {
            return item.toString();
          }
          if (typeof item === 'string' && item.startsWith('0x')) {
            // Convert hex string to number if it fits, otherwise keep as string
            try {
              const bigInt = BigInt(item);
              if (bigInt <= BigInt(Number.MAX_SAFE_INTEGER)) {
                return Number(bigInt);
              }
              return item;
            } catch {
              return item;
            }
          }
          return item;
        });
      }
      return value;
    })
    .custom((value) => {
      // Allow empty array or array of numbers/strings
      return Array.isArray(value) && value.every(item => 
        typeof item === 'number' || typeof item === 'string' || typeof item === 'bigint'
      );
    })
    .withMessage('requirements.allowedJurisdictions must be an array of numbers or strings'),
  body('requirements.protocolAddress')
    .optional()
    .isString()
    .withMessage('requirements.protocolAddress must be a string'),
  validate,
];

