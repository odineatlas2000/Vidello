const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const tiktokController = require('../controllers/tiktokController');
const instagramController = require('../controllers/instagramController');
const facebookController = require('../controllers/facebookController');
const platformDetector = require('../utils/platformDetector');

/**
 * @route   GET /api/video-info
 * @desc    Get video information based on URL
 * @access  Public
 */
router.get('/video-info', async (req, res, next) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = platformDetector.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return youtubeController.getVideoInfo(url, res);
      case 'tiktok':
        return tiktokController.getVideoInfo(url, res);
      case 'instagram':
        return instagramController.getVideoInfo(url, res);
      case 'facebook':
        return facebookController.getVideoInfo(url, res);
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;