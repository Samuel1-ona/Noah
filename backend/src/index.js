import { config } from './config/env.js';
import { logger } from './utils/logger.js';

// Initialize database (use PostgreSQL if configured, otherwise SQLite)
let initDatabase;
try {
  if (config.database.url || config.database.host) {
    // Use PostgreSQL
    const dbModule = await import('./config/database-pg.js');
    initDatabase = dbModule.initDatabase;
    logger.info('Using PostgreSQL database');
  } else {
    // Use SQLite
    const dbModule = await import('./config/database.js');
    initDatabase = dbModule.initDatabase;
    logger.info('Using SQLite database');
  }
} catch (error) {
  logger.error('Database initialization error', { error: error.message });
}

// Import servers (they start themselves)
import './issuer/server.js';
import './user/server.js';
import './protocol/server.js';
import './proof/server.js';
import './gateway/server.js';

// Initialize database
if (initDatabase) {
  initDatabase().catch((error) => {
    logger.error('Database initialization failed', { error: error.message });
  });
}

// Start event listeners
try {
  const { startEventListeners } = await import('./utils/event-listener.js');
  startEventListeners();
} catch (error) {
  logger.warn('Event listeners not started', { error: error.message });
}

logger.info('All backend services starting', {
  environment: config.logging.env,
  gateway: config.ports.gateway,
});

console.log('🎉 All backend services started!');
console.log('📋 Services:');
console.log(`  - API Gateway: http://localhost:${config.ports.gateway}`);
console.log(`  - Issuer Service: http://localhost:${config.ports.issuer}`);
console.log(`  - User Service: http://localhost:${config.ports.user}`);
console.log(`  - Protocol Service: http://localhost:${config.ports.protocol}`);
console.log(`  - Proof Service: http://localhost:${config.ports.proof}`);

