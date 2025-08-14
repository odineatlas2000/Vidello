/**
 * Twitter Controller - Replit Compatible Version
 * Handles Twitter/X video downloads and information retrieval
 */

const ytdlpManager = require('../utils/ytdlpManager');
const { formatResponse } = require('../utils/responseFormatter');

/**
 * Get Twitter video information
 */
async function getVideoInfo(req, res) {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        message: 'Please provide a Twitter URL'
      });
    }

    console.log('🐦 Getting Twitter video info for:', url);
    
    // Validate Twitter URL
    if (!isValidTwitterUrl(url)) {
      return res.status(400).json({
        error: 'Invalid Twitter URL',
        message: 'Please provide a valid Twitter/X URL'
      });
    }

    const videoInfo = await ytdlpManager.getVideoInfo(url);
    const formattedResponse = formatResponse(videoInfo, 'twitter');
    
    res.json(formattedResponse);
  } catch (error) {
    console.error('❌ Twitter info error:', error.message);
    res.status(500).json({
      error: 'Failed to get Twitter video info',
      message: 'There was an error retrieving the Twitter video information. Please try again.',
      details: error.message
    });
  }
}

/**
 * Download Twitter video
 */
async function downloadVideo(req, res) {
  try {
    const { url, format = 'mp4', quality } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        message: 'Please provide a Twitter URL'
      });
    }

    console.log('🐦 Downloading Twitter video:', { url, format, quality });
    
    // Validate Twitter URL
    if (!isValidTwitterUrl(url)) {
      return res.status(400).json({
        error: 'Invalid Twitter URL',
        message: 'Please provide a valid Twitter/X URL'
      });
    }

    // Set appropriate headers for download
    if (format === 'audio') {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="twitter_audio.mp3"');
    } else {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="twitter_video.mp4"');
    }
    
    // Set additional headers for better streaming
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const downloadOptions = {
      format: format,
      quality: quality
    };
    
    const downloadStream = await ytdlpManager.downloadVideo(url, downloadOptions);
    
    if (!downloadStream) {
      throw new Error('Failed to create download stream');
    }
    
    // Handle stream events
    downloadStream.on('error', (error) => {
      console.error('❌ Download stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Download failed',
          message: 'There was an error during the download. Please try again.',
          details: error.message
        });
      }
    });
    
    downloadStream.on('end', () => {
      console.log('✅ Twitter download completed successfully');
    });
    
    // Pipe the stream to response
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Twitter download error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to download Twitter video',
        message: 'There was an error downloading the Twitter video. Please try again.',
        details: error.message
      });
    }
  }
}

/**
 * Validate Twitter URL
 */
function isValidTwitterUrl(url) {
  const twitterPatterns = [
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/i,
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/i\/status\/\d+/i,
    /^https?:\/\/(mobile\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/i
  ];
  
  return twitterPatterns.some(pattern => pattern.test(url));
}

/**
 * Get supported formats for Twitter
 */
function getSupportedFormats() {
  return {
    video: ['mp4', 'webm'],
    audio: ['mp3', 'm4a'],
    qualities: ['144', '240', '360', '480', '720', '1080']
  };
}

module.exports = {
  getVideoInfo,
  downloadVideo,
  getSupportedFormats,
  isValidTwitterUrl
};