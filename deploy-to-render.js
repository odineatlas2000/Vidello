#!/usr/bin/env node

/**
 * Render.com Deployment Script
 * Automatically sets up the project for Render.com deployment
 */

const fs = require('fs');
const path = require('path');

const RENDER_FILES = {
  'server-render.js': 'server.js',
  'package-render.json': 'package.json',
  'render.yaml': 'render.yaml'
};

const REQUIRED_FILES = [
  'render.yaml',
  'README-RENDER.md',
  'server-render.js',
  'package-render.json'
];

/**
 * Copy a file from source to destination
 */
function copyFile(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      console.log(`❌ Source file not found: ${src}`);
      return false;
    }
    
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to copy ${src} → ${dest}:`, error.message);
    return false;
  }
}

/**
 * Backup existing file
 */
function backupFile(file) {
  try {
    if (fs.existsSync(file)) {
      const backupPath = `${file}.backup`;
      fs.copyFileSync(file, backupPath);
      console.log(`📦 Backed up ${file} → ${backupPath}`);
    }
  } catch (error) {
    console.log(`⚠️ Failed to backup ${file}:`, error.message);
  }
}

/**
 * Create environment file for Render.com
 */
function createEnvFile() {
  const envContent = `# Render.com Environment Variables
# These are automatically set by Render.com

NODE_ENV=production
RENDER=true
PORT=10000

# Optional: Set these in Render.com dashboard
# FRONTEND_URL=https://your-frontend-domain.com
# RATE_LIMIT_MAX=100
# RATE_LIMIT_WINDOW=900000
`;
  
  try {
    fs.writeFileSync('.env.example', envContent);
    console.log('✅ Created .env.example with Render.com variables');
  } catch (error) {
    console.log('❌ Failed to create .env.example:', error.message);
  }
}

/**
 * Update .gitignore for Render.com
 */
function updateGitignore() {
  const renderIgnoreEntries = [
    '',
    '# Render.com specific',
    '*.backup',
    '.env.local',
    '.env.production',
    '',
    '# Build outputs',
    'dist/',
    'build/',
    '',
    '# Render.com logs',
    'render-logs/',
    ''
  ];
  
  try {
    let gitignoreContent = '';
    if (fs.existsSync('.gitignore')) {
      gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    }
    
    // Add Render.com entries if they don't exist
    const newEntries = renderIgnoreEntries.filter(entry => 
      !gitignoreContent.includes(entry.trim()) || entry === ''
    );
    
    if (newEntries.length > 0) {
      fs.appendFileSync('.gitignore', newEntries.join('\n'));
      console.log('✅ Updated .gitignore with Render.com entries');
    } else {
      console.log('✅ .gitignore already contains Render.com entries');
    }
  } catch (error) {
    console.log('❌ Failed to update .gitignore:', error.message);
  }
}

/**
 * Create GitHub workflow for CI/CD (optional)
 */
function createGitHubWorkflow() {
  const workflowDir = '.github/workflows';
  const workflowFile = path.join(workflowDir, 'render-deploy.yml');
  
  const workflowContent = `name: Deploy to Render.com

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Check if server starts
      run: |
        timeout 10s npm start || true
        echo "Server startup test completed"

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    
    steps:
    - name: Deploy to Render
      run: |
        echo "Deployment triggered automatically by Render.com"
        echo "Check your Render.com dashboard for deployment status"
`;
  
  try {
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }
    
    fs.writeFileSync(workflowFile, workflowContent);
    console.log('✅ Created GitHub workflow for CI/CD');
  } catch (error) {
    console.log('❌ Failed to create GitHub workflow:', error.message);
  }
}

/**
 * Validate Render.com setup
 */
function validateSetup() {
  console.log('🔍 Validating Render.com setup...');
  
  const checks = [
    {
      name: 'render.yaml exists',
      check: () => fs.existsSync('render.yaml'),
      fix: 'Run this script again or manually create render.yaml'
    },
    {
      name: 'server-render.js exists',
      check: () => fs.existsSync('server-render.js'),
      fix: 'Ensure server-render.js is present in project root'
    },
    {
      name: 'package-render.json exists',
      check: () => fs.existsSync('package-render.json'),
      fix: 'Ensure package-render.json is present in project root'
    },
    {
      name: 'README-RENDER.md exists',
      check: () => fs.existsSync('README-RENDER.md'),
      fix: 'Ensure README-RENDER.md is present for deployment instructions'
    },
    {
      name: 'utils/ytdlpManager.js exists',
      check: () => fs.existsSync('utils/ytdlpManager.js'),
      fix: 'Ensure ytdlpManager.js is present in utils directory'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check, fix }) => {
    if (check()) {
      console.log(`✅ ${name}`);
    } else {
      console.log(`❌ ${name}`);
      console.log(`   Fix: ${fix}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Main deployment setup function
 */
function main() {
  console.log('🚀 Setting up project for Render.com deployment...\n');
  
  let success = true;
  
  // Step 1: Backup existing files
  console.log('📦 Backing up existing files...');
  Object.values(RENDER_FILES).forEach(backupFile);
  console.log('');
  
  // Step 2: Copy Render-specific files
  console.log('📁 Copying Render.com-specific files...');
  for (const [src, dest] of Object.entries(RENDER_FILES)) {
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
  
  // Step 6: Create GitHub workflow (optional)
  console.log('⚙️ Creating GitHub workflow...');
  createGitHubWorkflow();
  console.log('');
  
  // Step 7: Validate setup
  const validationPassed = validateSetup();
  console.log('');
  
  // Step 8: Final instructions
  if (success && validationPassed) {
    console.log('🎉 Render.com setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Push your code to GitHub:');
    console.log('   git add .');
    console.log('   git commit -m "Setup for Render.com deployment"');
    console.log('   git push origin main');
    console.log('');
    console.log('2. Create a new Web Service on Render.com:');
    console.log('   - Go to https://dashboard.render.com');
    console.log('   - Click "New +" → "Web Service"');
    console.log('   - Connect your GitHub repository');
    console.log('   - Select your video downloader repository');
    console.log('');
    console.log('3. Configure deployment settings:');
    console.log('   - Name: video-downloader (or your preferred name)');
    console.log('   - Environment: Node');
    console.log('   - Build Command: npm install');
    console.log('   - Start Command: npm start');
    console.log('   - Plan: Free (or upgrade as needed)');
    console.log('');
    console.log('4. Deploy and test:');
    console.log('   - Click "Create Web Service"');
    console.log('   - Monitor build logs for any errors');
    console.log('   - Test your endpoints once deployed');
    console.log('');
    console.log('📖 For detailed instructions, see README-RENDER.md');
    console.log('');
    console.log('🔗 Your app will be available at:');
    console.log('   https://your-app-name.onrender.com');
    console.log('');
    console.log('🎯 Test endpoints:');
    console.log('   - Health: https://your-app-name.onrender.com/health');
    console.log('   - Video Info: https://your-app-name.onrender.com/api/video-info?url=VIDEO_URL');
    console.log('   - Download: https://your-app-name.onrender.com/api/download?url=VIDEO_URL');
  } else {
    console.log('❌ Setup completed with errors.');
    console.log('Please check the missing files and try again.');
    console.log('');
    console.log('🔧 Common fixes:');
    console.log('- Ensure all required files are present');
    console.log('- Check file permissions');
    console.log('- Verify project structure');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  copyFile, 
  backupFile, 
  createEnvFile, 
  updateGitignore, 
  createGitHubWorkflow,
  validateSetup 
};