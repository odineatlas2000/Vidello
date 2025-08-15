const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
console.log('✅ Instagram controller: Using centralized YtDlpManager');

/**
 * Get Instagram video information using yt-dlp
 */
async function getVideoInfo(req, res) {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('Fetching Instagram video info for:', url);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Instagram video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Use centralized manager to get video information
    const videoInfo = await ytdlpManager.getVideoInfo(url);
    
    // Format the response
    const formattedInfo = {
      platform: 'instagram',
      title: videoInfo.title || `Instagram Post ${videoInfo.id}`,
      thumbnail: videoInfo.thumbnail || 'https://via.placeholder.com/640x640?text=Instagram+Video',
      duration: videoInfo.duration || 0,
      formats: videoInfo.formats || []
    };
    
    return res.json(formattedInfo);
  } catch (error) {
    console.error('Instagram extraction error:', error);
    
    // Check if the error is related to IP blocking or authentication
    if (error.message && error.message.includes('IP address is blocked')) {
      return res.status(403).json({
        error: 'Instagram has blocked the server IP address',
        message: 'Instagram has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    } else if (error.message && error.message.includes('empty media response')) {
      return res.status(403).json({
        error: 'Instagram authentication required',
        message: 'This Instagram content requires authentication. The downloader needs to be configured with Instagram cookies to access this content.',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to extract Instagram video information',
      details: error.message
    });
  }
}

/**
 * Download Instagram video using yt-dlp
 */
async function downloadVideo(url, format, res, req) {
  try {
    console.log(`Downloading Instagram ${format === 'audio' ? 'audio' : 'video'} from:`, url);
    
    // Get video info to get the title for the filename
    const videoInfo = await ytdlpManager.getVideoInfo(url);
    
    // Extract video title and sanitize it for use as a filename
    const videoTitle = (videoInfo.title || `instagram_${Date.now()}`)
      .replace(/[\\\/:*?"<>|]/g, '_') // Replace invalid filename characters
      .substring(0, 100); // Limit filename length
    
    // Get the yt-dlp executable path
    const path = require('path');
    const fs = require('fs');
    
    // Try local yt-dlp.exe first, then fallback to system yt-dlp
    let ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
    if (!fs.existsSync(ytdlpPath)) {
      try {
        const ytdlpExec = require('yt-dlp-exec');
        ytdlpPath = ytdlpExec.binaryPath || 'yt-dlp';
      } catch (e) {
        console.error('yt-dlp not available for Instagram streaming:', e.message);
        return res.status(500).json({ error: 'yt-dlp binary not available for streaming Instagram content' });
      }
    }
    
    console.log('Using yt-dlp binary at:', ytdlpPath);
    
    // Initialize ytdlpProcess variable
    let ytdlpProcess;
    
    // Handle different formats
    if (format === 'audio') {
      // Set headers for MP3 download
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      console.log('Creating Instagram audio stream (MP3)');
      
      // Create a process that extracts audio and streams to stdout
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '--extract-audio',
        '--audio-format', 'mp3',
        '--no-playlist',
        '--no-warnings',
        '--add-header', 'referer:https://www.instagram.com/',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '-o', '-'  // Output to stdout
      ]);
    } else {
      // Default to MP4 video download
      // Set headers for MP4 download
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      console.log('Creating Instagram video stream (MP4)');
      
      // Create a process that streams directly to stdout
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '-f', 'best[ext=mp4]/best', // Try to get mp4 format if available
        '--no-playlist',
        '--no-warnings',
        '--add-header', 'referer:https://www.instagram.com/',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '-o', '-'  // Output to stdout
      ]);
    }
    
    // Log any errors
    ytdlpProcess.stderr.on('data', (data) => {
      const errorMessage = data.toString();
      console.error('yt-dlp error:', errorMessage);
      
      // Check if the error is related to IP blocking
      if (errorMessage.includes('IP address is blocked')) {
        // If the response headers haven't been sent yet, send an error response
        if (!res.headersSent) {
          return res.status(403).json({
            error: 'Instagram has blocked the server IP address',
            message: 'Instagram has implemented measures to prevent scraping. Please try again later or use a different approach.'
          });
        }
      }
    });
    
    // Handle process errors
    ytdlpProcess.on('error', (error) => {
      console.error('Process error:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Failed to download Instagram content',
          details: error.message
        });
      }
    });
    
    // Pipe the output directly to the response
    ytdlpProcess.stdout.pipe(res);
    
    // Handle process completion
    ytdlpProcess.on('close', (code) => {
      console.log(`yt-dlp process exited with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        return res.status(500).json({
          error: 'Failed to download Instagram content',
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
    console.error('Error downloading Instagram video:', error);
    
    // Check if the error is related to IP blocking or authentication
    if (error.message && error.message.includes('IP address is blocked')) {
      return res.status(403).json({
        error: 'Instagram has blocked the server IP address',
        message: 'Instagram has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    } else if (error.message && error.message.includes('empty media response')) {
      return res.status(403).json({
        error: 'Instagram authentication required',
        message: 'This Instagram content requires authentication. The downloader needs to be configured with Instagram cookies to access this content.',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to download Instagram video',
      details: error.message
    });
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};