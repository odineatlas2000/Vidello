require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const ytdl = require('ytdl-core');
const axios = require('axios');

// Try to use yt-dlp-exec if available, otherwise fall back to ytdl-core
let ytdlp;
try {
  ytdlp = require('yt-dlp-exec');
} catch (error) {
  console.log('yt-dlp-exec not found, using ytdl-core only');
}

// Import route handlers
const videoInfoRoutes = require('./routes/videoInfo');
const downloadRoutes = require('./routes/download');

// Initialize express app
const app = express();

// Get port from command line arguments or environment variables
const args = process.argv.slice(2);
let port = process.env.PORT || 3000;

// Check if port is specified in command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    port = parseInt(args[i + 1], 10);
    break;
  } else if (args[i].startsWith('--port=')) {
    port = parseInt(args[i].split('=')[1], 10);
    break;
  }
}

const PORT = port;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API routes
app.use('/api', videoInfoRoutes);
app.use('/api', downloadRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});