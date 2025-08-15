# YouTube Cookies Setup Guide

This guide will help you set up YouTube cookies to bypass "Sign in to confirm you're not a bot" errors and other authentication issues.

## 🍪 What are Cookies and Why Do We Need Them?

Cookies are small pieces of data that websites store in your browser to remember your login status and preferences. YouTube uses cookies to:
- Verify that you're a legitimate user (not a bot)
- Remember your login session
- Provide personalized content

When yt-dlp tries to download videos without cookies, YouTube may block the request thinking it's automated scraping.

## 📋 Prerequisites

1. A web browser (Chrome, Firefox, Edge, etc.)
2. A browser extension to export cookies
3. A YouTube account (recommended to be logged in)

## 🔧 Step-by-Step Setup

### Step 1: Install Cookie Export Extension

**For Chrome/Edge:**
1. Go to Chrome Web Store
2. Search for "Get cookies.txt LOCALLY"
3. Install the extension by Rahul Shaw
4. Pin it to your toolbar

**For Firefox:**
1. Go to Firefox Add-ons
2. Search for "cookies.txt"
3. Install "cookies.txt" by Lennon Hill
4. Pin it to your toolbar

### Step 2: Export YouTube Cookies

1. **Open YouTube.com** in your browser
2. **Log in to your YouTube account** (if not already logged in)
3. **Navigate to any YouTube video** to ensure you're fully authenticated
4. **Click the cookie extension icon** in your toolbar
5. **Select "youtube.com"** from the domain list
6. **Click "Download"** or "Export" to save the cookies file
7. **Save the file** as `youtube.txt` in your Downloads folder

### Step 3: Move Cookies to Your Project

1. **Copy the downloaded `youtube.txt` file**
2. **Paste it into** the `cookies/` directory in your project:
   ```
   E:\Projets\Web-site-Programming\my-site-download\cookies\youtube.txt
   ```
3. **Replace the existing placeholder file**

### Step 4: Verify Cookie Format

Open the `cookies/youtube.txt` file and verify it looks like this:
```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	FALSE	1234567890	SESSION_TOKEN	your_session_token_here
.youtube.com	TRUE	/	TRUE	1234567890	__Secure-YT_TOKEN	your_secure_token_here
```

## 🚀 Testing Your Setup

1. **Restart your server** to load the new cookies:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   node server-render.js
   ```

2. **Test with a YouTube URL** that previously failed:
   - Go to http://localhost:10000
   - Try downloading a video that gave "bot detection" errors
   - Check the console logs for cookie usage messages

3. **Look for these success messages** in the console:
   ```
   🍪 Found cookie file for youtube: /path/to/cookies/youtube.txt
   🍪 Using cookies for youtube authentication
   ✅ yt-dlp execution successful
   ```

## 🔄 Cookie Maintenance

### When to Update Cookies
- **Every 1-2 weeks** for optimal performance
- **When you get authentication errors** again
- **After logging out/in** to your YouTube account
- **When cookies expire** (you'll see error messages)

### Signs Your Cookies Need Updating
- "Sign in to confirm you're not a bot" errors return
- "This video is unavailable" for public videos
- Authentication-related error messages in console

## 🛡️ Security Best Practices

### ✅ Do:
- Keep your cookies file private and secure
- Update cookies regularly
- Use a dedicated YouTube account for downloading (optional)
- Check that `cookies/` is in your `.gitignore` file

### ❌ Don't:
- Share your cookies file with others
- Commit cookies to version control (Git)
- Use cookies from shared/public computers
- Leave old, expired cookies in the file

## 🐛 Troubleshooting

### Problem: "Cookie file is empty"
**Solution:** Re-export cookies and ensure the file has content

### Problem: "No cookie file found"
**Solution:** Check file path and name: `cookies/youtube.txt`

### Problem: Still getting bot detection errors
**Solutions:**
1. Update your cookies (they may have expired)
2. Try logging out and back into YouTube, then re-export
3. Clear your browser cache and re-export cookies
4. Use a different YouTube account

### Problem: "Invalid cookie format"
**Solution:** Ensure you're using the Netscape format (not JSON)

## 📊 Advanced Configuration

### Multiple Accounts
You can create multiple cookie files:
```
cookies/
├── youtube.txt          # Primary account
├── youtube-backup.txt   # Backup account
└── youtube-premium.txt  # Premium account
```

### Platform-Specific Cookies
The system supports cookies for other platforms too:
```
cookies/
├── youtube.txt
├── instagram.txt
├── facebook.txt
├── tiktok.txt
└── twitter.txt
```

## 🎯 Expected Results

After proper setup, you should see:
- ✅ Successful downloads of previously blocked videos
- ✅ No more "bot detection" errors
- ✅ Access to age-restricted content (if logged in)
- ✅ Better download success rates
- ✅ Console logs showing cookie usage

## 📞 Support

If you're still having issues:
1. Check the console logs for detailed error messages
2. Verify your cookie file format and content
3. Try re-exporting cookies from a fresh browser session
4. Ensure you're logged into YouTube when exporting

---

**🎉 Congratulations!** Your YouTube downloader now has proper authentication support and should handle bot detection much better!