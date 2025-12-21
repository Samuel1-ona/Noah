import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

// Environment schema validation
const envSchema = Joi.object({
  // Network
  RPC_URL: Joi.string().uri().default('https://rpc.sepolia.mantle.xyz'),
  CHAIN_ID: Joi.number().default(5003),
  NETWORK: Joi.string().default('mantle-sepolia'),

  // Contract addresses (optional, will use deployments.json if not set)
  CREDENTIAL_REGISTRY_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
  ZK_VERIFIER_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
  PROTOCOL_ACCESS_CONTROL_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),

  // Service ports
  GATEWAY_PORT: Joi.number().default(3000),
  ISSUER_PORT: Joi.number().default(3001),
  USER_SERVICE_PORT: Joi.number().default(3002),
  PROTOCOL_SERVICE_PORT: Joi.number().default(3003),
  PROOF_SERVICE_PORT: Joi.number().default(3004),

  // Authentication
  JWT_SECRET: Joi.string().min(32).default('change-this-secret-in-production-min-32-chars'),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // Issuer
  ISSUER_PRIVATE_KEY: Joi.string().optional(),

  // Database
  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().optional(),
  DB_NAME: Joi.string().optional(),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),

  // Redis
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  network: {
    rpcUrl: envVars.RPC_URL,
    chainId: envVars.CHAIN_ID,
    network: envVars.NETWORK,
  },
  contracts: {
    credentialRegistry: envVars.CREDENTIAL_REGISTRY_ADDRESS,
    zkVerifier: envVars.ZK_VERIFIER_ADDRESS,
    protocolAccessControl: envVars.PROTOCOL_ACCESS_CONTROL_ADDRESS,
  },
  ports: {
    gateway: envVars.GATEWAY_PORT,
    issuer: envVars.ISSUER_PORT,
    user: envVars.USER_SERVICE_PORT,
    protocol: envVars.PROTOCOL_SERVICE_PORT,
    proof: envVars.PROOF_SERVICE_PORT,
  },
  auth: {
    jwtSecret: envVars.JWT_SECRET,
    jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  },
  issuer: {
    privateKey: envVars.ISSUER_PRIVATE_KEY,
  },
  database: {
    url: envVars.DATABASE_URL,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
  },
  redis: {
    url: envVars.REDIS_URL,
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
  },
  logging: {
    level: envVars.LOG_LEVEL,
    env: envVars.NODE_ENV,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
};

