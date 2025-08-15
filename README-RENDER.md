# 🚀 Video Downloader - Render.com Deployment Guide

This guide provides comprehensive instructions for deploying your video downloader application on Render.com with proper yt-dlp integration.

## 🌟 Why Render.com?

- **Free Tier Available**: Deploy for free with generous limits
- **Automatic HTTPS**: SSL certificates included
- **Git Integration**: Auto-deploy from GitHub/GitLab
- **Better Performance**: Faster than Replit for production apps
- **No Sleep Mode**: Unlike Heroku free tier, stays awake longer
- **Built-in CI/CD**: Automatic deployments on code changes

## 🚀 Quick Setup for Render.com

### Prerequisites

1. **GitHub Account**: Your code needs to be in a GitHub repository
2. **Render.com Account**: Sign up at [render.com](https://render.com)
3. **Git Repository**: Push your code to GitHub

### Important Version Fix
⚠️ **Note**: If you encounter the error `npm error notarget No matching version found for yt-dlp-exec@^0.3.3`, this has been fixed by updating to `yt-dlp-exec@^1.0.2` in all package.json files.

### Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render.com deployment with fixed dependencies"
   git push origin main
   ```

2. **Verify Required Files**:
   - ✅ `render.yaml` (deployment configuration)
   - ✅ `package.json` (dependencies)
   - ✅ `server.js` (main server file)
   - ✅ All controller and utility files

### Step 2: Deploy on Render.com

1. **Create New Web Service**:
   - Go to [render.com/dashboard](https://render.com/dashboard)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your video downloader repository

2. **Configure Deployment**:
   - **Name**: `video-downloader` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or upgrade as needed)

3. **Environment Variables** (Optional):
   ```
   NODE_ENV=production
   PORT=10000
   ```

4. **Advanced Settings**:
   - **Auto-Deploy**: ✅ Enabled
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `.` (current directory)

### Step 3: Configure yt-dlp Installation

Render.com will automatically install yt-dlp using the configuration in `render.yaml`. The installation happens during the build process.

### Step 4: Deploy and Test

1. **Deploy**: Click "Create Web Service"
2. **Monitor Build**: Watch the build logs for any errors
3. **Test Deployment**: Once deployed, test your endpoints

## 🔧 Configuration Details

### render.yaml Configuration

The `render.yaml` file in your project root configures:

- **Build Process**: Installs Node.js dependencies and yt-dlp
- **Environment**: Sets production environment variables
- **Health Checks**: Monitors application health
- **Auto-Deploy**: Enables automatic deployments

### Environment Detection

Your `ytdlpManager.js` automatically detects Render.com environment and configures yt-dlp accordingly.

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app-name.onrender.com/
```

### 2. Video Info API
```bash
curl "https://your-app-name.onrender.com/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 3. Download API
```bash
curl "https://your-app-name.onrender.com/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=mp4&quality=720p"
```

## 📊 Render.com Plans Comparison

| Feature | Free | Starter ($7/month) | Standard ($25/month) |
|---------|------|-------------------|---------------------|
| **Build Minutes** | 500/month | 1000/month | 2000/month |
| **Bandwidth** | 100GB/month | 1TB/month | 1TB/month |
| **Sleep Mode** | After 15min idle | Never | Never |
| **Custom Domains** | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ |
| **Advanced Metrics** | ❌ | ✅ | ✅ |

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails with "No matching version found for yt-dlp-exec@^0.3.3"
**Symptoms**: npm error during dependency installation
**Solutions**:
- This has been fixed by updating to `yt-dlp-exec@^1.0.2`
- Ensure you're using the latest package.json files
- Run `npm install` locally to verify dependencies

#### 2. Build Failures
**Symptoms**: Build fails during deployment
**Solutions**:
- Check build logs in Render dashboard
- Verify `package.json` dependencies
- Ensure all required files are committed to Git

#### 3. yt-dlp Not Found
**Symptoms**: "yt-dlp command not found" errors
**Solutions**:
- Check the `preDeployCommand` in `render.yaml`
- Verify Python3 and pip are available
- Check build logs for yt-dlp installation

#### 4. Port Issues
**Symptoms**: Application fails to start
**Solutions**:
- Ensure your server listens on `process.env.PORT`
- Default port should be 10000 for Render
- Check server.js configuration

#### 5. Memory/CPU Limits
**Symptoms**: Application crashes or becomes slow
**Solutions**:
- Upgrade to Starter plan for more resources
- Optimize video processing (smaller chunks)
- Implement request queuing

#### 6. Timeout Issues
**Symptoms**: Service becomes unresponsive or slow
**Solutions**:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 30+ seconds
- Consider upgrading for always-on service

#### 7. YtDlpManager Initialize Error
**Symptoms**: `TypeError: ytdlpManager.initialize is not a function`
**Solutions**:
- This has been fixed by removing the non-existent initialize() method call
- YtDlpManager initializes automatically in its constructor
- Ensure you're using the latest server.js and server-render.js files
- The manager is ready to use immediately after import

#### 8. Dependency Installation Errors
**Symptoms**: Various npm or package installation failures
**Solutions**:
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json, then reinstall
- Check for conflicting package versions

### Debug Commands

Add these to your build logs for debugging:

```bash
# Check yt-dlp installation
yt-dlp --version

# Check Python environment
python3 --version
pip3 --version

# Check PATH
echo $PATH

# Test yt-dlp functionality
yt-dlp --help
```

## 🔒 Security Best Practices

1. **Environment Variables**: Store sensitive data in Render's environment variables
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all URLs and parameters
4. **CORS Configuration**: Configure CORS for your frontend domain
5. **Error Handling**: Don't expose internal errors to users

## 📈 Performance Optimization

### 1. Caching
```javascript
// Add response caching for video info
app.use('/api/video-info', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  next();
});
```

### 2. Request Queuing
```javascript
// Limit concurrent downloads
const queue = require('bull');
const downloadQueue = new queue('download processing');
```

### 3. Streaming Optimization
```javascript
// Use streaming for large files
res.setHeader('Content-Type', 'video/mp4');
res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
```

## 🚀 Advanced Features

### Custom Domain Setup

1. **Upgrade Plan**: Requires Starter plan or higher
2. **Add Domain**: In Render dashboard → Settings → Custom Domains
3. **DNS Configuration**: Point your domain to Render's servers
4. **SSL Certificate**: Automatically provisioned

### Auto-Scaling

Render automatically scales your application based on traffic:
- **Horizontal Scaling**: Multiple instances during high traffic
- **Vertical Scaling**: More CPU/memory as needed
- **Geographic Distribution**: CDN for static assets

## 📊 Monitoring and Analytics

### Built-in Metrics
- **Response Times**: Monitor API performance
- **Error Rates**: Track failed requests
- **Resource Usage**: CPU, memory, bandwidth
- **Build History**: Track deployments

### Custom Logging
```javascript
// Add structured logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});
```

## 🔄 Migration from Replit

### Key Differences

| Aspect | Replit | Render.com |
|--------|--------|------------|
| **Deployment** | File upload | Git-based |
| **Environment** | Interactive IDE | Production server |
| **Scaling** | Single instance | Auto-scaling |
| **Custom Domains** | Paid plans only | Starter+ plans |
| **Build Process** | Manual setup | Automated CI/CD |

### Migration Steps

1. **Export from Replit**: Download all files
2. **Create Git Repository**: Initialize and push to GitHub
3. **Update Configuration**: Use `render.yaml` instead of `.replit`
4. **Deploy on Render**: Follow setup steps above
5. **Update DNS**: Point domain to new Render URL

## 📞 Support and Resources

### Official Documentation
- [Render.com Docs](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-js)
- [Environment Variables](https://render.com/docs/environment-variables)

### Community Support
- [Render Community Forum](https://community.render.com)
- [Discord Server](https://discord.gg/render)
- [GitHub Issues](https://github.com/renderinc/render-examples)

### Getting Help

If you encounter issues:

1. **Check Build Logs**: Detailed error messages in dashboard
2. **Review Documentation**: Comprehensive guides available
3. **Community Forum**: Active community support
4. **Support Tickets**: Available for paid plans

## 🎉 Success Checklist

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ Application starts and shows "Server running" message
- ✅ Health check endpoint returns 200 OK
- ✅ Video info API returns valid JSON
- ✅ Download API streams video files
- ✅ All supported platforms work correctly

## 🔗 Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Service Logs**: Available in your service dashboard
- **Metrics**: Built-in performance monitoring
- **Billing**: Usage and cost tracking

---

**🎊 Your video downloader is now ready for production on Render.com!**

**Key Benefits Achieved**:
- ✅ Professional deployment platform
- ✅ Automatic HTTPS and custom domains
- ✅ Git-based CI/CD pipeline
- ✅ Auto-scaling and high availability
- ✅ Better performance than shared hosting
- ✅ Comprehensive monitoring and logging