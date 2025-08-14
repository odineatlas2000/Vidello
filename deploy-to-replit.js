#!/usr/bin/env node

/**
 * Replit Deployment Script
 * Automatically sets up the project for Replit deployment
 */

const fs = require('fs');
const path = require('path');

const REPLIT_FILES = {
  'server-replit.js': 'server.js',
  'package-replit.json': 'package.json',
  'utils/ytdlpManager-replit.js': 'utils/ytdlpManager.js',
  'controllers/twitterController-replit.js': 'controllers/twitterController.js'
};

const REQUIRED_FILES = [
  '.replit',
  'replit.nix',
  'README-REPLIT.md'
];

function copyFile(src, dest) {
  try {
    if (fs.existsSync(src)) {
      // Create directory if it doesn't exist
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${src} → ${dest}`);
      return true;
    } else {
      console.log(`❌ Source file not found: ${src}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error copying ${src} to ${dest}:`, error.message);
    return false;
  }
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`📦 Backed up ${filePath} → ${backupPath}`);
  }
}

function createEnvFile() {
  const envContent = `# Replit Environment Variables
PORT=3000
NODE_ENV=production

# Add your API keys and secrets here
# Example:
# YOUTUBE_API_KEY=your_api_key_here
# TWITTER_BEARER_TOKEN=your_token_here
`;
  
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file with default values');
  } else {
    console.log('ℹ️  .env file already exists, skipping creation');
  }
}

function updateGitignore() {
  const gitignoreContent = `
# Replit specific
.replit
replit.nix

# Backup files
*.backup

# Environment variables
.env

# Node modules
node_modules/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`;
  
  if (!fs.existsSync('.gitignore')) {
    fs.writeFileSync('.gitignore', gitignoreContent);
    console.log('✅ Created .gitignore file');
  } else {
    fs.appendFileSync('.gitignore', gitignoreContent);
    console.log('✅ Updated .gitignore file');
  }
}

function main() {
  console.log('🚀 Setting up project for Replit deployment...\n');
  
  let success = true;
  
  // Step 1: Backup existing files
  console.log('📦 Backing up existing files...');
  Object.values(REPLIT_FILES).forEach(backupFile);
  console.log('');
  
  // Step 2: Copy Replit-specific files
  console.log('📁 Copying Replit-specific files...');
  for (const [src, dest] of Object.entries(REPLIT_FILES)) {
    if (!copyFile(src, dest)) {
      success = false;
    }
  }
  console.log('');
  
  // Step 3: Check required files
  console.log('🔍 Checking required files...');
  for (const file of REQUIRED_FILES) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      success = false;
    }
  }
  console.log('');
  
  // Step 4: Create environment file
  console.log('🔧 Setting up environment...');
  createEnvFile();
  console.log('');
  
  // Step 5: Update .gitignore
  console.log('📝 Updating .gitignore...');
  updateGitignore();
  console.log('');
  
  // Step 6: Final instructions
  if (success) {
    console.log('🎉 Replit setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Create a new Node.js Repl on https://replit.com');
    console.log('2. Upload all files to your Repl');
    console.log('3. Run "npm install" in the Shell');
    console.log('4. Click the "Run" button');
    console.log('5. Your app will be available at the provided URL');
    console.log('');
    console.log('📖 For detailed instructions, see README-REPLIT.md');
    console.log('');
    console.log('🔗 Your Repl URL will be:');
    console.log('   https://your-repl-name.your-username.repl.co');
  } else {
    console.log('❌ Setup completed with errors.');
    console.log('Please check the missing files and try again.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { copyFile, backupFile, createEnvFile, updateGitignore };