/**
 * Update Render Backend URL Script
 * This script helps you update the Render backend URL in your frontend files
 * after you've deployed your backend to Render.com
 * 
 * Note: Frontend now always uses Render backend (no environment detection)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  print('\n🔧 Render URL Update Tool', 'bright');
  print('This script will update your frontend files with the correct Render backend URL\n');
  
  // Get the Render URL from user
  print('📡 Step 1: Get your Render backend URL', 'green');
  print('After deploying to Render.com, you should have a URL like:');
  print('https://your-app-name.onrender.com\n', 'yellow');
  
  const renderUrl = await ask('Enter your Render.com backend URL: ');
  
  // Validate URL format
  if (!renderUrl.startsWith('https://') || !renderUrl.includes('.onrender.com')) {
    print('\n⚠️  Warning: The URL should be in format: https://your-app-name.onrender.com', 'yellow');
    const confirm = await ask('Continue anyway? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      print('Operation cancelled.', 'red');
      rl.close();
      return;
    }
  }
  
  // Update script files
  print('\n🔄 Step 2: Updating frontend files...', 'green');
  
  const scriptPaths = [
    path.join(__dirname, 'script.js'),
    path.join(__dirname, 'public', 'script.js')
  ];
  
  let updatedFiles = 0;
  
  for (const scriptPath of scriptPaths) {
    try {
      if (fs.existsSync(scriptPath)) {
        let content = fs.readFileSync(scriptPath, 'utf8');
        
        // Replace the placeholder URL
        const oldPattern = /const RENDER_BACKEND_URL = '.*?';/;
        const newValue = `const RENDER_BACKEND_URL = '${renderUrl}';`;
        
        if (oldPattern.test(content)) {
          content = content.replace(oldPattern, newValue);
          fs.writeFileSync(scriptPath, content);
          print(`✅ Updated: ${scriptPath}`, 'green');
          updatedFiles++;
        } else {
          print(`⚠️  Pattern not found in: ${scriptPath}`, 'yellow');
        }
      } else {
        print(`⚠️  File not found: ${scriptPath}`, 'yellow');
      }
    } catch (error) {
      print(`❌ Error updating ${scriptPath}: ${error.message}`, 'red');
    }
  }
  
  // Summary
  print('\n📊 Summary:', 'blue');
  print(`Updated ${updatedFiles} file(s) with Render URL: ${renderUrl}`);
  
  if (updatedFiles > 0) {
    print('\n🚀 Next Steps:', 'green');
    print('1. Commit and push your changes to GitHub');
    print('2. Your Vercel deployment will auto-update');
    print('3. Test your application - it should now connect to your Render backend');
    print('4. Make sure to set FRONTEND_URL environment variable in Render dashboard');
    print('   FRONTEND_URL=https://your-vercel-app.vercel.app');
  }
  
  print('\n✨ Done!', 'bright');
  rl.close();
}

// Handle errors
main().catch(error => {
  print(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});