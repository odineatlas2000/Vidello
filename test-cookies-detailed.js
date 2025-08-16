const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class DetailedCookiesTester {
  constructor() {
    this.cookiesDir = path.join(__dirname, 'cookies');
    this.youtubeCookiesFile = path.join(this.cookiesDir, 'youtube.txt');
  }

  async runTests() {
    console.log('🔍 Starting detailed cookies analysis...');
    console.log('=' .repeat(60));
    
    await this.analyzeCookiesFile();
    await this.testYtDlpWithCookies();
    await this.testCookiesFromBrowser();
    
    console.log('\n✅ Detailed cookies analysis completed!');
  }

  async analyzeCookiesFile() {
    console.log('\n📋 ANALYZING COOKIES FILE');
    console.log('-'.repeat(40));
    
    if (!fs.existsSync(this.youtubeCookiesFile)) {
      console.log('❌ YouTube cookies file not found!');
      return;
    }
    
    const cookieData = fs.readFileSync(this.youtubeCookiesFile, 'utf8');
    const lines = cookieData.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log(`📊 Total cookie entries: ${lines.length}`);
    console.log('\n🍪 Cookie analysis:');
    
    const cookieTypes = {
      session: [],
      auth: [],
      tracking: [],
      preferences: [],
      other: []
    };
    
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 6) {
        const name = parts[5];
        const value = parts[6] || '';
        
        if (name.includes('SESSION') || name.includes('SSID') || name.includes('SAPISID')) {
          cookieTypes.auth.push({ name, hasValue: !!value });
        } else if (name.includes('VISITOR') || name.includes('YSC')) {
          cookieTypes.tracking.push({ name, hasValue: !!value });
        } else if (name.includes('PREF') || name.includes('SOCS')) {
          cookieTypes.preferences.push({ name, hasValue: !!value });
        } else {
          cookieTypes.other.push({ name, hasValue: !!value });
        }
      }
    });
    
    console.log(`   🔐 Authentication cookies: ${cookieTypes.auth.length}`);
    cookieTypes.auth.forEach(cookie => {
      console.log(`      - ${cookie.name}: ${cookie.hasValue ? '✅ Has value' : '❌ Empty'}`);
    });
    
    console.log(`   📊 Tracking cookies: ${cookieTypes.tracking.length}`);
    cookieTypes.tracking.forEach(cookie => {
      console.log(`      - ${cookie.name}: ${cookie.hasValue ? '✅ Has value' : '❌ Empty'}`);
    });
    
    console.log(`   ⚙️ Preference cookies: ${cookieTypes.preferences.length}`);
    console.log(`   🔧 Other cookies: ${cookieTypes.other.length}`);
    
    // Check for critical authentication cookies
    const criticalCookies = ['SAPISID', 'HSID', 'SSID', 'APISID', 'SID'];
    const foundCritical = criticalCookies.filter(name => 
      lines.some(line => line.includes(name))
    );
    
    console.log(`\n🔑 Critical auth cookies found: ${foundCritical.length}/${criticalCookies.length}`);
    if (foundCritical.length === 0) {
      console.log('⚠️  WARNING: No critical authentication cookies found!');
      console.log('   This suggests you may not be logged in to YouTube.');
    } else {
      foundCritical.forEach(name => console.log(`   ✅ ${name}`));
    }
  }

  async testYtDlpWithCookies() {
    console.log('\n🧪 TESTING YT-DLP WITH COOKIES');
    console.log('-'.repeat(40));
    
    const testUrl = 'https://www.youtube.com/watch?v=xmBz238Z4NM';
    
    return new Promise((resolve) => {
      const args = [
        '--dump-single-json',
        '--no-warnings',
        '--cookies', this.youtubeCookiesFile,
        testUrl
      ];
      
      console.log('🚀 Running: yt-dlp', args.join(' '));
      
      const ytdlp = spawn('yt-dlp', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ytdlp.on('close', (code) => {
        if (code === 0) {
          console.log('✅ yt-dlp succeeded with cookies!');
          try {
            const info = JSON.parse(stdout);
            console.log(`   📺 Title: ${info.title}`);
            console.log(`   👤 Uploader: ${info.uploader}`);
            console.log(`   ⏱️  Duration: ${info.duration}s`);
          } catch (e) {
            console.log('   ✅ Got response but failed to parse JSON');
          }
        } else {
          console.log(`❌ yt-dlp failed with code ${code}`);
          if (stderr) {
            console.log('   Error:', stderr.trim());
          }
        }
        resolve();
      });
      
      ytdlp.on('error', (error) => {
        console.log('❌ Failed to spawn yt-dlp:', error.message);
        resolve();
      });
    });
  }

  async testCookiesFromBrowser() {
    console.log('\n🌐 TESTING COOKIES FROM BROWSER');
    console.log('-'.repeat(40));
    
    const testUrl = 'https://www.youtube.com/watch?v=xmBz238Z4NM';
    
    return new Promise((resolve) => {
      const args = [
        '--dump-single-json',
        '--no-warnings',
        '--cookies-from-browser', 'chrome',
        testUrl
      ];
      
      console.log('🚀 Running: yt-dlp --cookies-from-browser chrome');
      
      const ytdlp = spawn('yt-dlp', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ytdlp.on('close', (code) => {
        if (code === 0) {
          console.log('✅ yt-dlp succeeded with browser cookies!');
          try {
            const info = JSON.parse(stdout);
            console.log(`   📺 Title: ${info.title}`);
            console.log(`   👤 Uploader: ${info.uploader}`);
            console.log(`   ⏱️  Duration: ${info.duration}s`);
            console.log('\n💡 SOLUTION: Use --cookies-from-browser instead of cookie file!');
          } catch (e) {
            console.log('   ✅ Got response but failed to parse JSON');
          }
        } else {
          console.log(`❌ yt-dlp failed with browser cookies, code ${code}`);
          if (stderr) {
            console.log('   Error:', stderr.trim());
          }
        }
        resolve();
      });
      
      ytdlp.on('error', (error) => {
        console.log('❌ Failed to spawn yt-dlp:', error.message);
        resolve();
      });
    });
  }
}

// Run the tests
const tester = new DetailedCookiesTester();
tester.runTests().catch(console.error);