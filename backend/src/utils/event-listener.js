import { getProvider, getCredentialRegistry, getProtocolAccessControl } from '../config/contracts.js';
import { config } from '../config/env.js';
import { logger } from './logger.js';

// Dynamically import database (PostgreSQL or SQLite)
let eventDB;
(async () => {
  try {
    if (config.database.url || config.database.host) {
      const dbModule = await import('../config/database-pg.js');
      eventDB = dbModule.eventDB;
    } else {
      const dbModule = await import('../config/database.js');
      eventDB = dbModule.eventDB;
    }
  } catch (error) {
    logger.error('Failed to load database module', { error: error.message });
  }
})();

/**
 * Listen to CredentialRegistry events
 */
export function listenToCredentialRegistryEvents() {
  const provider = getProvider();
  const registry = getCredentialRegistry(provider);

  // Listen to CredentialIssued events
  registry.on('CredentialIssued', async (user, credentialHash, issuer, timestamp, event) => {
    logger.info('CredentialIssued event', {
      user,
      credentialHash,
      issuer,
      timestamp: timestamp.toString(),
    });

    // Store event in database
    if (eventDB) {
      await eventDB.create({
      eventType: 'CredentialIssued',
      contractAddress: registry.target,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      eventData: {
        user,
        credentialHash,
        issuer,
        timestamp: timestamp.toString(),
      },
      });
    }
  });

  // Listen to CredentialRevoked events
  registry.on('CredentialRevoked', async (credentialHash, issuer, timestamp, event) => {
    logger.info('CredentialRevoked event', {
      credentialHash,
      issuer,
      timestamp: timestamp.toString(),
    });

    if (eventDB) {
      await eventDB.create({
      eventType: 'CredentialRevoked',
      contractAddress: registry.target,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      eventData: {
        credentialHash,
        issuer,
        timestamp: timestamp.toString(),
      },
      });
    }
  });

  // Listen to IssuerAdded events
  registry.on('IssuerAdded', async (issuer, name, event) => {
    logger.info('IssuerAdded event', { issuer, name });

    if (eventDB) {
      await eventDB.create({
      eventType: 'IssuerAdded',
      contractAddress: registry.target,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      eventData: { issuer, name },
      });
    }
  });

  logger.info('Listening to CredentialRegistry events');
}

/**
 * Listen to ProtocolAccessControl events
 */
export function listenToProtocolAccessControlEvents() {
  const provider = getProvider();
  const accessControl = getProtocolAccessControl(provider);

  // Listen to RequirementsSet events
  accessControl.on('RequirementsSet', async (protocol, minAge, allowedJurisdictions, requireAccredited, event) => {
    logger.info('RequirementsSet event', {
      protocol,
      minAge: minAge.toString(),
      requireAccredited,
    });

    if (eventDB) {
      await eventDB.create({
      eventType: 'RequirementsSet',
      contractAddress: accessControl.target,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      eventData: {
        protocol,
        minAge: minAge.toString(),
        requireAccredited,
      },
      });
    }
  });

  // Listen to AccessGranted events
  accessControl.on('AccessGranted', async (user, protocol, credentialHash, timestamp, event) => {
    logger.info('AccessGranted event', {
      user,
      protocol,
      credentialHash,
      timestamp: timestamp.toString(),
    });

    if (eventDB) {
      await eventDB.create({
      eventType: 'AccessGranted',
      contractAddress: accessControl.target,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      eventData: {
        user,
        protocol,
        credentialHash,
        timestamp: timestamp.toString(),
      },
      });
    }
  });

  // Listen to AccessRevoked events
  accessControl.on('AccessRevoked', async (user, protocol, timestamp, event) => {
    logger.info('AccessRevoked event', {
      user,
      protocol,
      timestamp: timestamp.toString(),
    });

    if (eventDB) {
      await eventDB.create({
      eventType: 'AccessRevoked',
      contractAddress: accessControl.target,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      eventData: {
        user,
        protocol,
        timestamp: timestamp.toString(),
      },
      });
    }
  });

  logger.info('Listening to ProtocolAccessControl events');
}

/**
 * Start all event listeners
 */
export function startEventListeners() {
  listenToCredentialRegistryEvents();
  listenToProtocolAccessControlEvents();
  logger.info('All event listeners started');
}

