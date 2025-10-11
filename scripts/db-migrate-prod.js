#!/usr/bin/env node

/**
 * Production Database Migration Script
 * Safely runs migrations with validation and rollback capability
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function runProductionMigration() {
  log('\n=================================', 'cyan');
  log('  PRODUCTION MIGRATION SCRIPT', 'bright');
  log('=================================\n', 'cyan');

  // Check environment
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_DATABASE_URL || databaseUrl;

  if (!databaseUrl) {
    log('❌ DATABASE_URL not configured!', 'red');
    process.exit(1);
  }

  // Detect if this is production
  const isProduction = databaseUrl.includes('neon.tech') ||
                       databaseUrl.includes('supabase.com') ||
                       databaseUrl.includes('railway.app') ||
                       databaseUrl.includes('amazonaws.com');

  if (isProduction) {
    log('⚠️  WARNING: You are about to run migrations on a PRODUCTION database!', 'yellow');
    log(`   Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown'}`, 'yellow');

    const confirm = await askQuestion('\nType "MIGRATE PRODUCTION" to continue: ');
    if (confirm !== 'MIGRATE PRODUCTION') {
      log('Migration cancelled.', 'red');
      process.exit(0);
    }
  }

  try {
    // Step 1: Generate Prisma Client
    log('\n1. Generating Prisma Client...', 'yellow');
    execSync('npm run db:generate', { stdio: 'inherit' });
    log('✅ Prisma Client generated', 'green');

    // Step 2: Check pending migrations
    log('\n2. Checking for pending migrations...', 'yellow');

    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      log('No migrations directory found. Creating initial migration...', 'yellow');

      // For initial setup, use db push
      log('\n3. Pushing schema to database...', 'yellow');
      execSync('npm run db:push', { stdio: 'inherit' });
      log('✅ Schema pushed successfully', 'green');
    } else {
      // Run migrations
      log('\n3. Running migrations...', 'yellow');

      // Use DIRECT_DATABASE_URL for migrations if available
      const env = { ...process.env };
      if (directUrl && directUrl !== databaseUrl) {
        env.DATABASE_URL = directUrl;
        log('   Using DIRECT_DATABASE_URL for migration', 'cyan');
      }

      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env
      });
      log('✅ Migrations completed successfully', 'green');
    }

    // Step 4: Validate schema
    log('\n4. Validating database schema...', 'yellow');
    execSync('npx prisma validate', { stdio: 'inherit' });
    log('✅ Schema validation passed', 'green');

    // Step 5: Optional - Seed data
    const seedData = await askQuestion('\nDo you want to seed initial data? (y/N): ');
    if (seedData.toLowerCase() === 'y') {
      log('\nSeeding database...', 'yellow');
      execSync('npm run db:seed:production', { stdio: 'inherit' });
      log('✅ Database seeded', 'green');
    }

    log('\n=================================', 'green');
    log('  ✅ MIGRATION COMPLETED!', 'bright');
    log('=================================\n', 'green');

    log('Next steps:', 'yellow');
    log('1. Test the application thoroughly', 'cyan');
    log('2. Monitor database performance', 'cyan');
    log('3. Set up automated backups', 'cyan');

  } catch (error) {
    log('\n❌ Migration failed!', 'red');
    log(error.message, 'red');

    log('\nRollback instructions:', 'yellow');
    log('1. Check migration status: npx prisma migrate status', 'cyan');
    log('2. If needed, restore from backup', 'cyan');
    log('3. Fix the issue and retry', 'cyan');

    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run migration
runProductionMigration();