/**
 * PostgreSQL Connection Pool for Render
 * Singleton pattern to prevent connection leaks
 */

const { Pool } = require('pg');

// Singleton connection pool with memory leak prevention
let pool: any = null;
let connectionCount = 0;
const MAX_CONNECTIONS = 2; // Very conservative for memory

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Optimized for Render memory constraints
      max: MAX_CONNECTIONS, // Very conservative
      min: 1,     // Minimum connections
      idle: 10000, // Close faster - 10 seconds instead of 30
      connectionTimeoutMillis: 5000,  // Reduced timeout
      idleTimeoutMillis: 10000,       // Reduced idle time
      allowExitOnIdle: true,
      // Additional memory optimization
      statement_timeout: 30000,       // 30 second query timeout
      query_timeout: 20000           // 20 second individual query timeout
    });

    // Handle pool errors
    pool.on('error', (err: any) => {
      console.error('PostgreSQL pool error:', err);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('Closing PostgreSQL pool...');
      pool.end(() => {
        console.log('PostgreSQL pool closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }

  return pool;
}

export async function queryDatabase(query: string, params: any[] = []) {
  const pool = getPool();
  let client;

  try {
    connectionCount++;
    console.log(`🔗 Active connections: ${connectionCount}/${MAX_CONNECTIONS}`);

    client = await pool.connect();

    const result = await client.query(query, params);

    // Force garbage collection hint
    if (global.gc && connectionCount > 1) {
      global.gc();
    }

    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
      connectionCount--;
    }
  }
}