import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

// Create PostgreSQL connection pool
let pool;

export const getPool = () => {
  if (!pool) {
    const dbConfig = config.database.url
      ? { connectionString: config.database.url }
      : {
          host: config.database.host || 'localhost',
          port: config.database.port || 5432,
          database: config.database.name || 'zkkyc',
          user: config.database.user || 'postgres',
          password: config.database.password || 'postgres',
          max: 20, // Maximum number of clients in the pool
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        };

    pool = new Pool(dbConfig);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

// Initialize database tables
export const initDatabase = async () => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Credentials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credentials (
        id SERIAL PRIMARY KEY,
        credential_hash VARCHAR(66) UNIQUE NOT NULL,
        user_address VARCHAR(42) NOT NULL,
        issuer_address VARCHAR(42) NOT NULL,
        age INTEGER,
        jurisdiction VARCHAR(255),
        accredited INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_credential_hash ON credentials(credential_hash);
      CREATE INDEX IF NOT EXISTS idx_user_address ON credentials(user_address);
      CREATE INDEX IF NOT EXISTS idx_issuer_address ON credentials(issuer_address);
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) UNIQUE NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);

    // Issuers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS issuers (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Proofs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS proofs (
        id SERIAL PRIMARY KEY,
        credential_hash VARCHAR(66) NOT NULL,
        user_address VARCHAR(42) NOT NULL,
        protocol_address VARCHAR(42),
        proof_data JSONB,
        public_signals JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP,
        FOREIGN KEY (credential_hash) REFERENCES credentials(credential_hash)
      );
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        contract_address VARCHAR(42) NOT NULL,
        transaction_hash VARCHAR(66) NOT NULL,
        block_number BIGINT NOT NULL,
        event_data JSONB,
        processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_event_type ON events(event_type);
      CREATE INDEX IF NOT EXISTS idx_tx_hash ON events(transaction_hash);
      CREATE INDEX IF NOT EXISTS idx_processed ON events(processed);
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Database operations
export const credentialDB = {
  create: async (credential) => {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO credentials (
        credential_hash, user_address, issuer_address, age, 
        jurisdiction, accredited, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        credential.credentialHash,
        credential.userAddress,
        credential.issuerAddress,
        credential.age,
        credential.jurisdiction,
        credential.accredited || 0,
        credential.metadata ? JSON.stringify(credential.metadata) : null,
      ]
    );
    return result.rows[0];
  },

  findByHash: async (hash) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database-pg.js:151',message:'findByHash called (PostgreSQL)',data:{hash,hashLength:hash?.length,hashType:typeof hash},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM credentials WHERE credential_hash = $1',
      [hash]
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database-pg.js:157',message:'findByHash result (PostgreSQL)',data:{hash,found:!!result.rows[0],rowCount:result.rows.length,resultHash:result.rows[0]?.credential_hash,resultAge:result.rows[0]?.age,resultJurisdiction:result.rows[0]?.jurisdiction},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    
    return result.rows[0];
  },

  findByUser: async (userAddress) => {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM credentials WHERE user_address = $1 AND status = $2',
      [userAddress, 'active']
    );
    return result.rows;
  },

  findByIssuer: async (issuerAddress) => {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM credentials WHERE issuer_address = $1 ORDER BY created_at DESC',
      [issuerAddress]
    );
    return result.rows;
  },

  revoke: async (hash) => {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE credentials 
       SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP 
       WHERE credential_hash = $1
       RETURNING *`,
      [hash]
    );
    return result.rows[0];
  },
};

export const proofDB = {
  create: async (proof) => {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO proofs (
        credential_hash, user_address, protocol_address, 
        proof_data, public_signals, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        proof.credentialHash,
        proof.userAddress,
        proof.protocolAddress || null,
        JSON.stringify(proof.proofData),
        JSON.stringify(proof.publicSignals),
        proof.status || 'pending',
      ]
    );
    return result.rows[0];
  },

  findByCredential: async (credentialHash) => {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM proofs WHERE credential_hash = $1 ORDER BY created_at DESC',
      [credentialHash]
    );
    return result.rows;
  },
};

export const eventDB = {
  create: async (event) => {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO events (
        event_type, contract_address, transaction_hash, 
        block_number, event_data
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        event.eventType,
        event.contractAddress,
        event.transactionHash,
        event.blockNumber,
        JSON.stringify(event.eventData),
      ]
    );
    return result.rows[0];
  },

  getUnprocessed: async () => {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM events WHERE processed = FALSE ORDER BY block_number ASC'
    );
    return result.rows;
  },

  markProcessed: async (id) => {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE events SET processed = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },
};

