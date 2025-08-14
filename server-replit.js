require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

// Import routes
const videoInfoRoutes = require('./routes/videoInfo');
const downloadRoutes = require('./routes/download');

const app = express();

// Replit-compatible port configuration
const PORT = process.env.PORT || 3000;

// Replit-compatible CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow Replit domains and localhost for development
    if (!origin || 
        origin.includes('.replit.dev') || 
        origin.includes('.repl.co') || 
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:')) {
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
app.use(morgan('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API routes
app.use('/api', videoInfoRoutes);
app.use('/api', downloadRoutes);

// Health check endpoint for Replit
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: 'Something went wrong on the server' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access your app at: http://localhost:${PORT}`);
  if (process.env.REPL_SLUG) {
    console.log(`🌐 Replit URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }
});

module.exports = app;