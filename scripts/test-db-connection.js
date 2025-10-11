#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests PostgreSQL connection and provides diagnostic information
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper function for colored console output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to mask sensitive data
function maskConnectionString(url) {
  if (!url) return 'Not configured';

  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, do basic masking
    return url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
  }
}

// Main test function
async function testDatabaseConnection() {
  log('\n=================================', 'cyan');
  log('  DATABASE CONNECTION TEST', 'bright');
  log('=================================\n', 'cyan');

  // Check environment variables
  log('1. Checking environment configuration...', 'yellow');

  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_DATABASE_URL;
  const provider = process.env.DATABASE_PROVIDER || 'postgresql';

  if (!databaseUrl) {
    log('❌ DATABASE_URL is not set!', 'red');
    log('   Please configure DATABASE_URL in your .env.local file', 'red');
    process.exit(1);
  }

  log(`✅ DATABASE_URL configured: ${maskConnectionString(databaseUrl)}`, 'green');

  if (directUrl) {
    log(`✅ DIRECT_DATABASE_URL configured: ${maskConnectionString(directUrl)}`, 'green');
  }

  log(`   Provider: ${provider}`, 'cyan');

  // Parse connection details
  log('\n2. Parsing connection details...', 'yellow');

  try {
    const url = new URL(databaseUrl);
    const connectionInfo = {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      ssl: url.searchParams.get('sslmode') || 'none',
      pooling: url.hostname.includes('pooler') || url.searchParams.has('pgbouncer'),
    };

    log(`   Host: ${connectionInfo.host}`, 'cyan');
    log(`   Port: ${connectionInfo.port}`, 'cyan');
    log(`   Database: ${connectionInfo.database}`, 'cyan');
    log(`   SSL Mode: ${connectionInfo.ssl}`, 'cyan');
    log(`   Connection Pooling: ${connectionInfo.pooling ? 'Enabled' : 'Disabled'}`, 'cyan');

    // Detect provider
    let detectedProvider = 'Unknown';
    if (connectionInfo.host.includes('neon.tech')) {
      detectedProvider = 'Neon';
    } else if (connectionInfo.host.includes('supabase')) {
      detectedProvider = 'Supabase';
    } else if (connectionInfo.host.includes('railway')) {
      detectedProvider = 'Railway';
    } else if (connectionInfo.host.includes('amazonaws')) {
      detectedProvider = 'AWS RDS';
    } else if (connectionInfo.host.includes('digitalocean')) {
      detectedProvider = 'DigitalOcean';
    } else if (connectionInfo.host === 'localhost' || connectionInfo.host === '127.0.0.1') {
      detectedProvider = 'Local PostgreSQL';
    }

    log(`   Detected Provider: ${detectedProvider}`, 'cyan');
  } catch (error) {
    log(`❌ Failed to parse DATABASE_URL: ${error.message}`, 'red');
  }

  // Test connection with Prisma
  log('\n3. Testing database connection with Prisma...', 'yellow');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // Test basic connection
    await prisma.$connect();
    log('✅ Successfully connected to database!', 'green');

    // Get database version
    log('\n4. Gathering database information...', 'yellow');

    const versionResult = await prisma.$queryRaw`SELECT version()`;
    const version = versionResult[0]?.version || 'Unknown';
    log(`   PostgreSQL Version: ${version.split(' ')[1]}`, 'cyan');

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    log(`   Tables found: ${tables.length}`, 'cyan');

    if (tables.length > 0) {
      log('   Existing tables:', 'cyan');
      tables.forEach(table => {
        log(`     - ${table.tablename}`, 'blue');
      });
    } else {
      log('   ⚠️  No tables found. Run migrations to create schema.', 'yellow');
    }

    // Test query performance
    log('\n5. Testing query performance...', 'yellow');

    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - startTime;

    log(`   Simple query time: ${queryTime}ms`, 'cyan');

    if (queryTime < 50) {
      log('   ✅ Excellent performance', 'green');
    } else if (queryTime < 200) {
      log('   ✅ Good performance', 'green');
    } else if (queryTime < 500) {
      log('   ⚠️  Moderate performance', 'yellow');
    } else {
      log('   ❌ Poor performance - check network latency', 'red');
    }

    // Check database size (if we have permissions)
    try {
      const sizeResult = await prisma.$queryRaw`
        SELECT pg_database_size(current_database()) as size;
      `;
      const sizeInMB = (sizeResult[0].size / 1024 / 1024).toFixed(2);
      log(`   Database size: ${sizeInMB} MB`, 'cyan');
    } catch {
      // Ignore if we don't have permissions
    }

    // Connection pool stats
    log('\n6. Connection pool information...', 'yellow');

    const poolResult = await prisma.$queryRaw`
      SELECT count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;

    log(`   Active connections: ${poolResult[0].connection_count}`, 'cyan');

    // Success summary
    log('\n=================================', 'green');
    log('  ✅ ALL TESTS PASSED!', 'bright');
    log('=================================', 'green');

    log('\nNext steps:', 'yellow');
    log('1. Run migrations: npm run db:migrate', 'cyan');
    log('2. Seed database: npm run db:seed', 'cyan');
    log('3. Start development: npm run dev', 'cyan');

  } catch (error) {
    log(`\n❌ Connection failed: ${error.message}`, 'red');

    // Provide troubleshooting tips based on error
    log('\nTroubleshooting tips:', 'yellow');

    if (error.message.includes('P1001')) {
      log('- Check if the database server is running', 'cyan');
      log('- Verify the host and port are correct', 'cyan');
      log('- Check network connectivity and firewall rules', 'cyan');
    } else if (error.message.includes('P1002')) {
      log('- The database server was reached but timed out', 'cyan');
      log('- Try increasing the connection timeout', 'cyan');
    } else if (error.message.includes('P1003')) {
      log('- The database does not exist', 'cyan');
      log('- Create the database or check the database name', 'cyan');
    } else if (error.message.includes('authentication') || error.message.includes('password')) {
      log('- Check username and password are correct', 'cyan');
      log('- Verify user has proper permissions', 'cyan');
    } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
      log('- SSL/TLS connection issue detected', 'cyan');
      log('- Add ?sslmode=require to your connection string', 'cyan');
      log('- For local development, use ?sslmode=disable', 'cyan');
    }

    log('\nFull error details:', 'red');
    console.error(error);

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection().catch(error => {
  log('Unexpected error:', 'red');
  console.error(error);
  process.exit(1);
});