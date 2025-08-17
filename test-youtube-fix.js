const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test YouTube video ID
const testVideoId = 'xmBz238Z4NM';
const testUrl = `https://youtu.be/${testVideoId}`;

// Cookie file path
const cookieFile = path.join(__dirname, 'cookies', 'youtube.txt');

console.log('🧪 Testing YouTube Cookie Fix');
console.log('=' .repeat(50));

// Check if cookie file exists
if (!fs.existsSync(cookieFile)) {
    console.log('❌ Cookie file not found:', cookieFile);
    console.log('📝 Please create cookies/youtube.txt with valid YouTube cookies');
    process.exit(1);
}

// Check cookie file content
const cookieContent = fs.readFileSync(cookieFile, 'utf8');
const lines = cookieContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
console.log(`🍪 Found ${lines.length} cookie entries`);

// Check for expired cookies
const currentTime = Math.floor(Date.now() / 1000);
let expiredCount = 0;
let validCount = 0;

lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 5) {
        const expiry = parseInt(parts[4]);
        if (expiry > 0 && expiry < currentTime) {
            expiredCount++;
        } else {
            validCount++;
        }
    }
});

console.log(`✅ Valid cookies: ${validCount}`);
console.log(`⚠️ Expired cookies: ${expiredCount}`);

if (expiredCount > validCount) {
    console.log('🚨 Warning: Most cookies are expired. Consider updating your cookies.');
}

// Test yt-dlp with cookies
console.log('\n🚀 Testing yt-dlp with cookies...');

const ytdlpArgs = [
    testUrl,
    '--dump-single-json',
    '--no-check-certificates',
    '--no-warnings',
    '--cookies', cookieFile,
    '--add-header', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const ytdlp = spawn('yt-dlp', ytdlpArgs, {
    stdio: ['pipe', 'pipe', 'pipe']
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
    console.log(`\n📊 yt-dlp exit code: ${code}`);
    
    if (code === 0) {
        console.log('✅ SUCCESS: yt-dlp worked with cookies!');
        try {
            const videoInfo = JSON.parse(stdout);
            console.log(`📺 Video: ${videoInfo.title}`);
            console.log(`👤 Channel: ${videoInfo.uploader}`);
            console.log(`⏱️ Duration: ${videoInfo.duration}s`);
        } catch (e) {
            console.log('✅ yt-dlp succeeded but JSON parsing failed');
        }
    } else {
        console.log('❌ FAILED: yt-dlp failed with cookies');
        if (stderr) {
            console.log('🔍 Error details:');
            console.log(stderr);
        }
        
        // Check for specific error patterns
        if (stderr.includes('Sign in to confirm you\'re not a bot')) {
            console.log('\n🤖 Bot detection error detected!');
            console.log('💡 Possible solutions:');
            console.log('   1. Update your YouTube cookies (export fresh ones)');
            console.log('   2. Use a different browser profile for cookie export');
            console.log('   3. Try using --cookies-from-browser option');
            console.log('   4. Add more headers to mimic real browser behavior');
        }
        
        if (stderr.includes('HTTP Error 403')) {
            console.log('\n🚫 Access forbidden (403 error)');
            console.log('💡 This usually means cookies are invalid or expired');
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Test completed');
});

ytdlp.on('error', (error) => {
    console.log('❌ Failed to start yt-dlp:', error.message);
    console.log('💡 Make sure yt-dlp is installed and in PATH');
});