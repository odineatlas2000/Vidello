const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const tiktokController = require('../controllers/tiktokController');
const instagramController = require('../controllers/instagramController');
const facebookController = require('../controllers/facebookController');
const vimeoController = require('../controllers/vimeoController');
const twitterController = require('../controllers/twitterController');
const pinterestController = require('../controllers/pinterestController');
const platformDetector = require('../utils/platformDetector');

/**
 * @route   GET /api/video-info
 * @desc    Get video information based on URL
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = platformDetector.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return youtubeController.getVideoInfo(req, res);
      case 'tiktok':
        return tiktokController.getVideoInfo(req, res);
      case 'instagram':
        return instagramController.getVideoInfo(req, res);
      case 'facebook':
        return facebookController.getVideoInfo(req, res);
      case 'vimeo':
        return vimeoController.getVideoInfo(req, res);
      case 'twitter':
        return twitterController.getVideoInfo(req, res);
      case 'pinterest':
        return pinterestController.getVideoInfo(req, res);
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;