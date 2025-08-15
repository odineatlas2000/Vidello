#!/usr/bin/env node
/**
 * Cookie Validation and Testing Script
 * Tests if your YouTube cookies are properly set up and working
 */

const fs = require('fs');
const path = require('path');
const YtDlpManager = require('./utils/ytdlpManager');

// Test YouTube URLs (use public videos that are known to work)
const TEST_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll - always available
  'https://www.youtube.com/watch?v=jNQXAC9IVRw'  // Me at the zoo - first YouTube video
];

class CookieTester {
  constructor() {
    this.ytdlpManager = new YtDlpManager();
  }

  /**
   * Check if cookie files exist and are valid
   */
  validateCookieFiles() {
    console.log('\n🔍 Checking cookie files...');
    
    const cookiesDir = path.join(__dirname, 'cookies');
    const platforms = ['youtube', 'instagram', 'facebook', 'tiktok', 'twitter'];
    const results = {};

    platforms.forEach(platform => {
      const cookieFile = path.join(cookiesDir, `${platform}.txt`);
      
      if (fs.existsSync(cookieFile)) {
        const stats = fs.statSync(cookieFile);
        const content = fs.readFileSync(cookieFile, 'utf8');
        
        if (stats.size === 0) {
          results[platform] = { status: 'empty', message: 'File exists but is empty' };
        } else if (content.includes('# Your cookies will go here') || content.includes('# Delete these comment lines')) {
          results[platform] = { status: 'placeholder', message: 'Contains placeholder content' };
        } else if (content.includes('# Netscape HTTP Cookie File') || content.includes('.youtube.com')) {
          results[platform] = { status: 'valid', message: `Valid cookie file (${stats.size} bytes)` };
        } else {
          results[platform] = { status: 'invalid', message: 'Invalid format or content' };
        }
      } else {
        results[platform] = { status: 'missing', message: 'Cookie file not found' };
      }
    });

    // Display results
    platforms.forEach(platform => {
      const result = results[platform];
      const icon = {
        'valid': '✅',
        'missing': 'ℹ️',
        'empty': '⚠️',
        'placeholder': '⚠️',
        'invalid': '❌'
      }[result.status];
      
      console.log(`${icon} ${platform.padEnd(10)}: ${result.message}`);
    });

    return results;
  }

  /**
   * Test YouTube video info extraction with cookies
   */
  async testYouTubeAccess() {
    console.log('\n🎬 Testing YouTube access with cookies...');
    
    for (const url of TEST_URLS) {
      try {
        console.log(`\n🔗 Testing: ${url}`);
        const startTime = Date.now();
        
        const info = await this.ytdlpManager.getVideoInfo(url);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Success! (${duration}ms)`);
        console.log(`   Title: ${info.title}`);
        console.log(`   Duration: ${info.duration}s`);
        console.log(`   Formats: ${info.formats?.length || 0} available`);
        
        return true; // If one succeeds, cookies are working
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        
        if (error.message.includes('Sign in to confirm you\'re not a bot')) {
          console.log('   🤖 Bot detection error - cookies may be missing or expired');
        } else if (error.message.includes('cookies')) {
          console.log('   🍪 Cookie-related error - check your cookie file');
        }
      }
    }
    
    return false;
  }

  /**
   * Provide recommendations based on test results
   */
  provideRecommendations(cookieResults, youtubeWorking) {
    console.log('\n📋 Recommendations:');
    
    if (cookieResults.youtube?.status === 'missing') {
      console.log('❗ Set up YouTube cookies:');
      console.log('   1. Install "Get cookies.txt LOCALLY" browser extension');
      console.log('   2. Go to YouTube.com and log in');
      console.log('   3. Export cookies and save as cookies/youtube.txt');
      console.log('   4. See YOUTUBE-COOKIES-SETUP.md for detailed instructions');
    } else if (cookieResults.youtube?.status === 'placeholder') {
      console.log('❗ Replace placeholder YouTube cookies:');
      console.log('   1. Export real cookies from your browser');
      console.log('   2. Replace the content in cookies/youtube.txt');
    } else if (cookieResults.youtube?.status === 'valid' && !youtubeWorking) {
      console.log('❗ YouTube cookies may be expired:');
      console.log('   1. Log into YouTube in your browser');
      console.log('   2. Re-export fresh cookies');
      console.log('   3. Replace cookies/youtube.txt with new file');
    } else if (youtubeWorking) {
      console.log('✅ YouTube cookies are working properly!');
      console.log('✅ Your downloader should handle bot detection well now.');
    }
    
    if (cookieResults.youtube?.status === 'valid') {
      console.log('\n💡 Tips:');
      console.log('   • Update cookies every 1-2 weeks for best results');
      console.log('   • Keep cookies private and secure');
      console.log('   • Restart your server after updating cookies');
    }
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('🧪 YouTube Cookie Validation Test');
    console.log('================================\n');
    
    try {
      // Test 1: Validate cookie files
      const cookieResults = this.validateCookieFiles();
      
      // Test 2: Test YouTube access
      const youtubeWorking = await this.testYouTubeAccess();
      
      // Test 3: Provide recommendations
      this.provideRecommendations(cookieResults, youtubeWorking);
      
      console.log('\n🏁 Test completed!');
      
      if (youtubeWorking) {
        console.log('🎉 Your YouTube cookie setup is working correctly!');
        process.exit(0);
      } else {
        console.log('⚠️  YouTube access needs attention. Follow the recommendations above.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Test failed with error:', error.message);
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new CookieTester();
  tester.runTests().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = CookieTester;