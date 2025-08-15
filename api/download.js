/**
 * Vercel Serverless Function for Video Download API
 * Handles requests to /api/download
 */

const YtDlpManager = require('../ytdlpManager');

// Import controllers
const youtubeController = require('../controllers/youtubeController');
const twitterController = require('../controllers/twitterController');
const tiktokController = require('../controllers/tiktokController');
const instagramController = require('../controllers/instagramController');
const facebookController = require('../controllers/facebookController');
const vimeoController = require('../controllers/vimeoController');
const pinterestController = require('../controllers/pinterestController');

// Initialize YtDlpManager (automatically initializes in constructor)
const ytdlpManager = new YtDlpManager();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { url, format, quality } = req.query;
    
    if (!url) {
      res.status(400).json({ error: 'URL parameter is required' });
      return;
    }
    
    // Create a mock request/response object for controllers
    const mockReq = { query: req.query };
    
    // Create a custom response object that can handle streaming
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value),
      attachment: (filename) => {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return mockRes;
      },
      end: () => res.end(),
      write: (data) => res.write(data),
      on: (event, callback) => res.on(event, callback)
    };
    
    // Determine which controller to use based on URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return await youtubeController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      return await twitterController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else if (url.includes('tiktok.com')) {
      return await tiktokController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else if (url.includes('instagram.com')) {
      return await instagramController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return await facebookController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else if (url.includes('vimeo.com')) {
      return await vimeoController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else if (url.includes('pinterest.com')) {
      return await pinterestController.downloadVideo(mockReq, mockRes, ytdlpManager);
    } else {
      res.status(400).json({ error: 'Unsupported platform' });
      return;
    }
  } catch (error) {
    console.error('Error in download endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};