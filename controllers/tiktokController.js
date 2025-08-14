const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
console.log('✅ TikTok controller: Using centralized YtDlpManager');

/**
 * Get TikTok video information
 */
async function getVideoInfo(url, res) {
  try {
    console.log('Getting TikTok video info for URL:', url);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'TikTok video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Check if the URL is a TikTok photo URL
    if (url.includes('/photo/')) {
      console.log('TikTok photo URL detected, not supported by yt-dlp');
      return res.status(400).json({
        error: 'TikTok photo URLs are not supported',
        message: 'This application only supports TikTok video URLs, not photo URLs. Please provide a TikTok video URL instead.'
      });
    }
    
    // Use centralized manager to get video information
    const info = await ytdlpManager.getVideoInfo(url);
    
    console.log('TikTok video info retrieved successfully');
    
    // Format the response
    return res.json({
      platform: 'tiktok',
      title: info.title || 'TikTok Video',
      thumbnail: info.thumbnail || 'https://via.placeholder.com/480x852?text=TikTok+Video',
      duration: info.duration ? Math.floor(info.duration) : 30,
      formats: [{
        quality: 'Original',
        formatId: 'best',
        hasAudio: true,
        hasVideo: true
      }]
    });
  } catch (error) {
    console.error('TikTok extraction error:', error);
    
    // Check if the error is related to unsupported URL
    if (error.message.includes('Unsupported URL')) {
      return res.status(400).json({
        error: 'Unsupported TikTok URL',
        message: 'The provided TikTok URL is not supported. Please ensure you are using a valid TikTok video URL.'
      });
    }
    
    // Check if the error is related to IP blocking
    if (error.message.includes('Your IP address is blocked')) {
      return res.status(403).json({
        error: 'TikTok has blocked the server IP address',
        message: 'TikTok has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to extract TikTok video information',
      details: error.message
    });
  }
}

/**
 * Download TikTok video
 */
async function downloadVideo(url, format, res) {
  try {
    console.log('Starting TikTok download process for URL:', url);
    console.log('Format:', format);
    
    // Check if the URL is a TikTok photo URL
    if (url.includes('/photo/')) {
      console.log('TikTok photo URL detected, not supported by yt-dlp');
      return res.status(400).json({
        error: 'TikTok photo URLs are not supported',
        message: 'This application only supports TikTok video URLs, not photo URLs. Please provide a TikTok video URL instead.'
      });
    }
    
    try {
      // Get video info first to get the title
      const info = await ytdlpManager.getVideoInfo(url);
      
      console.log('TikTok video info retrieved successfully');
      // Sanitize title for filename and HTTP headers - remove all non-ASCII and problematic characters
      const videoTitle = (info.title || 'tiktok_video')
        .replace(/[^a-zA-Z0-9\s\-_\.]/g, '_') // Keep only alphanumeric, spaces, hyphens, underscores, dots
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 100); // Limit length
      
      // Try local yt-dlp.exe first, then fallback to system yt-dlp
      let ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
      if (!fs.existsSync(ytdlpPath)) {
        try {
          const ytdlpExec = require('yt-dlp-exec');
          ytdlpPath = ytdlpExec.binaryPath || 'yt-dlp';
        } catch (e) {
          console.error('yt-dlp not available for TikTok streaming:', e.message);
          return res.status(500).json({ error: 'yt-dlp binary not available for streaming TikTok content' });
        }
      }
      
      console.log('Using yt-dlp binary at:', ytdlpPath);
      
      let ytdlpProcess;
      
      // Handle different formats
      if (format === 'audio') {
        // Set headers for MP3 download
        res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(videoTitle)}.mp3"`);
        res.header('Content-Type', 'audio/mpeg');
        
        console.log('Creating direct TikTok audio stream (MP3)');
        
        // Create a process that extracts audio and streams directly to stdout
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
        res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(videoTitle)}.mp4"`);
        res.header('Content-Type', 'video/mp4');
        
        console.log('Creating direct TikTok video stream (MP4)');
        
        // Create a process that streams directly to stdout with better format selection
        ytdlpProcess = spawn(ytdlpPath, [
          url,
          '-f', 'best[ext=mp4][vcodec^=avc]/best[ext=mp4]/mp4/best', // Prioritize H.264 MP4 for compatibility
          '--recode-video', 'mp4', // Force re-encode to MP4 if needed
          '--no-playlist',
          '--no-warnings',
          '-o', '-'  // Output to stdout
        ]);
      }
      
      // Log any errors
      ytdlpProcess.stderr.on('data', (data) => {
        console.log(`yt-dlp stderr: ${data}`);
        
        // Check if the error is related to IP blocking
        if (data.toString().includes('Your IP address is blocked')) {
          console.error('TikTok IP blocking detected during download');
          if (!res.headersSent) {
            res.status(403).json({
              error: 'TikTok has blocked the server IP address',
              message: 'TikTok has implemented measures to prevent scraping. Please try again later or use a different approach.'
            });
          }
          ytdlpProcess.kill();
        }
      });
    
    // Handle process errors
    ytdlpProcess.on('error', (err) => {
      console.error('yt-dlp process error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream TikTok video', details: err.message });
      } else {
        res.end();
      }
    });
    
    // Handle process exit
    ytdlpProcess.on('close', (code) => {
      console.log(`yt-dlp process exited with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Failed to download TikTok video', details: `yt-dlp exited with code ${code}` });
      }
    });
    
    // Pipe stdout directly to response
    ytdlpProcess.stdout.pipe(res);
    
    // Handle client disconnect
    res.on('close', () => {
      console.log('Response closed, killing yt-dlp process');
      ytdlpProcess.kill();
    });
      } catch (ytdlpError) {
      console.error('Error with yt-dlp during TikTok download:', ytdlpError);
      
      // Check if the error is related to IP blocking
      if (ytdlpError.message && ytdlpError.message.includes('Your IP address is blocked')) {
        return res.status(403).json({
          error: 'TikTok has blocked the server IP address',
          message: 'TikTok has implemented measures to prevent scraping. Please try again later or use a different approach.',
          details: ytdlpError.message
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to download TikTok video',
        details: ytdlpError.message
      });
    }
  } catch (error) {
    console.error('Error downloading TikTok video:', error);
    return res.status(500).json({ 
      error: 'Failed to download TikTok video',
      details: error.message
    });
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};