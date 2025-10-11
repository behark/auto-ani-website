/**
 * Prisma OpenSSL Compatibility Fix for Render
 * This file helps resolve OpenSSL 1.x vs 3.x compatibility issues
 */

// Force Prisma to use OpenSSL 3.x compatible engine on Render
if (process.env.NODE_ENV === 'production' && process.env.RENDER) {
  // Set environment variables to force OpenSSL 3.x compatibility
  process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';

  // Try to use the OpenSSL 3.x engine if available
  const fs = require('fs');
  const path = require('path');

  const openssl3Engine = path.join(
    process.cwd(),
    'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node'
  );

  const openssl1Engine = path.join(
    process.cwd(),
    'node_modules/.prisma/client/libquery_engine-rhel-openssl-1.0.x.so.node'
  );

  // If OpenSSL 3.x engine exists, use it
  if (fs.existsSync(openssl3Engine)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = openssl3Engine;
    console.log('✅ Using OpenSSL 3.x Prisma engine');
  } else if (fs.existsSync(openssl1Engine)) {
    console.log('⚠️ Falling back to OpenSSL 1.x engine (may cause issues)');
  } else {
    console.log('⚠️ No Prisma engines found, using default');
  }
}

export {};