/**
 * Vercel Serverless Function for API Root
 * Handles requests to /api
 */

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Health check response
  res.json({
    message: 'Video Downloader API is running',
    version: '2.0.0',
    endpoints: {
      '/api/video-info': 'Get video information',
      '/api/download': 'Download video'
    },
    supported_platforms: [
      'YouTube', 'Twitter/X', 'TikTok', 'Instagram', 'Facebook', 'Vimeo', 'Pinterest'
    ]
  });
};