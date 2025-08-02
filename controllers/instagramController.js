const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const ytdlp = require('yt-dlp-exec');

/**
 * Get Instagram video information using yt-dlp
 */
async function getVideoInfo(url, res) {
  try {
    console.log('Fetching Instagram video info for:', url);
    
    // Use yt-dlp to get video information
    const videoInfo = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true
    });
    
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
    const videoInfo = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true
    });
    
    // Extract video title and sanitize it for use as a filename
    const videoTitle = (videoInfo.title || `instagram_${videoInfo.id}`)
      .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid filename characters
      .substring(0, 100); // Limit filename length
    
    // Get the path to the yt-dlp executable
    const ytdlpPath = path.resolve('./node_modules/yt-dlp-exec/bin/yt-dlp');
    
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