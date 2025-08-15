/**
 * Video Downloader API - Vercel Optimized Server
 * 
 * This server file is specifically optimized for Vercel's serverless environment.
 * It includes all fixes for ytdlpManager initialization and supports all video platforms.
 * 
 * Version: 2.0.0
 * Supported platforms: YouTube, Twitter/X, TikTok, Instagram, Facebook, Vimeo, Pinterest
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const YtDlpManager = require('./ytdlpManager');

// Import controllers
const youtubeController = require('./controllers/youtubeController');
const twitterController = require('./controllers/twitterController');
const tiktokController = require('./controllers/tiktokController');
const instagramController = require('./controllers/instagramController');
const facebookController = require('./controllers/facebookController');
const vimeoController = require('./controllers/vimeoController');
const pinterestController = require('./controllers/pinterestController');

// Create Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Detect Vercel environment
const isVercel = process.env.VERCEL === 'true';

// Initialize YtDlpManager (automatically initializes in constructor)
const ytdlpManager = new YtDlpManager();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // Use a more compact format for production
  app.use(morgan('tiny'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    platform: isVercel ? 'vercel' : 'node',
    supported_platforms: [
      'youtube', 'twitter', 'tiktok', 'instagram', 'facebook', 'vimeo', 'pinterest'
    ]
  };
  
  res.json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API is running',
    version: '2.0.0',
    endpoints: {
      '/api/video-info': 'Get video information',
      '/api/download': 'Download video',
      '/health': 'Health check'
    },
    documentation: '/docs'
  });
});

// Serve static files (if not on Vercel)
if (!isVercel) {
  app.use(express.static(path.join(__dirname, 'public')));
}

// API Routes
app.get('/api/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Determine which controller to use based on URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return youtubeController.getVideoInfo(req, res, ytdlpManager);
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      return twitterController.getVideoInfo(req, res, ytdlpManager);
    } else if (url.includes('tiktok.com')) {
      return tiktokController.getVideoInfo(req, res, ytdlpManager);
    } else if (url.includes('instagram.com')) {
      return instagramController.getVideoInfo(req, res, ytdlpManager);
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return facebookController.getVideoInfo(req, res, ytdlpManager);
    } else if (url.includes('vimeo.com')) {
      return vimeoController.getVideoInfo(req, res, ytdlpManager);
    } else if (url.includes('pinterest.com')) {
      return pinterestController.getVideoInfo(req, res, ytdlpManager);
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    console.error('Error in video-info endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/download', async (req, res) => {
  try {
    const { url, format, quality } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Determine which controller to use based on URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return youtubeController.downloadVideo(req, res, ytdlpManager);
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      return twitterController.downloadVideo(req, res, ytdlpManager);
    } else if (url.includes('tiktok.com')) {
      return tiktokController.downloadVideo(req, res, ytdlpManager);
    } else if (url.includes('instagram.com')) {
      return instagramController.downloadVideo(req, res, ytdlpManager);
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return facebookController.downloadVideo(req, res, ytdlpManager);
    } else if (url.includes('vimeo.com')) {
      return vimeoController.downloadVideo(req, res, ytdlpManager);
    } else if (url.includes('pinterest.com')) {
      return pinterestController.downloadVideo(req, res, ytdlpManager);
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    console.error('Error in download endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    api_version: '2.0.0',
    endpoints: {
      '/api/video-info': {
        method: 'GET',
        params: {
          url: 'Video URL (required)'
        },
        description: 'Get video information including available formats'
      },
      '/api/download': {
        method: 'GET',
        params: {
          url: 'Video URL (required)',
          format: 'Desired format (mp4, mp3, etc.)',
          quality: 'Desired quality (720p, 1080p, etc.)'
        },
        description: 'Download video in specified format and quality'
      }
    },
    supported_platforms: [
      'YouTube', 'Twitter/X', 'TikTok', 'Instagram', 'Facebook', 'Vimeo', 'Pinterest'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server if not on Vercel
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`YtDlpManager initialized successfully`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });
}

// Export for Vercel
module.exports = app;