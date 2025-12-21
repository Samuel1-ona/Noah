import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
import { mkdirSync } from 'fs';
const dataDir = join(__dirname, '../../../data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (e) {
  // Directory might already exist
}
const dbPath = join(dataDir, 'zkkyc.db');

// Initialize database (using sqlite3 with promises)
let db;
const getDb = () => {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Create tables
export const initDatabase = async () => {
  const db = getDb();
  
  // Credentials table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_hash TEXT UNIQUE NOT NULL,
      user_address TEXT NOT NULL,
      issuer_address TEXT NOT NULL,
      age INTEGER,
      jurisdiction TEXT,
      accredited INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME,
      metadata TEXT
    );

  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_credential_hash ON credentials(credential_hash)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_user_address ON credentials(user_address)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_issuer_address ON credentials(issuer_address)`);

  // Users table (for authentication)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // Issuers table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS issuers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Proofs table (for tracking generated proofs)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_hash TEXT NOT NULL,
      user_address TEXT NOT NULL,
      protocol_address TEXT,
      proof_data TEXT,
      public_signals TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME,
      FOREIGN KEY (credential_hash) REFERENCES credentials(credential_hash)
    );
  `);

  // Events table (for tracking on-chain events)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      contract_address TEXT NOT NULL,
      transaction_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      event_data TEXT,
      processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

  `);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_event_type ON events(event_type)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_tx_hash ON events(transaction_hash)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_processed ON events(processed)`);

  console.log('✅ Database initialized');
};

// Credential operations
export const credentialDB = {
  create: async (credential) => {
    return dbRun(`
      INSERT INTO credentials (
        credential_hash, user_address, issuer_address, age, 
        jurisdiction, accredited, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      credential.credentialHash,
      credential.userAddress,
      credential.issuerAddress,
      credential.age,
      credential.jurisdiction,
      credential.accredited || 0,
      credential.metadata ? JSON.stringify(credential.metadata) : null
    ]);
  },

  findByHash: async (hash) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.js:158',message:'findByHash called (SQLite)',data:{hash,hashLength:hash?.length,hashType:typeof hash},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    
    const result = await dbGet('SELECT * FROM credentials WHERE credential_hash = ?', [hash]);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.js:160',message:'findByHash result (SQLite)',data:{hash,found:!!result,resultHash:result?.credential_hash,resultAge:result?.age,resultJurisdiction:result?.jurisdiction,allRows:result?Object.keys(result):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    
    return result;
  },

  findByUser: async (userAddress) => {
    return dbAll('SELECT * FROM credentials WHERE user_address = ? AND status = ?', [userAddress, 'active']);
  },

  findByIssuer: async (issuerAddress) => {
    return dbAll('SELECT * FROM credentials WHERE issuer_address = ? ORDER BY created_at DESC', [issuerAddress]);
  },

  revoke: async (hash) => {
    return dbRun(`
      UPDATE credentials 
      SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP 
      WHERE credential_hash = ?
    `, [hash]);
  },
};

// Proof operations
export const proofDB = {
  create: async (proof) => {
    return dbRun(`
      INSERT INTO proofs (
        credential_hash, user_address, protocol_address, 
        proof_data, public_signals, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      proof.credentialHash,
      proof.userAddress,
      proof.protocolAddress || null,
      JSON.stringify(proof.proofData),
      JSON.stringify(proof.publicSignals),
      proof.status || 'pending'
    ]);
  },

  findByCredential: async (credentialHash) => {
    return dbAll('SELECT * FROM proofs WHERE credential_hash = ? ORDER BY created_at DESC', [credentialHash]);
  },
};

// Event operations
export const eventDB = {
  create: async (event) => {
    return dbRun(`
      INSERT INTO events (
        event_type, contract_address, transaction_hash, 
        block_number, event_data
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      event.eventType,
      event.contractAddress,
      event.transactionHash,
      event.blockNumber,
      JSON.stringify(event.eventData)
    ]);
  },

  getUnprocessed: async () => {
    return dbAll('SELECT * FROM events WHERE processed = 0 ORDER BY block_number ASC');
  },

  markProcessed: async (id) => {
    return dbRun('UPDATE events SET processed = 1 WHERE id = ?', [id]);
  },
};

