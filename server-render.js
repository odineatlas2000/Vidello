/**
 * Render.com Optimized Server Configuration
 * Enhanced for production deployment on Render.com
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const videoInfoRoutes = require('./routes/videoInfo');
const downloadRoutes = require('./routes/download');

// Import utilities
const YtDlpManager = require('./utils/ytdlpManager');
const ytdlpManager = new YtDlpManager();

const app = express();
const PORT = process.env.PORT || 10000; // Render.com default port

// Trust proxy for Render.com (fixes X-Forwarded-For header validation)
app.set('trust proxy', 1);

// Set environment for Render.com
process.env.RENDER = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 Starting Video Downloader Server for Render.com...');
console.log('📍 Environment:', process.env.NODE_ENV);
console.log('🌐 Port:', PORT);

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Configure this for your frontend domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint for Render.com
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Video Downloader API',
    version: '2.0.0',
    platform: 'Render.com',
    timestamp: new Date().toISOString(),
    endpoints: {
      videoInfo: '/api/video-info?url={VIDEO_URL}',
      download: '/api/download?url={VIDEO_URL}&format={FORMAT}&quality={QUALITY}'
    },
    supportedPlatforms: [
      'YouTube',
      'Twitter/X',
      'TikTok',
      'Instagram',
      'Facebook',
      'Vimeo',
      'Pinterest'
    ]
  });
});

// Health check for monitoring
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ytdlpReady: ytdlpManager.isReady()
  };
  
  res.status(ytdlpManager.isReady() ? 200 : 503).json(healthStatus);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/video-info', videoInfoRoutes);
app.use('/api/download', downloadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Please check the API documentation for available endpoints',
    availableEndpoints: {
      health: '/',
      videoInfo: '/api/video-info?url={VIDEO_URL}',
      download: '/api/download?url={VIDEO_URL}'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Initialize YtDlpManager and start server
async function startServer() {
  try {
    console.log('🔧 Initializing YtDlpManager for Render.com...');
    
    // YtDlpManager initializes automatically in constructor
    // Just check if it's ready
    if (ytdlpManager.isReady()) {
      console.log('✅ YtDlpManager initialized successfully');
    } else {
      console.warn('⚠️ YtDlpManager initialization incomplete, but server will start');
    }
    
    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 Server successfully started!');
      console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
      console.log('📱 Supported platforms:', [
        'YouTube', 'Twitter/X', 'TikTok', 'Instagram', 
        'Facebook', 'Vimeo', 'Pinterest'
      ].join(', '));
      
      // Log environment info
      console.log('📊 Environment Info:');
      console.log('   - Node.js version:', process.version);
      console.log('   - Platform:', process.platform);
      console.log('   - Architecture:', process.arch);
      console.log('   - Memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;