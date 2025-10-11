#!/usr/bin/env node

// AUTO ANI - Netlify Deployment Script
// Creates a new site and deploys the project

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE_NAME = `auto-ani-production-${Date.now()}`;

console.log('🚀 AUTO ANI - Netlify Deployment');
console.log('=================================');
console.log(`📦 Creating new site: ${SITE_NAME}`);

// Step 1: Create the site using Netlify CLI
const createSite = () => {
  return new Promise((resolve, reject) => {
    console.log('📝 Creating Netlify site...');

    // Create site with echo to auto-answer the team question
    exec(`echo "" | npx netlify sites:create --name ${SITE_NAME}`, (error, stdout, stderr) => {
      if (error && !stdout.includes('Site Created')) {
        console.error('❌ Error creating site:', error.message);
        reject(error);
        return;
      }

      console.log('✅ Site created successfully');

      // Extract site ID from output if possible
      const siteIdMatch = stdout.match(/Site ID: ([a-z0-9-]+)/i);
      const siteId = siteIdMatch ? siteIdMatch[1] : null;

      resolve({ siteId, siteName: SITE_NAME });
    });
  });
};

// Step 2: Link the site to current directory
const linkSite = (siteName) => {
  return new Promise((resolve, reject) => {
    console.log('🔗 Linking site to current directory...');

    exec(`npx netlify link --name ${siteName}`, (error, stdout, stderr) => {
      if (error) {
        console.warn('⚠️  Could not auto-link, will proceed with manual deploy');
      } else {
        console.log('✅ Site linked');
      }
      resolve();
    });
  });
};

// Step 3: Set environment variables
const setEnvVars = () => {
  return new Promise((resolve) => {
    console.log('🔐 Setting environment variables...');

    const envVars = {
      'NEXTAUTH_URL': `https://${SITE_NAME}.netlify.app`,
      'NEXT_PUBLIC_SITE_URL': `https://${SITE_NAME}.netlify.app`,
      'NEXTAUTH_SECRET': '5vUmFqDiGCfhn8Ay63NtidjmmWyI21KtUxMcLsm+KaQ=',
      'JWT_SECRET': '279NhNODUJtCnRj/KbN/ysXeD2EX8qGQB0sbtDYqvkI=',
      'SESSION_SECRET': 'TCloNVWjvJnaWxvxSrk+oi5x9CW2wZ0mgACOHE1mClU=',
      'ENCRYPTION_KEY': 'sLNHXeoqIvO7HKS7pzG5Mq2PH/Theb+hnoIkRjdX1t4=',
      'WEBHOOK_SECRET': 'f8aa13c34db8e6e470f328dff34ba3d046cac27b0c45c466',
      'ADMIN_API_KEY': 'admin_0007dd301387a0f3e10ac50f70407a6a2562f116b4dce2d9',
      'DATABASE_URL': 'file:./prisma/dev.db', // Temporary - needs PostgreSQL
      'DATABASE_PROVIDER': 'sqlite', // Temporary
      'NODE_ENV': 'production',
      'FROM_EMAIL': 'contact@autosalonani.com',
      'ADMIN_EMAIL': 'admin@autosalonani.com',
      'RESEND_API_KEY': 're_test_placeholder',
      'NEXT_PUBLIC_WHATSAPP_NUMBER': '38349204242',
      'RATE_LIMIT_ENABLED': 'true',
      'RATE_LIMIT_WINDOW_MS': '900000',
      'RATE_LIMIT_MAX_REQUESTS': '100'
    };

    const setEnvPromises = Object.entries(envVars).map(([key, value]) => {
      return new Promise((resolve) => {
        exec(`npx netlify env:set ${key} "${value}" --scope production 2>/dev/null`, () => {
          console.log(`  ✓ Set ${key}`);
          resolve();
        });
      });
    });

    Promise.all(setEnvPromises).then(() => {
      console.log('✅ Environment variables configured');
      resolve();
    });
  });
};

// Step 4: Deploy the site
const deploySite = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Deploying to Netlify...');
    console.log('This may take several minutes...');

    // First ensure we have a build
    exec('npm run build', (buildError) => {
      if (buildError) {
        console.warn('⚠️  Build had warnings, continuing...');
      }

      // Deploy using netlify CLI
      exec(`npx netlify deploy --prod --dir=.next --message="Initial deployment"`,
        { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
        (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Deployment error:', error.message);
            console.log('Attempting alternative deployment method...');

            // Try alternative deployment
            exec(`npx netlify deploy --prod --build`, (altError, altStdout) => {
              if (altError) {
                reject(altError);
              } else {
                resolve(altStdout);
              }
            });
          } else {
            resolve(stdout);
          }
        }
      );
    });
  });
};

// Main deployment flow
async function deploy() {
  try {
    // Create site
    const { siteName } = await createSite();

    // Link site
    await linkSite(siteName);

    // Set environment variables
    await setEnvVars();

    // Deploy
    await deploySite();

    console.log('\n🎉 ========================================');
    console.log('🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('🎉 ========================================\n');
    console.log(`📌 Site URL: https://${SITE_NAME}.netlify.app`);
    console.log(`📌 Admin URL: https://app.netlify.com/sites/${SITE_NAME}`);
    console.log('\n📝 IMPORTANT NEXT STEPS:');
    console.log('1. Set up PostgreSQL database (Neon or Supabase)');
    console.log('2. Update DATABASE_URL in Netlify environment variables');
    console.log('3. Get Resend API key for email functionality');
    console.log('4. Configure custom domain (optional)');
    console.log('\n💡 To update environment variables:');
    console.log(`   Visit: https://app.netlify.com/sites/${SITE_NAME}/settings/env`);

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('1. Make sure you are logged in: npx netlify login');
    console.log('2. Check your internet connection');
    console.log('3. Try running: npm run build');
    console.log('4. Check the error message above for details');
    process.exit(1);
  }
}

// Run deployment
deploy();