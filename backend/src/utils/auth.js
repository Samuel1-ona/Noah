import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token for user
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Middleware to verify JWT token
 */
export function authenticateToken(req, res, next) {
  // Skip authentication in development mode for testing
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      address: req.body?.credential?.userAddress || req.body?.userAddress || '0x0000000000000000000000000000000000000000',
      role: 'user',
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware to verify issuer role
 */
export function requireIssuer(req, res, next) {
  if (!req.user || req.user.role !== 'issuer') {
    return res.status(403).json({ error: 'Issuer access required' });
  }
  next();
}

/**
 * Middleware to verify protocol role
 */
export function requireProtocol(req, res, next) {
  if (!req.user || req.user.role !== 'protocol') {
    return res.status(403).json({ error: 'Protocol access required' });
  }
  next();
}

