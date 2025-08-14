# VidGrabber - Replit Backend

A powerful video downloader backend optimized for Replit deployment. Download videos from YouTube, Twitter/X, Instagram, TikTok, Facebook, Vimeo, and more!

## 🚀 Quick Start on Replit

### Method 1: Import from GitHub
1. Fork this repository to your GitHub account
2. Go to [Replit](https://replit.com)
3. Click "Create Repl" → "Import from GitHub"
4. Paste your repository URL
5. Replit will automatically detect the configuration

### Method 2: Manual Setup
1. Create a new Node.js Repl on Replit
2. Upload all the Replit-specific files:
   - `server-replit.js`
   - `package-replit.json` (rename to `package.json`)
   - `replit.nix`
   - `.replit`
   - All controller and utility files
3. Run `npm install` in the Shell
4. Click the "Run" button

## 📁 Replit-Specific Files

### Core Files
- `server-replit.js` - Main server file optimized for Replit
- `package-replit.json` - Dependencies and scripts for Replit
- `replit.nix` - System dependencies (yt-dlp, ffmpeg, etc.)
- `.replit` - Replit configuration
- `utils/ytdlpManager-replit.js` - Video downloader manager for Linux
- `controllers/*-replit.js` - Platform-specific controllers

### Key Differences from Local Version
- **CORS Configuration**: Allows Replit domains (`.replit.dev`, `.repl.co`)
- **Port Binding**: Uses `0.0.0.0` for external access
- **Binary Dependencies**: Uses system yt-dlp instead of Windows executable
- **Environment Variables**: Optimized for Replit's environment

## 🔧 Configuration

### Environment Variables
Create a `.env` file or use Replit's Secrets tab:

```env
PORT=3000
NODE_ENV=production
```

### Replit Secrets (Recommended)
1. Go to your Repl
2. Click on "Secrets" tab (lock icon)
3. Add any API keys or sensitive configuration

## 🌐 API Endpoints

### Get Video Information
```
GET /api/video-info?url={VIDEO_URL}
```

**Example:**
```bash
curl "https://your-repl-name.your-username.repl.co/api/video-info?url=https://twitter.com/user/status/123456789"
```

### Download Video
```
GET /api/download?url={VIDEO_URL}&format={FORMAT}&quality={QUALITY}
```

**Parameters:**
- `url` (required): Video URL
- `format` (optional): `mp4`, `webm`, `audio`, `mp3`
- `quality` (optional): `144`, `240`, `360`, `480`, `720`, `1080`

**Example:**
```bash
curl "https://your-repl-name.your-username.repl.co/api/download?url=https://twitter.com/user/status/123456789&format=mp4&quality=720"
```

## 🎯 Supported Platforms

| Platform | Video Download | Audio Download | Quality Selection |
|----------|----------------|----------------|-----------------|
| YouTube | ✅ | ✅ | ✅ |
| Twitter/X | ✅ | ✅ | ✅ |
| Instagram | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ |
| Vimeo | ✅ | ✅ | ✅ |
| Pinterest | ✅ | ✅ | ❌ |

## 🛠️ Development

### Local Testing
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Debugging on Replit
1. Use the built-in debugger
2. Check the Console tab for logs
3. Monitor the Shell for system-level issues
4. Use `console.log()` statements for debugging

## 🔍 Troubleshooting

### Common Issues

**1. "yt-dlp not found" Error**
- Ensure `replit.nix` includes `pkgs.yt-dlp`
- Restart your Repl to reload system dependencies

**2. CORS Errors**
- Check that your frontend domain is allowed in `server-replit.js`
- Add your custom domain to the CORS whitelist

**3. Download Failures**
- Some platforms may block requests from Replit IPs
- Try different video URLs to test
- Check the Console for specific error messages

**4. Memory Issues**
- Large video downloads may exceed Replit's memory limits
- Consider implementing streaming optimizations
- Use lower quality settings for testing

### Performance Tips

1. **Keep Your Repl Active**: Use a service like UptimeRobot to ping your Repl
2. **Optimize Dependencies**: Remove unused packages from `package.json`
3. **Use Caching**: Implement response caching for video info requests
4. **Monitor Resources**: Check CPU and memory usage in Replit's dashboard

## 🔒 Security Considerations

- Never commit API keys or secrets to your repository
- Use Replit's Secrets feature for sensitive data
- Implement rate limiting for production use
- Validate and sanitize all user inputs
- Consider implementing authentication for private use

## 📊 Monitoring

### Health Check Endpoint
```
GET /health
```

Returns server status and available downloaders:
```json
{
  "status": "OK",
  "message": "Server is running",
  "downloaders": ["ytdl-core", "yt-dlp-exec"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes on Replit
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Replit's documentation
3. Open an issue on GitHub
4. Join the Replit community forums

---

**Happy downloading! 🎉**