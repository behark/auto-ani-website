#!/usr/bin/env node

/**
 * AUTO ANI Setup Validation Script
 * Run before deployment to ensure everything is configured correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let errors = 0;
let warnings = 0;

function log(message, type = 'info') {
  const prefix = {
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️ `,
    success: `${colors.green}✅`,
    info: `${colors.blue}ℹ️ `,
    title: `${colors.cyan}📋`
  };

  console.log(`${prefix[type]} ${message}${colors.reset}`);

  if (type === 'error') errors++;
  if (type === 'warning') warnings++;
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  const type = required ? (exists ? 'success' : 'error') : (exists ? 'success' : 'warning');
  const status = exists ? 'Found' : 'Missing';

  log(`${status}: ${filePath}`, type);
  return exists;
}

function checkEnvVar(envFile, varName, isProduction = false) {
  if (!fs.existsSync(envFile)) return false;

  const content = fs.readFileSync(envFile, 'utf8');
  const regex = new RegExp(`^${varName}=(.*)$`, 'm');
  const match = content.match(regex);

  if (!match) {
    log(`Missing: ${varName} in ${envFile}`, isProduction ? 'error' : 'warning');
    return false;
  }

  const value = match[1];
  const isDummy = value.includes('dummy') || value.includes('test-') || value.includes('YOUR_');

  if (isDummy && isProduction) {
    log(`Dummy value: ${varName} needs real credentials`, 'warning');
    return false;
  }

  log(`Configured: ${varName}`, 'success');
  return true;
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log(`${description}: Available`, 'success');
    return true;
  } catch {
    log(`${description}: Not available`, 'warning');
    return false;
  }
}

async function main() {
  console.log('\n' + colors.cyan + '=' .repeat(50));
  console.log('     AUTO ANI DEPLOYMENT VALIDATION');
  console.log('=' .repeat(50) + colors.reset + '\n');

  // 1. Check Core Files
  log('CHECKING CORE FILES', 'title');
  checkFile('package.json');
  checkFile('next.config.ts');
  checkFile('prisma/schema.prisma');
  checkFile('.env');
  checkFile('.env.production', false);
  checkFile('public/manifest.json');
  checkFile('public/sw.js', false);

  console.log();

  // 2. Check Dependencies
  log('CHECKING DEPENDENCIES', 'title');
  checkCommand('node --version', 'Node.js');
  checkCommand('npm --version', 'npm');
  checkCommand('npx --version', 'npx');

  console.log();

  // 3. Check Environment Variables
  log('CHECKING ENVIRONMENT VARIABLES', 'title');

  const envFile = fs.existsSync('.env.production') ? '.env.production' : '.env';
  const isProduction = envFile === '.env.production';

  // Critical variables
  checkEnvVar(envFile, 'DATABASE_URL', isProduction);
  checkEnvVar(envFile, 'NEXTAUTH_SECRET', isProduction);
  checkEnvVar(envFile, 'NEXTAUTH_URL', isProduction);

  // Service variables
  checkEnvVar(envFile, 'RESEND_API_KEY', false);
  checkEnvVar(envFile, 'TWILIO_ACCOUNT_SID', false);
  checkEnvVar(envFile, 'STRIPE_SECRET_KEY', false);

  console.log();

  // 4. Check Build
  log('CHECKING BUILD CAPABILITY', 'title');
  try {
    log('Running build test...', 'info');
    execSync('npm run build', { stdio: 'ignore' });
    log('Build successful', 'success');
  } catch (error) {
    log('Build failed - check for errors', 'error');
  }

  console.log();

  // 5. Check Database
  log('CHECKING DATABASE', 'title');
  try {
    execSync('npx prisma generate', { stdio: 'ignore' });
    log('Prisma client generated', 'success');
  } catch {
    log('Failed to generate Prisma client', 'error');
  }

  console.log();

  // 6. Check Images
  log('CHECKING IMAGE OPTIMIZATION', 'title');
  const optimizedDir = 'public/images/optimized';
  if (fs.existsSync(optimizedDir)) {
    const files = fs.readdirSync(optimizedDir);
    log(`Optimized images found: ${files.length} items`, 'success');
  } else {
    log('No optimized images found', 'warning');
  }

  console.log();

  // 7. Check API Routes
  log('CHECKING API ROUTES', 'title');
  const apiRoutes = [
    'app/api/health/route.ts',
    'app/api/vehicles/route.ts',
    'app/api/contact/route.ts',
    'app/api/status/route.ts'
  ];

  apiRoutes.forEach(route => checkFile(route, false));

  console.log();

  // Summary
  console.log(colors.cyan + '=' .repeat(50));
  console.log('     VALIDATION SUMMARY');
  console.log('=' .repeat(50) + colors.reset);

  if (errors === 0 && warnings === 0) {
    log('All checks passed! Ready for deployment', 'success');
  } else {
    if (errors > 0) {
      log(`${errors} error(s) found - fix before deployment`, 'error');
    }
    if (warnings > 0) {
      log(`${warnings} warning(s) found - review before deployment`, 'warning');
    }
  }

  console.log('\n' + colors.blue + 'Next Steps:' + colors.reset);
  console.log('1. Fix any errors shown above');
  console.log('2. Update .env.production with real API keys');
  console.log('3. Run: npm run build');
  console.log('4. Deploy to your hosting platform');
  console.log();

  process.exit(errors > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});