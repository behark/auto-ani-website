#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates and manages database backups for PostgreSQL
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const zlib = require('zlib');
const gzip = promisify(zlib.gzip);
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

// Parse database URL
function parseDbUrl(url) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: urlObj.port || '5432',
    database: urlObj.pathname.slice(1),
    username: urlObj.username,
    password: urlObj.password,
  };
}

// Create backup directory
function ensureBackupDir() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

// Generate backup filename
function generateBackupFilename(prefix = 'backup') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.sql`;
}

// Compress backup file
async function compressBackup(filePath) {
  const compressedPath = `${filePath}.gz`;
  const fileContent = fs.readFileSync(filePath);
  const compressed = await gzip(fileContent);
  fs.writeFileSync(compressedPath, compressed);
  fs.unlinkSync(filePath); // Remove uncompressed file
  return compressedPath;
}

// Get backup file size
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  return `${sizeInMB} MB`;
}

// List existing backups
function listBackups() {
  const backupDir = ensureBackupDir();
  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.sql.gz'))
    .map(f => {
      const fullPath = path.join(backupDir, f);
      const stats = fs.statSync(fullPath);
      return {
        name: f,
        size: getFileSize(fullPath),
        date: stats.mtime,
      };
    })
    .sort((a, b) => b.date - a.date);
  return files;
}

// Clean old backups
function cleanOldBackups(keepLast = 5) {
  const backups = listBackups();
  if (backups.length > keepLast) {
    const toDelete = backups.slice(keepLast);
    const backupDir = ensureBackupDir();

    toDelete.forEach(backup => {
      const filePath = path.join(backupDir, backup.name);
      fs.unlinkSync(filePath);
      log(`   Deleted old backup: ${backup.name}`, 'yellow');
    });
  }
}

// Main backup function
async function createBackup() {
  log('\n=================================', 'cyan');
  log('  DATABASE BACKUP UTILITY', 'bright');
  log('=================================\n', 'cyan');

  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    log('❌ DATABASE_URL not configured!', 'red');
    process.exit(1);
  }

  try {
    // Parse database connection
    const dbConfig = parseDbUrl(databaseUrl);
    log(`Database: ${dbConfig.database}@${dbConfig.host}`, 'cyan');

    // Check pg_dump availability
    try {
      execSync('pg_dump --version', { stdio: 'pipe' });
    } catch {
      log('❌ pg_dump not found! Please install PostgreSQL client tools.', 'red');
      log('\nInstallation instructions:', 'yellow');
      log('Ubuntu/Debian: sudo apt-get install postgresql-client', 'cyan');
      log('MacOS: brew install postgresql', 'cyan');
      log('Windows: Download from https://www.postgresql.org/download/windows/', 'cyan');
      process.exit(1);
    }

    // Create backup
    log('\n1. Creating database backup...', 'yellow');

    const backupDir = ensureBackupDir();
    const backupFile = path.join(backupDir, generateBackupFilename('auto_ani'));

    // Set environment variable for password
    process.env.PGPASSWORD = dbConfig.password;

    // Build pg_dump command
    const pgDumpArgs = [
      '-h', dbConfig.host,
      '-p', dbConfig.port,
      '-U', dbConfig.username,
      '-d', dbConfig.database,
      '-f', backupFile,
      '--verbose',
      '--no-owner',
      '--no-privileges',
      '--if-exists',
      '--clean',
      '--no-password'
    ];

    // Add SSL if required
    if (databaseUrl.includes('sslmode=require')) {
      process.env.PGSSLMODE = 'require';
    }

    log('   Running pg_dump...', 'cyan');

    const pgDump = spawn('pg_dump', pgDumpArgs);

    pgDump.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    pgDump.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    await new Promise((resolve, reject) => {
      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump exited with code ${code}`));
        }
      });
    });

    log('✅ Backup created successfully', 'green');

    // Compress backup
    log('\n2. Compressing backup...', 'yellow');
    const compressedFile = await compressBackup(backupFile);
    const fileSize = getFileSize(compressedFile);
    log(`✅ Backup compressed: ${path.basename(compressedFile)} (${fileSize})`, 'green');

    // List backups
    log('\n3. Current backups:', 'yellow');
    const backups = listBackups();
    backups.forEach((backup, index) => {
      log(`   ${index + 1}. ${backup.name} - ${backup.size} - ${backup.date.toLocaleString()}`, 'cyan');
    });

    // Clean old backups
    log('\n4. Cleaning old backups (keeping last 5)...', 'yellow');
    cleanOldBackups(5);
    log('✅ Cleanup completed', 'green');

    log('\n=================================', 'green');
    log('  ✅ BACKUP COMPLETED!', 'bright');
    log('=================================\n', 'green');

    log('Backup location:', 'yellow');
    log(compressedFile, 'cyan');

    log('\nTo restore this backup:', 'yellow');
    log('1. Decompress: gunzip backup_file.sql.gz', 'cyan');
    log('2. Restore: psql DATABASE_URL < backup_file.sql', 'cyan');

  } catch (error) {
    log('\n❌ Backup failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  } finally {
    // Clean up password from environment
    delete process.env.PGPASSWORD;
    delete process.env.PGSSLMODE;
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'list') {
  log('\n=== Existing Backups ===', 'cyan');
  const backups = listBackups();
  if (backups.length === 0) {
    log('No backups found.', 'yellow');
  } else {
    backups.forEach((backup, index) => {
      log(`${index + 1}. ${backup.name} - ${backup.size} - ${backup.date.toLocaleString()}`, 'cyan');
    });
  }
} else if (command === 'clean') {
  log('\n=== Cleaning Old Backups ===', 'cyan');
  cleanOldBackups(5);
  log('✅ Cleanup completed', 'green');
} else {
  // Default: create backup
  createBackup();
}