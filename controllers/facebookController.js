const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Get Facebook video information
 */
async function getVideoInfo(url, res) {
  try {
    console.log('Getting Facebook video info for URL:', url);
    
    // Use yt-dlp to get video information
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true
    });
    
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
    
    // Sanitize the filename to avoid any path traversal or invalid characters
    const timestamp = Date.now();
    const sanitizedFilename = `facebook_${timestamp}`;
    
    // Get the path to the yt-dlp executable
    const path = require('path');
    const { spawn } = require('child_process');
    const ytdlpPath = path.join(__dirname, '../node_modules/yt-dlp-exec/bin/yt-dlp');
    
    // Initialize ytdlpProcess variable
    let ytdlpProcess;
    
    // Handle different formats
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
        '--audio-quality', '0', // Best quality
        '--no-playlist',
        '--no-warnings',
        '-o', '-'  // Output to stdout
      ]);
    } else {
      // Default to MP4 video download
      // Set headers for MP4 download
      res.header('Content-Disposition', `attachment; filename="${sanitizedFilename}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      console.log('Creating Facebook video stream (MP4)');
      
      // Create a process that streams directly to stdout
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '-f', 'best[ext=mp4]/best', // Try to get mp4 format if available
        '--no-playlist',
        '--no-warnings',
        '-o', '-'  // Output to stdout
      ]);
    }
    
    // Log any errors
    ytdlpProcess.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
      
      // Check if the error is related to IP blocking
      if (data.toString().includes('IP address is blocked')) {
        console.error('Facebook IP blocking detected during download');
        if (!res.headersSent) {
          res.status(403).json({
            error: 'Facebook has blocked the server IP address',
            message: 'Facebook has implemented measures to prevent scraping. Please try again later or use a different approach.'
          });
        }
      }
    });
    
    // Handle process errors
    ytdlpProcess.on('error', (err) => {
      console.error('yt-dlp process error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download Facebook content', details: err.message });
      } else {
        res.end();
      }
    });
    
    // Pipe the output directly to the response
    ytdlpProcess.stdout.pipe(res);
    
    // Handle process completion
    ytdlpProcess.on('close', (code) => {
      console.log(`yt-dlp process exited with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        return res.status(500).json({
          error: 'Failed to download Facebook content',
          details: `Process exited with code ${code}`
        });
      }
    });
    
    // Handle client disconnect
    req.on('close', () => {
      if (ytdlpProcess) {
        console.log('Client disconnected, killing yt-dlp process');
        ytdlpProcess.kill();
      }
    });
    
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