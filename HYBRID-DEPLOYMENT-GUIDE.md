# Hybrid Deployment Guide: Vercel Frontend + Render Backend

This guide explains how to deploy your video downloader application with the frontend on Vercel and the backend on Render.com, creating a seamless hybrid deployment.

## Architecture Overview

```
User Request → Vercel Frontend → Render Backend → Response
     ↓              ↓              ↓
 Static Files   UI/UX Layer   API Processing
 (HTML/CSS/JS)  (React-like)  (Video Download)
```

## Prerequisites

- GitHub repository with your project
- Vercel account (free tier available)
- Render.com account (free tier available)
- Your project should have both `server-render.js` and the `/public/` directory

## Step 1: Deploy Backend to Render.com

### 1.1 Create Render Service
1. Go to [Render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `your-app-name-backend` (remember this name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server-render.js`
   - **Instance Type**: `Free` (or paid for better performance)

### 1.2 Set Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
RENDER=true
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 1.3 Deploy and Get URL
- Deploy the service
- Note your Render URL: `https://your-app-name-backend.onrender.com`
- Test the backend: `https://your-app-name-backend.onrender.com/health`

## Step 2: Configure Frontend for Hybrid Deployment

### 2.1 Update API Configuration
The frontend has already been configured to detect the environment and use the appropriate backend URL. You need to update the Render URL in `/public/script.js`:

```javascript
// Find this line in /public/script.js:
const RENDER_BACKEND_URL = 'https://your-render-app-name.onrender.com';

// Replace with your actual Render URL:
const RENDER_BACKEND_URL = 'https://your-app-name-backend.onrender.com';
```

### 2.2 Update Vercel Configuration
Ensure your `vercel.json` is configured for static file serving:

```json
{
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
}
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project
1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (project root)
   - **Build Command**: Leave empty (static files only)
   - **Output Directory**: `public`
   - **Install Command**: Leave empty

### 3.2 Deploy and Test
- Deploy the project
- Get your Vercel URL: `https://your-project.vercel.app`
- Update the `FRONTEND_URL` environment variable in Render with this URL

## Step 4: Update CORS Configuration

### 4.1 Update Render Environment Variables
In your Render dashboard, update the environment variable:
```
FRONTEND_URL=https://your-project.vercel.app
```

### 4.2 Redeploy Render Service
After updating environment variables, redeploy your Render service to apply the changes.

## Step 5: Testing the Hybrid Setup

### 5.1 Test Frontend
1. Visit your Vercel URL: `https://your-project.vercel.app`
2. The interface should load correctly
3. Check browser console for any errors

### 5.2 Test API Integration
1. Try downloading a video from YouTube, TikTok, etc.
2. Check Network tab in browser dev tools
3. API calls should go to: `https://your-app-name-backend.onrender.com/api/`

### 5.3 Verify CORS
- No CORS errors should appear in browser console
- API responses should be received successfully

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in Render
   - Redeploy Render service after environment variable changes

2. **API Not Found (404)**
   - Verify the Render URL in `script.js` is correct
   - Check if Render service is running: visit `/health` endpoint

3. **Slow First Request**
   - Render free tier has cold starts (~30 seconds)
   - Consider upgrading to paid tier for better performance

4. **Environment Detection Issues**
   - Clear browser cache
   - Check browser console for JavaScript errors

### Debug Commands

```bash
# Test Render backend health
curl https://your-app-name-backend.onrender.com/health

# Test API endpoint
curl "https://your-app-name-backend.onrender.com/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## Benefits of Hybrid Deployment

1. **Cost Effective**: Use free tiers of both platforms
2. **Performance**: Vercel's global CDN for frontend, Render's optimized backend
3. **Scalability**: Each service can scale independently
4. **Reliability**: If one service is down, the other can still function partially
5. **Development**: Easy to test locally while using production backend

## Maintenance

- **Frontend Updates**: Push to GitHub → Auto-deploy on Vercel
- **Backend Updates**: Push to GitHub → Auto-deploy on Render
- **Monitor**: Check both Vercel and Render dashboards for deployment status
- **Logs**: Use Render dashboard to view backend logs for debugging

## Security Considerations

1. **CORS**: Properly configure allowed origins
2. **Rate Limiting**: Already configured in `server-render.js`
3. **Environment Variables**: Never commit sensitive data to GitHub
4. **HTTPS**: Both Vercel and Render provide HTTPS by default

---

**Next Steps**: After successful deployment, consider setting up custom domains for both services for a more professional appearance.