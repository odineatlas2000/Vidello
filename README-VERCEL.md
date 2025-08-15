# 🚀 Video Downloader - Vercel Deployment Guide

This guide provides comprehensive instructions for deploying your video downloader application on Vercel with proper yt-dlp integration.

## 🌟 Why Vercel?

- **Free Tier Available**: Deploy for free with generous limits
- **Automatic HTTPS**: SSL certificates included
- **Git Integration**: Auto-deploy from GitHub/GitLab
- **Serverless Architecture**: Scales automatically with demand
- **Global CDN**: Fast response times worldwide
- **Built-in CI/CD**: Automatic deployments on code changes

## 🚀 Quick Setup for Vercel

### Prerequisites

1. **GitHub Account**: Your code needs to be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Git Repository**: Push your code to GitHub

### Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify Required Files**:
   - ✅ `vercel.json` (deployment configuration)
   - ✅ `package-vercel.json` (dependencies)
   - ✅ `server-vercel.js` (main server file)
   - ✅ All controller and utility files

### Step 2: Deploy on Vercel

1. **Install Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from CLI**:
   ```bash
   vercel login
   vercel
   ```

3. **Or Deploy from Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project" → "Import Git Repository"
   - Select your video downloader repository
   - Configure deployment settings:
     - **Framework Preset**: `Other`
     - **Build Command**: Leave empty (no build needed)
     - **Output Directory**: Leave empty
     - **Install Command**: `npm install --production`

4. **Environment Variables** (Optional):
   ```
   NODE_ENV=production
   VERCEL=true
   ```

**Important**: The new structure uses Vercel's serverless functions:
- API endpoints are in `/api/` directory as individual files
- Static files are served from `/public/` directory
- Each API route is a separate serverless function

### Step 3: Vercel Specific Configuration

Vercel uses a serverless architecture, which requires some specific adaptations:

1. **Function Timeout**: Set in `vercel.json` to handle longer video processing
2. **API Routes**: All routes are directed to the main server file
3. **Cold Starts**: First request may take longer due to serverless nature

### Step 4: Deploy and Test

1. **Deploy**: Click "Deploy" or run `vercel --prod`
2. **Monitor Build**: Watch the build logs for any errors
3. **Test Deployment**: Once deployed, test your endpoints

## 🔧 Configuration Details

### vercel.json Configuration

The `vercel.json` file in your project root configures:

- **Builds**: Specifies the entry point for your application
- **Routes**: Directs all traffic to your server file
- **Environment**: Sets production environment variables
- **Functions**: Configures function timeouts and memory

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-vercel.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server-vercel.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VERCEL": "true"
  },
  "functions": {
    "server-vercel.js": {
      "maxDuration": 30
    }
  }
}
```

### Environment Detection

Your `ytdlpManager.js` automatically detects Vercel environment and configures yt-dlp accordingly.

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app-name.vercel.app/
```

### 2. Video Info API
```bash
curl "https://your-app-name.vercel.app/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 3. Download API
```bash
curl "https://your-app-name.vercel.app/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=mp4&quality=720p"
```

## 📊 Vercel Plans Comparison

| Feature | Hobby (Free) | Pro ($20/month) | Enterprise |
|---------|-------------|-----------------|------------|
| **Deployments** | Unlimited | Unlimited | Unlimited |
| **Bandwidth** | 100GB/month | 1TB/month | Custom |
| **Serverless Functions** | 12 per project | Unlimited | Unlimited |
| **Execution Duration** | 10s | 60s | 900s |
| **Custom Domains** | ✅ | ✅ | ✅ |
| **Team Members** | ❌ | Up to 10 | Unlimited |
| **Preview Deployments** | ✅ | ✅ | ✅ |

## 🐛 Troubleshooting

### Common Issues

#### 1. Function Timeout
**Symptoms**: Request times out after 10 seconds
**Solutions**:
- Increase `maxDuration` in `vercel.json`
- Optimize video processing to complete faster
- Consider upgrading to Pro plan for longer timeouts

#### 2. Build Failures
**Symptoms**: Build fails during deployment
**Solutions**:
- Check build logs in Vercel dashboard
- Verify `package.json` dependencies
- Ensure all required files are committed to Git

#### 3. yt-dlp Not Found
**Symptoms**: "yt-dlp command not found" errors
**Solutions**:
- Vercel doesn't support binary execution in serverless functions
- Use API-based alternatives for video info extraction
- Consider using Vercel's Edge Functions for binary execution

#### 4. Memory Limits
**Symptoms**: Function crashes with memory errors
**Solutions**:
- Optimize memory usage in your code
- Process videos in smaller chunks
- Upgrade to Pro plan for higher memory limits

#### 5. Cold Start Latency
**Symptoms**: First request after inactivity is slow
**Solutions**:
- This is normal for serverless functions
- Implement a "keep-warm" strategy with scheduled pings
- Use Edge Functions for reduced cold start times

#### 6. YtDlpManager Initialize Error
**Symptoms**: `TypeError: ytdlpManager.initialize is not a function`
**Solutions**:
- This has been fixed by removing the non-existent initialize() method call
- YtDlpManager initializes automatically in its constructor
- Ensure you're using the latest server-vercel.js file
- The manager is ready to use immediately after import

### Debug Commands

Add these to your build logs for debugging:

```bash
# Check Node.js environment
node -v
npm -v

