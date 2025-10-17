#!/usr/bin/env node

/**
 * CryptoWallet Vercel Deployment Script
 * 
 * This script helps automate the deployment process to Vercel
 * Run with: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CryptoWallet Vercel Deployment Script\n');

// Check if vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Install vercel CLI if not present
function installVercelCLI() {
  console.log('📦 Installing Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install Vercel CLI');
    process.exit(1);
  }
}

// Check if all dependencies are installed
function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  const dirs = ['client', 'server'];
  for (const dir of dirs) {
    const nodeModulesPath = path.join(__dirname, dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`📦 Installing dependencies for ${dir}...`);
      try {
        execSync(`cd ${dir} && npm install`, { stdio: 'inherit' });
      } catch (error) {
        console.error(`❌ Failed to install dependencies for ${dir}`);
        process.exit(1);
      }
    }
  }
  console.log('✅ All dependencies are ready\n');
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('🔐 Environment Variables Checklist:');
  console.log('Please ensure these are set in your Vercel dashboard:');
  console.log('');
  console.log('✅ Required Variables:');
  console.log('   - MONGODB_URI (MongoDB Atlas connection string)');
  console.log('   - JWT_SECRET (32+ characters)');
  console.log('   - ENCRYPTION_KEY (exactly 32 characters)');
  console.log('   - NODE_ENV=production');
  console.log('');
  console.log('📋 Optional Variables:');
  console.log('   - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD');
  console.log('   - Various blockchain API keys');
  console.log('');
  console.log('💡 Generate secure keys:');
  console.log('   JWT_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.log('   ENCRYPTION_KEY: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"');
  console.log('');
}

// Build the application
function buildApplication() {
  console.log('🏗️  Building application...');
  try {
    execSync('cd client && npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
  }
}

// Deploy to Vercel
function deployToVercel() {
  console.log('🚀 Deploying to Vercel...');
  try {
    // Run vercel command with auto-confirmation and without Git integration
    execSync('vercel --confirm --prod', { stdio: 'inherit' });
    console.log('\n✅ Deployment completed successfully!');
    console.log('\n🌐 Your app should be live at the URL shown above');
    console.log('\n📋 Post-deployment checklist:');
    console.log('   - Test the health endpoint: /health');
    console.log('   - Test the API docs: /api/docs');
    console.log('   - Try user registration and login');
    console.log('   - Create a test wallet');
    console.log('   - Monitor performance in Vercel dashboard');
  } catch (error) {
    console.error('❌ Deployment failed');
    console.log('If you see a "gitSource missing repoId" error, try running:');
    console.log('vercel --confirm --prod --cwd .');
    process.exit(1);
  }
}

// Main deployment process
async function main() {
  try {
    // Check and install Vercel CLI
    if (!checkVercelCLI()) {
      installVercelCLI();
    } else {
      console.log('✅ Vercel CLI is already installed\n');
    }

    // Check dependencies
    checkDependencies();

    // Show environment variables checklist
    checkEnvironmentVariables();

    // Ask for confirmation
    console.log('⚠️  Make sure you have:');
    console.log('   1. Set up MongoDB Atlas database');
    console.log('   2. Added all environment variables in Vercel dashboard');
    console.log('   3. Connected your GitHub repository to Vercel');
    console.log('');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Continue with deployment? (y/N): ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        buildApplication();
        deployToVercel();
      } else {
        console.log('Deployment cancelled. Run this script again when ready.');
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Deployment script failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n❌ Deployment cancelled by user');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}