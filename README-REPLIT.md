# Video Downloader - Replit Setup Guide

This guide provides comprehensive instructions for deploying and running the video downloader application on Replit with proper yt-dlp integration.

## 🚀 Quick Setup for Replit

### 1. Environment Setup

First, ensure your Replit environment is properly configured:

```bash
# Run the setup script to install yt-dlp
bash setup-replit-ytdlp.sh
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Application

```bash
npm run replit
```

The application will be available at your Replit URL (typically `https://your-repl-name.your-username.repl.co`).

## 🔧 Manual yt-dlp Installation (if setup script fails)

If the automatic setup script doesn't work, follow these manual steps:

### Option 1: Using pip (Recommended)

```bash
# Update system packages
sudo apt-get update

# Install Python and pip
sudo apt-get install -y python3 python3-pip

# Install yt-dlp
pip3 install --user yt-dlp

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
yt-dlp --version
```

### Option 2: Direct Download

```bash
# Download yt-dlp binary
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O yt-dlp
chmod +x yt-dlp

# Move to system path
sudo mv yt-dlp /usr/local/bin/

# Verify installation
yt-dlp --version
```

## 🐛 Troubleshooting Common Issues

### Issue 1: `ENOENT` Error - yt-dlp not found

**Symptoms:**
- Error: `Command failed with ENOENT`
- yt-dlp executable not found

**Solutions:**

1. **Check if yt-dlp is installed:**
   ```bash
   which yt-dlp
   yt-dlp --version
   ```

2. **If not found, install using pip:**
   ```bash
   pip3 install --user yt-dlp
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. **Check PATH configuration:**
   ```bash
   echo $PATH
   # Should include /home/runner/.local/bin
   ```

4. **Manual PATH fix:**
   ```bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Issue 2: `formatResponse is not a function`

**Symptoms:**
- TypeError: formatResponse is not a function
- API returns 500 error

**Solution:**
This should be automatically resolved with the updated code. The `formatResponse` function is now properly exported from `utils/responseFormatter.js`.

### Issue 3: Permission Denied

**Symptoms:**
- Permission denied when executing yt-dlp

**Solutions:**

1. **Make yt-dlp executable:**
   ```bash
   chmod +x $(which yt-dlp)
   ```

2. **If using local binary:**
   ```bash
   chmod +x ./yt-dlp
   ```

### Issue 4: Network/Firewall Issues

**Symptoms:**
- Timeouts when downloading video info
- Connection refused errors

**Solutions:**

1. **Check Replit's network policies**
2. **Try different video URLs**
3. **Check if the platform is supported**

## 📋 Supported Platforms

- ✅ YouTube
- ✅ Twitter/X
- ✅ TikTok
- ✅ Instagram
- ✅ Facebook
- ✅ Vimeo
- ✅ Pinterest

## 🔍 Testing the Installation

### Test yt-dlp directly:

```bash
# Test with a YouTube video
yt-dlp --dump-single-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Test with Twitter
yt-dlp --dump-single-json "https://twitter.com/example/status/123456789"
```

### Test the API:

```bash
# Test video info endpoint
curl "https://your-repl-url.repl.co/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## 🔧 Configuration

### Environment Variables

The application automatically detects Replit environment. You can also manually set:

```bash
export REPLIT=true
```

### Custom yt-dlp Path

If you need to use a custom yt-dlp installation:

1. Edit `utils/ytdlpManager.js`
2. Modify the path detection logic in the `executeDirectYtDlp` method

## 📁 File Structure

```
├── utils/
│   ├── ytdlpManager.js          # Main yt-dlp integration
│   ├── responseFormatter.js     # Response formatting utilities
│   └── platformDetector.js      # Platform detection
├── controllers/
│   ├── twitterController.js     # Twitter-specific handling
│   └── ...                      # Other platform controllers
├── routes/
│   ├── videoInfo.js            # Video info API routes
│   └── download.js             # Download API routes
├── server-replit.js            # Replit-optimized server
├── package-replit.json         # Replit-specific dependencies
└── setup-replit-ytdlp.sh      # Automated setup script
```

## 🚨 Important Notes

1. **Replit Limitations:**
   - Some video platforms may be blocked by Replit's network policies
   - Large video downloads may timeout
   - Storage space is limited

2. **Rate Limiting:**
   - Be mindful of API rate limits from video platforms
   - Implement appropriate delays between requests

3. **Legal Considerations:**
   - Ensure you comply with platform terms of service
   - Respect copyright and intellectual property rights

## 🆘 Getting Help

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify yt-dlp installation: `yt-dlp --version`
3. Test with different video URLs
4. Check Replit's system status
5. Review the troubleshooting section above

## 📝 Changelog

### Latest Updates
- ✅ Fixed ENOENT error with improved yt-dlp path detection
- ✅ Added formatResponse function to responseFormatter.js
- ✅ Enhanced error handling and logging
- ✅ Improved Replit environment detection
- ✅ Added comprehensive setup script
- ✅ Better fallback mechanisms for yt-dlp-exec failures

---

**Happy downloading! 🎉**