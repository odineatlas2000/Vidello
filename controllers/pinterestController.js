const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
console.log('✅ Pinterest controller: Using centralized YtDlpManager');

/**
 * Get Pinterest video information using yt-dlp
 */
async function getVideoInfo(url, res) {
  try {
    console.log('Fetching Pinterest video info for:', url);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Pinterest video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Use centralized manager to get video information
    const videoInfo = await ytdlpManager.getVideoInfo(url);
    
    // Format the response
    const formattedInfo = {
      platform: 'pinterest',
      title: videoInfo.title || `Pinterest Video ${videoInfo.id}`,
      thumbnail: videoInfo.thumbnail || 'https://via.placeholder.com/640x640?text=Pinterest+Video',
      duration: videoInfo.duration || 0,
      formats: videoInfo.formats || []
    };
    
    return res.json(formattedInfo);
  } catch (error) {
    console.error('Pinterest extraction error:', error);
    
    // Check if the error is related to IP blocking or authentication
    if (error.message && error.message.includes('IP address is blocked')) {
      return res.status(403).json({
        error: 'Pinterest has blocked the server IP address',
        message: 'Pinterest has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    } else if (error.message && error.message.includes('private')) {
      return res.status(403).json({
        error: 'Pinterest content is private',
        message: 'This Pinterest content is private and cannot be accessed.',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to extract Pinterest video information',
      details: error.message
    });
  }
}

/**
 * Download Pinterest video using yt-dlp
 */
async function downloadVideo(url, format, res, req) {
  try {
    console.log(`Starting Pinterest download process for URL: ${url}`);
    console.log(`Format: ${format || 'video'}`);
    
    // Attempt to get video info for the title
    console.log('Attempting to get video info for URL:', url);
    let videoTitle = `pinterest_${Date.now()}`;
    
    try {
      const videoInfo = await ytdlpManager.getVideoInfo(url);
      console.log('Pinterest video info retrieved successfully');
      videoTitle = videoInfo.title || videoTitle;
    } catch (infoError) {
      console.warn('Could not retrieve Pinterest video info, using default title:', infoError.message);
    }
    
    // Sanitize video title for filename
    videoTitle = videoTitle
      .replace(/[^\w\s.-]/g, '_') // Replace non-alphanumeric chars except spaces, dots, hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
    
    // Get the yt-dlp executable path
    let ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
    if (!fs.existsSync(ytdlpPath)) {
      console.error('Local yt-dlp.exe not found, trying system yt-dlp');
      ytdlpPath = 'yt-dlp';
    }
    
    console.log('Using yt-dlp binary at:', ytdlpPath);
    
    let ytdlpProcess;
    
    // Handle different formats
    if (format === 'audio') {
      // Set headers for MP3 download
      res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(videoTitle)}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      console.log('Creating direct Pinterest audio stream (MP3)');
      
      // Create a process that extracts audio and streams directly to stdout
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0', // Best quality
        '--no-playlist',
        '--no-warnings',
        '--add-header', 'referer:https://www.pinterest.com/',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '-o', '-'  // Output to stdout
      ]);
    } else {
      // Default to MP4 video download
      // Set headers for MP4 download
      res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(videoTitle)}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      console.log('Creating direct Pinterest video stream (MP4)');
      
      // Create a process that streams directly to stdout with better format selection
      ytdlpProcess = spawn(ytdlpPath, [
        url,
        '-f', 'best[ext=mp4][vcodec^=avc]/best[ext=mp4]/mp4/best', // Prioritize H.264 MP4 for compatibility
        '--recode-video', 'mp4', // Force re-encode to MP4 if needed
        '--no-playlist',
        '--no-warnings',
        '--add-header', 'referer:https://www.pinterest.com/',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '-o', '-'  // Output to stdout
      ]);
    }
      
      // Log any errors
      ytdlpProcess.stderr.on('data', (data) => {
        console.log(`yt-dlp stderr: ${data}`);
        
        // Check if the error is related to IP blocking
        if (data.toString().includes('Your IP address is blocked')) {
          console.error('Pinterest IP blocking detected during download');
          if (!res.headersSent) {
            res.status(403).json({
              error: 'Pinterest has blocked the server IP address',
              message: 'Pinterest has implemented measures to prevent scraping. Please try again later or use a different approach.'
            });
          }
          ytdlpProcess.kill();
        }
      });
    
    // Handle process errors
    ytdlpProcess.on('error', (err) => {
      console.error('Pinterest yt-dlp process error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start Pinterest download process', details: err.message });
      }
    });
    
    // Handle process exit
    ytdlpProcess.on('close', (code) => {
      console.log(`yt-dlp process exited with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Failed to download Pinterest video', details: `yt-dlp exited with code ${code}` });
      }
    });
    
    // Pipe stdout directly to response
    ytdlpProcess.stdout.pipe(res);
    
    // Handle client disconnect
    res.on('close', () => {
      console.log('Response closed, killing yt-dlp process');
      ytdlpProcess.kill();
    });
    
  } catch (error) {
    console.error('Error downloading Pinterest video:', error);
    
    // Check if the error is related to IP blocking
    if (error.message && error.message.includes('Your IP address is blocked')) {
      return res.status(403).json({
        error: 'Pinterest has blocked the server IP address',
        message: 'Pinterest has implemented measures to prevent scraping. Please try again later or use a different approach.',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to download Pinterest video',
      details: error.message
    });
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};