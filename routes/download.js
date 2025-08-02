const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const tiktokController = require('../controllers/tiktokController');
const instagramController = require('../controllers/instagramController');
const facebookController = require('../controllers/facebookController');
const platformDetector = require('../utils/platformDetector');

/**
 * @route   GET /api/download
 * @desc    Download video or audio from URL
 * @access  Public
 */
router.get('/download', async (req, res, next) => {
  try {
    const { url, format, quality } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = platformDetector.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return youtubeController.downloadVideo(url, format, quality, res);
      case 'tiktok':
        return tiktokController.downloadVideo(url, format, res);
      case 'instagram':
        return instagramController.downloadVideo(url, format, res, req);
      case 'facebook':
        return facebookController.downloadVideo(url, format, res, req);
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;