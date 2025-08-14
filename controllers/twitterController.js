// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
console.log('✅ Twitter controller: Using centralized YtDlpManager');

/**
 * Get Twitter video information
 */
async function getVideoInfo(url, res) {
  try {
    console.log('Getting Twitter video info for URL:', url);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Twitter video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Use centralized manager to get video information
    const info = await ytdlpManager.getVideoInfo(url);
    
    console.log('Twitter video info retrieved successfully');
    
    // Format the response with available formats
    const formats = [];
    if (info.formats && info.formats.length > 0) {
      // Extract unique quality options
      const qualitySet = new Set();
      info.formats.forEach(format => {
        if (format.height && format.hasVideo) {
          qualitySet.add(`${format.height}p`);
        }
      });
      
      // Convert to format objects
      Array.from(qualitySet).sort((a, b) => {
        const aHeight = parseInt(a);
        const bHeight = parseInt(b);
        return bHeight - aHeight; // Descending order
      }).forEach(quality => {
        formats.push({
          quality: quality,
          formatId: quality.replace('p', ''),
          hasAudio: true,
          hasVideo: true
        });
      });
    }
    
    // Add default format if no specific formats found
    if (formats.length === 0) {
      formats.push({
        quality: 'Best Available',
        formatId: 'best',
        hasAudio: true,
        hasVideo: true
      });
    }
    
    return res.json({
      platform: 'twitter',
      title: info.title || 'Twitter Video',
      thumbnail: info.thumbnail || 'https://via.placeholder.com/640x360?text=Twitter+Video',
      duration: info.duration ? Math.floor(info.duration) : 0,
      formats: formats
    });
  } catch (error) {
    console.error('Twitter extraction error:', error);
    
    // Check for common Twitter errors
    if (error.message && error.message.includes('private')) {
      return res.status(403).json({
        error: 'Private Twitter account',
        message: 'This Twitter account is private and the video cannot be downloaded.',
        details: error.message
      });
    } else if (error.message && error.message.includes('suspended')) {
      return res.status(403).json({
        error: 'Suspended Twitter account',
        message: 'This Twitter account has been suspended.',
        details: error.message
      });
    } else if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Twitter video not found',
        message: 'The Twitter video was not found. It may have been deleted.',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to get Twitter video information',
      message: 'There was an error processing the Twitter video. Please check the URL and try again.',
      details: error.message
    });
  }
}

/**
 * Download Twitter video
 */
async function downloadVideo(url, format, quality, res) {
  try {
    console.log(`Downloading Twitter video: ${url}, format: ${format}, quality: ${quality}`);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Twitter video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Set response headers for download
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="twitter_video.mp4"');
    
    // Prepare download options
    let downloadOptions = {
      format: 'best[ext=mp4]', // Default to best MP4 format
      output: '-' // Stream to stdout
    };
    
    // Handle quality selection and set response headers
    if (quality && !isNaN(parseInt(quality, 10))) {
      const targetHeight = parseInt(quality, 10);
      downloadOptions.format = `best[height<=${targetHeight}][ext=mp4]/best[ext=mp4]`;
      console.log(`Twitter: Requesting quality <= ${targetHeight}p`);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="twitter_video.mp4"');
    } else if (format === 'audio') {
      downloadOptions.format = 'bestaudio[ext=m4a]/bestaudio';
      res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="twitter_audio.m4a"');
    } else {
      // Default video download
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="twitter_video.mp4"');
    }
    
    console.log('Twitter download options:', downloadOptions);
    
    // Use centralized manager to download
    const downloadStream = await ytdlpManager.downloadVideo(url, downloadOptions);
    
    // Handle stream events
    downloadStream.on('error', (err) => {
      console.error('Twitter download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to download Twitter video', 
          details: err.message 
        });
      }
    });
    
    downloadStream.on('end', () => {
      console.log('Twitter video download completed');
    });
    
    // Pipe the stream to response
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('Twitter download error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download Twitter video',
        message: 'There was an error downloading the Twitter video. Please try again.',
        details: error.message
      });
    }
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};