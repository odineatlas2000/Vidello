const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { Readable } = require('stream');

// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
console.log('✅ Facebook controller: Using centralized YtDlpManager');

/**
 * Get Facebook video information
 */
async function getVideoInfo(req, res) {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('Getting Facebook video info for URL:', url);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Facebook video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Use centralized manager to get video information
    const info = await ytdlpManager.getVideoInfo(url);
    
    console.log('Facebook video info retrieved successfully');
    
    // Format the response
    return res.json({
      platform: 'facebook',
      title: info.title || 'Facebook Video',
      thumbnail: info.thumbnail || 'https://via.placeholder.com/480x360?text=Facebook+Video',
      duration: info.duration ? Math.floor(info.duration) : 0,
      formats: [{
        quality: 'Original',
        formatId: 'best',
        hasAudio: true,
        hasVideo: true
      }]
    });
  } catch (error) {
    console.error('Facebook extraction error:', error);
    
    // Check if the error is related to IP blocking or parsing issues
    if (error.message && error.message.includes('IP address is blocked')) {
      return res.status(403).json({
        error: 'Facebook has blocked the server IP address',
        message: 'Facebook has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    } else if (error.message && error.message.includes('empty media response')) {
      return res.status(403).json({
        error: 'Facebook authentication required',
        message: 'This Facebook content requires authentication. The downloader needs to be configured with Facebook cookies to access this content.',
        details: error.message
      });
    } else if (error.message && error.message.includes('Cannot parse data')) {
      return res.status(404).json({
        error: 'Facebook video not found or inaccessible',
        message: 'The Facebook video could not be found or is not accessible. It may have been removed, set to private, or requires authentication.',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to extract Facebook video information',
      message: 'An error occurred while trying to extract information from the Facebook video.',
      details: error.message
    });
  }
}

/**
 * Download Facebook video
 */
async function downloadVideo(url, format, res, req) {
  try {
    console.log(`Downloading Facebook ${format} for URL:`, url);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Facebook video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Sanitize the filename to avoid any path traversal or invalid characters
    const timestamp = Date.now();
    const sanitizedFilename = `facebook_${timestamp}`;
    
    // Try local yt-dlp.exe first, then fallback to system yt-dlp
    let ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
    if (!fs.existsSync(ytdlpPath)) {
      try {
        const ytdlpExec = require('yt-dlp-exec');
        ytdlpPath = ytdlpExec.binaryPath || 'yt-dlp';
      } catch (e) {
        console.error('yt-dlp not available for Facebook streaming:', e.message);
        return res.status(500).json({ error: 'yt-dlp binary not available for streaming Facebook content' });
      }
    }

    console.log('Using yt-dlp binary at:', ytdlpPath);
    
    // Handle different formats
    let ytdlpProcess;
    
    if (format === 'audio') {
      // Set headers for MP3 download
      res.header('Content-Disposition', `attachment; filename="${sanitizedFilename}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      console.log('Creating Facebook audio stream (MP3)');
      
      // Create a process that extracts audio and streams to stdout
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--no-playlist',
        '--no-warnings',
        '--output', '-',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]);
    } else {
      // Default to MP4 video download
      // Set headers for MP4 download
      res.header('Content-Disposition', `attachment; filename="${sanitizedFilename}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      console.log('Creating Facebook video stream (MP4)');
      
      // Create a process that downloads video and streams to stdout
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '--format', 'best[ext=mp4]/best',
        '--no-playlist',
        '--no-warnings',
        '--output', '-',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]);
    }
    
    // Handle process events
    ytdlpProcess.on('error', (err) => {
      console.error('Facebook download process error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to download Facebook video', 
          details: err.message 
        });
      }
    });
    
    ytdlpProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Facebook video download completed successfully');
      } else {
        console.error(`Facebook download process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to download Facebook content',
            details: `Process exited with code ${code}`
          });
        }
      }
    });
    
    // Handle client disconnect
    res.on('close', () => {
      if (!ytdlpProcess.killed) {
        ytdlpProcess.kill();
      }
    });
    
    // Pipe the process stdout to response
    ytdlpProcess.stdout.pipe(res);
    
  } catch (error) {
    console.error('Error downloading Facebook video:', error);
    
    // Check if the error is related to IP blocking, authentication, or parsing issues
    if (error.message && error.message.includes('IP address is blocked')) {
      return res.status(403).json({
        error: 'Facebook has blocked the server IP address',
        message: 'Facebook has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    } else if (error.message && error.message.includes('empty media response')) {
      return res.status(403).json({
        error: 'Facebook authentication required',
        message: 'This Facebook content requires authentication. The downloader needs to be configured with Facebook cookies to access this content.',
        details: error.message
      });
    } else if (error.message && error.message.includes('Cannot parse data')) {
      return res.status(404).json({
        error: 'Facebook video not found or inaccessible',
        message: 'The Facebook video could not be found or is not accessible. It may have been removed, set to private, or requires authentication.',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to download Facebook video',
      message: 'An error occurred while trying to download the Facebook video.',
      details: error.message
    });
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};