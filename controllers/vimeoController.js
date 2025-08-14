// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
console.log('✅ Vimeo controller: Using centralized YtDlpManager');

/**
 * Extract Vimeo URL from various formats (direct URL, iframe embed, etc.)
 */
function extractVimeoUrl(input) {
  // Decode URL if it's encoded
  let decodedInput = input;
  try {
    decodedInput = decodeURIComponent(input);
  } catch (e) {
    // If decoding fails, use original input
    decodedInput = input;
  }
  
  console.log('Extracting Vimeo URL from:', decodedInput);
  
  // If it's already a clean Vimeo URL, return it
  if (decodedInput.includes('vimeo.com/') && !decodedInput.includes('<iframe')) {
    return decodedInput;
  }
  
  // Extract from iframe embed code
  const iframeMatch = decodedInput.match(/src=["']([^"']*vimeo\.com[^"']*)["']/i);
  if (iframeMatch) {
    let vimeoUrl = iframeMatch[1];
    
    // Convert player.vimeo.com/video/ID to vimeo.com/ID
    const playerMatch = vimeoUrl.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (playerMatch) {
      const cleanUrl = `https://vimeo.com/${playerMatch[1]}`;
      console.log('Extracted clean Vimeo URL:', cleanUrl);
      return cleanUrl;
    }
    
    return vimeoUrl;
  }
  
  // Extract video ID from various Vimeo URL formats
  const idMatch = decodedInput.match(/vimeo\.com\/(\d+)/);
  if (idMatch) {
    return `https://vimeo.com/${idMatch[1]}`;
  }
  
  // If no match found, return original input
  console.log('No Vimeo URL found, returning original input');
  return decodedInput;
}

/**
 * Get Vimeo video information
 */
async function getVideoInfo(url, res) {
  try {
    // Extract clean Vimeo URL from input
    const cleanUrl = extractVimeoUrl(url);
    console.log('Getting Vimeo video info for URL:', cleanUrl);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Vimeo video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Use centralized manager to get video information
    const info = await ytdlpManager.getVideoInfo(cleanUrl);
    
    console.log('Vimeo video info retrieved successfully');
    
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
      platform: 'vimeo',
      title: info.title || 'Vimeo Video',
      thumbnail: info.thumbnail || 'https://via.placeholder.com/640x360?text=Vimeo+Video',
      duration: info.duration ? Math.floor(info.duration) : 0,
      formats: formats
    });
  } catch (error) {
    console.error('Vimeo extraction error:', error);
    
    // Check for common Vimeo errors
    if (error.message && error.message.includes('private')) {
      return res.status(403).json({
        error: 'Private Vimeo video',
        message: 'This Vimeo video is private and cannot be downloaded.',
        details: error.message
      });
    } else if (error.message && error.message.includes('password')) {
      return res.status(403).json({
        error: 'Password protected Vimeo video',
        message: 'This Vimeo video is password protected and cannot be downloaded.',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to get Vimeo video information',
      message: 'There was an error processing the Vimeo video. Please check the URL and try again.',
      details: error.message
    });
  }
}

/**
 * Download Vimeo video
 */
async function downloadVideo(url, format, quality, res) {
  try {
    // Extract clean Vimeo URL from input
    const cleanUrl = extractVimeoUrl(url);
    console.log(`Downloading Vimeo video: ${cleanUrl}, format: ${format}, quality: ${quality}`);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'Vimeo video downloader not available',
        details: 'YtDlpManager is not properly initialized'
      });
    }
    
    // Set response headers for download
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="vimeo_video.mp4"');
    
    // Prepare download options
    let downloadOptions = {
      format: 'best[ext=mp4]', // Default to best MP4 format
      output: '-' // Stream to stdout
    };
    
    // Handle quality selection
    if (quality && !isNaN(parseInt(quality, 10))) {
      const targetHeight = parseInt(quality, 10);
      downloadOptions.format = `best[height<=${targetHeight}][ext=mp4]/best[ext=mp4]`;
      console.log(`Vimeo: Requesting quality <= ${targetHeight}p`);
    } else if (format === 'audio') {
      downloadOptions.format = 'bestaudio[ext=m4a]/bestaudio';
      res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="vimeo_audio.m4a"');
    }
    
    console.log('Vimeo download options:', downloadOptions);
    
    // Get yt-dlp executable path
    const ytdlpExec = ytdlpManager.getDownloader().ytDlpExec;
    if (!ytdlpExec) {
      return res.status(500).json({
        error: 'yt-dlp not available',
        details: 'yt-dlp executable not found'
      });
    }
    
    // Spawn yt-dlp process with Vimeo-specific headers
    const ytdlpProcess = ytdlpExec.spawn(cleanUrl, {
      format: downloadOptions.format,
      output: '-',
      addHeader: [
        'referer:https://vimeo.com/',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });
    
    // Handle process events
    ytdlpProcess.on('error', (err) => {
      console.error('Vimeo download process error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to download Vimeo video', 
          details: err.message 
        });
      }
    });
    
    ytdlpProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Vimeo video download completed successfully');
      } else {
        console.error(`Vimeo download process exited with code ${code}`);
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
    console.error('Vimeo download error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download Vimeo video',
        message: 'There was an error downloading the Vimeo video. Please try again.',
        details: error.message
      });
    }
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};