# Check PATH
echo $PATH

# List installed packages
npm list
```

## 🔒 Security Best Practices

1. **Environment Variables**: Store sensitive data in Vercel's environment variables
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

### 2. Streaming Optimization
```javascript
// Use streaming for large files
res.setHeader('Content-Type', 'video/mp4');
res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
```

## 🚀 Advanced Features

### Custom Domain Setup

1. **Add Domain**: In Vercel dashboard → Settings → Domains
2. **DNS Configuration**: Point your domain to Vercel's servers
3. **SSL Certificate**: Automatically provisioned

### Vercel Edge Functions

For improved performance and binary execution:

1. **Create Edge Function**:
   ```javascript
   // api/edge-function.js
   export const config = {
     runtime: 'edge'
   };
   ```

2. **Deploy Edge Function**:
   ```bash
   vercel --prod
   ```

## 📊 Monitoring and Analytics

### Built-in Metrics
- **Response Times**: Monitor API performance
- **Error Rates**: Track failed requests
- **Resource Usage**: CPU, memory, bandwidth
- **Build History**: Track deployments

### Custom Logging
```javascript
// Add structured logging
const logger = {
  info: (message) => console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString() })),
  error: (message, error) => console.error(JSON.stringify({ level: 'error', message, error: error.message, stack: error.stack, timestamp: new Date().toISOString() }))
};
```

## 🔄 Migration from Render.com

### Key Differences

| Aspect | Render.com | Vercel |
|--------|------------|--------|
| **Architecture** | Container-based | Serverless |
| **Execution Time** | Unlimited | Limited (10s-900s) |
| **Binary Execution** | ✅ | ❌ (Edge Functions only) |
| **Cold Starts** | Less frequent | More frequent |
| **Custom Domains** | Paid plans only | All plans |
| **Global CDN** | Limited | Extensive |

### Migration Steps

1. **Export from Render**: Download all files
2. **Create Git Repository**: Initialize and push to GitHub
3. **Update Configuration**: Use `vercel.json` instead of `render.yaml`
4. **Deploy on Vercel**: Follow setup steps above
5. **Update DNS**: Point domain to new Vercel URL

## 📞 Support and Resources

### Official Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Node.js on Vercel](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Environment Variables](https://vercel.com/docs/environment-variables)

### Community Support
- [Vercel Community](https://github.com/vercel/community)
- [Discord Server](https://vercel.com/discord)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

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

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Service Logs**: Available in your service dashboard
- **Metrics**: Built-in performance monitoring
- **Billing**: Usage and cost tracking

---

**🎊 Your video downloader is now ready for production on Vercel!**

**Key Benefits Achieved**:
- ✅ Serverless architecture for automatic scaling
- ✅ Automatic HTTPS and custom domains
- ✅ Git-based CI/CD pipeline
- ✅ Global CDN for faster response times
- ✅ Better performance for most users
- ✅ Comprehensive monitoring and logging