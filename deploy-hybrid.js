/**
 * Hybrid Deployment Helper Script
 * This script helps prepare your project for hybrid deployment with
 * frontend on Vercel and backend on Render.com
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Helper function to print colored messages
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Main function
async function main() {
  print('\n🚀 Hybrid Deployment Setup Helper', 'bright');
  print('This script will help you prepare your project for hybrid deployment\n');
  print('Frontend: Vercel | Backend: Render.com\n', 'yellow');
  
  // Step 1: Get Render.com backend URL
  print('\n📡 STEP 1: Configure Backend URL', 'green');
  print('If you have already deployed to Render.com, enter your backend URL.');
  print('If not, you can enter a placeholder and update it later.\n');
  
  const renderUrl = await ask('Enter your Render.com backend URL (e.g., https://your-app-name.onrender.com): ');
  
  // Update script.js files with the Render URL
  try {
    const scriptPaths = [
      path.join(__dirname, 'script.js'),
      path.join(__dirname, 'public', 'script.js')
    ];
    
    for (const scriptPath of scriptPaths) {
      if (fs.existsSync(scriptPath)) {
        let content = fs.readFileSync(scriptPath, 'utf8');
        content = content.replace(
          /const RENDER_BACKEND_URL = '.*?';/,
          `const RENDER_BACKEND_URL = '${renderUrl}';`
        );
        fs.writeFileSync(scriptPath, content);
        print(`✅ Updated ${scriptPath} with Render URL`, 'green');
      }
    }
  } catch (error) {
    print(`❌ Error updating script files: ${error.message}`, 'red');
  }
  
  // Step 2: Verify vercel.json configuration
  print('\n🔧 STEP 2: Verifying Vercel configuration', 'green');
  const vercelConfigPath = path.join(__dirname, 'vercel.json');
  
  try {
    if (fs.existsSync(vercelConfigPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Check if config is already set for static-only deployment
      const isStaticOnly = vercelConfig.builds?.length === 1 && 
                          vercelConfig.builds[0].src === 'public/**' &&
                          !vercelConfig.functions;
      
      if (isStaticOnly) {
        print('✅ vercel.json is already configured for static-only deployment', 'green');
      } else {
        // Update vercel.json for static-only deployment
        const newConfig = {
          "version": 2,
          "builds": [
            {
              "src": "public/**",
              "use": "@vercel/static"
            }
          ],
          "routes": [
            {
              "src": "/(.*)",
              "dest": "/public/$1"
            }
          ]
        };
        
        fs.writeFileSync(vercelConfigPath, JSON.stringify(newConfig, null, 2));
        print('✅ Updated vercel.json for static-only deployment', 'green');
      }
    } else {
      // Create vercel.json if it doesn't exist
      const newConfig = {
        "version": 2,
        "builds": [
          {
            "src": "public/**",
            "use": "@vercel/static"
          }
        ],
        "routes": [
          {
            "src": "/(.*)",
            "dest": "/public/$1"
          }
        ]
      };
      
      fs.writeFileSync(vercelConfigPath, JSON.stringify(newConfig, null, 2));
      print('✅ Created vercel.json for static-only deployment', 'green');
    }
  } catch (error) {
    print(`❌ Error configuring vercel.json: ${error.message}`, 'red');
  }
  
  // Step 3: Ensure public directory exists and has necessary files
  print('\n📁 STEP 3: Verifying public directory structure', 'green');
  const publicDir = path.join(__dirname, 'public');
  
  try {
    // Create public directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
      print('✅ Created public directory', 'green');
    }
    
    // Check if index.html exists in public directory
    const publicIndexPath = path.join(publicDir, 'index.html');
    const rootIndexPath = path.join(__dirname, 'index.html');
    
    if (!fs.existsSync(publicIndexPath) && fs.existsSync(rootIndexPath)) {
      // Copy index.html from root to public directory
      fs.copyFileSync(rootIndexPath, publicIndexPath);
      print('✅ Copied index.html to public directory', 'green');
    }
    
    // Check if script.js exists in public directory
    const publicScriptPath = path.join(publicDir, 'script.js');
    const rootScriptPath = path.join(__dirname, 'script.js');
    
    if (!fs.existsSync(publicScriptPath) && fs.existsSync(rootScriptPath)) {
      // Copy script.js from root to public directory
      fs.copyFileSync(rootScriptPath, publicScriptPath);
      print('✅ Copied script.js to public directory', 'green');
    }
  } catch (error) {
    print(`❌ Error setting up public directory: ${error.message}`, 'red');
  }
  
  // Step 4: Provide deployment instructions
  print('\n📝 STEP 4: Deployment Instructions', 'green');
  print('\n1. Deploy your backend to Render.com:');
  print('   - Push your code to GitHub');
  print('   - Create a new Web Service in Render.com');
  print('   - Set the start command to: node server-render.js');
  print('   - Set environment variable FRONTEND_URL to your Vercel URL (once you have it)');
  
  print('\n2. Deploy your frontend to Vercel:');
  print('   - Push your code to GitHub');
  print('   - Create a new project in Vercel');
  print('   - Set the output directory to: public');
  print('   - Deploy!');
  
  print('\n3. Update your backend with the Vercel URL:');
  print('   - Go to your Render.com dashboard');
  print('   - Add environment variable: FRONTEND_URL=https://your-vercel-app.vercel.app');
  print('   - Redeploy the service');
  
  print('\n📚 For more detailed instructions, refer to HYBRID-DEPLOYMENT-GUIDE.md', 'cyan');
  
  // Finish
  print('\n✨ Setup complete!', 'bright');
  print('Your project is now configured for hybrid deployment.\n');
  
  rl.close();
}

// Run the main function
main().catch(error => {
  print(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
});