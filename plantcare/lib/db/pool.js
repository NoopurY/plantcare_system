// lib/db/pool.js
// PostgreSQL connection pool using node-postgres
// All database queries in the application go through this pool

import { Pool } from 'pg';

let pool;

function getPool() {
  if (pool) return pool;

  pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'verdebase',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // Hosted databases (Neon, Supabase) require SSL; local Postgres does not
    ssl: ['localhost', '127.0.0.1'].includes(process.env.DB_HOST || 'localhost')
      ? false
      : { rejectUnauthorized: false },
    max:      10,                // max pool connections
    idleTimeoutMillis:  30000,   // close idle connections after 30s
    connectionTimeoutMillis: 10000, // cloud DBs can take a few seconds to wake
  });

  pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle client:', err);
  });

  return pool;
}

/**
 * Execute a SQL query with optional parameters.
 * Uses parameterized queries to prevent SQL injection.
 *
 * @param {string} text - SQL query string with $1, $2 placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('[DB] Query executed', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in a single transaction.
 * If any query fails, all are rolled back (ACID Atomicity).
 *
 * @param {Function} transactionFn - Async function receiving the client
 * @returns {Promise<any>} - Return value of transactionFn
 */
export async function withTransaction(transactionFn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await transactionFn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Check database connectivity.
 * @returns {Promise<boolean>}
 */
export async function checkConnection() {
  try {
    await query('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
}

export default getPool;
