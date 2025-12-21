import { getProvider, getCredentialRegistry, getProtocolAccessControl } from '../config/contracts.js';
import { getPool } from '../config/database-pg.js';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const healthCheck = async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check RPC connection
  try {
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    health.services.blockchain = {
      status: 'ok',
      blockNumber,
    };
  } catch (error) {
    health.services.blockchain = {
      status: 'error',
      error: error.message,
    };
    health.status = 'degraded';
  }

  // Check database
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    health.services.database = {
      status: 'ok',
    };
  } catch (error) {
    health.services.database = {
      status: 'error',
      error: error.message,
    };
    health.status = 'degraded';
  }

  // Check Redis (optional)
  try {
    const redis = await getRedisClient();
    await redis.ping();
    health.services.redis = {
      status: 'ok',
    };
  } catch (error) {
    health.services.redis = {
      status: 'error',
      error: error.message,
    };
    // Redis is optional, don't degrade status
  }

  // Check contracts
  try {
    const provider = getProvider();
    const registry = getCredentialRegistry(provider);
    const accessControl = getProtocolAccessControl(provider);
    
    await registry.owner();
    await accessControl.zkVerifier();
    
    health.services.contracts = {
      status: 'ok',
    };
  } catch (error) {
    health.services.contracts = {
      status: 'error',
      error: error.message,
    };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
};

