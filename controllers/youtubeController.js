// Use centralized YtDlpManager
const YtDlpManager = require('../utils/ytdlpManager');
const ytdlpManager = new YtDlpManager();
console.log('✅ YouTube controller: Using centralized YtDlpManager');

/**
 * Get YouTube video information
 */
async function getVideoInfo(req, res) {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'No video downloader available',
        details: 'YtDlpManager is not properly initialized'
      });
    }

    try {
      // Use centralized manager to get video info
      const info = await ytdlpManager.getVideoInfo(url);
      
      return res.json({
        platform: 'youtube',
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats: info.formats ? info.formats.map(format => ({
          quality: format.height ? `${format.height}p` : 'Audio only',
          mimeType: format.ext,
          formatId: format.format_id,
          hasAudio: format.acodec !== 'none',
          hasVideo: format.vcodec !== 'none'
        })) : []
      });
    } catch (ytdlpError) {
      console.error('yt-dlp failed:', ytdlpError.message);
      
      // Check if it's an authentication error (bot detection)
      if (ytdlpError.message.includes('Sign in to confirm you\'re not a bot') || 
          ytdlpError.message.includes('cookies') ||
          ytdlpError.message.includes('authentication')) {
        console.log('🔄 Authentication error detected, trying ytdl-core fallback...');
        
        try {
          // Fallback to ytdl-core for basic info
          const ytdlCore = require('@distube/ytdl-core');
          const info = await ytdlCore.getInfo(url);
          
          return res.json({
            platform: 'youtube',
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0]?.url,
            duration: info.videoDetails.lengthSeconds,
            formats: info.formats
              .filter(format => format.hasVideo || format.hasAudio)
              .map(format => ({
                quality: format.qualityLabel || (format.hasAudio && !format.hasVideo ? 'Audio Only' : 'Unknown'),
                mimeType: format.mimeType,
                formatId: format.itag,
                hasAudio: format.hasAudio,
                hasVideo: format.hasVideo
              }))
          });
        } catch (fallbackError) {
          console.error('ytdl-core fallback also failed:', fallbackError.message);
          throw ytdlpError; // Throw original error
        }
      } else {
        throw ytdlpError; // Re-throw non-authentication errors
      }
    }
  } catch (error) {
    console.error('YouTube extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract YouTube video information. This may be due to YouTube\'s bot detection. Please try again later.',
      details: error.message
    });
  }
}

/**
 * Download YouTube video
 */
async function downloadVideo(url, format, quality, res) {
  try {
    console.log('Starting download process for URL:', url);
    console.log('Format:', format, 'Quality:', quality);
    
    if (!ytdlpManager.isReady()) {
      return res.status(500).json({ 
        error: 'No video downloader available',
        details: 'YtDlpManager is not properly initialized'
      });
    }

    let info;
    let videoTitle;
    
    try {
      // Get video info first to get title
      info = await ytdlpManager.getVideoInfo(url);
      videoTitle = info.title.replace(/[\/\:*?"<>|]/g, '_');
      console.log('Video info retrieved successfully via yt-dlp');
    } catch (ytdlpError) {
      console.error('yt-dlp failed for video info:', ytdlpError.message);
      
      // Check if it's an authentication error (bot detection)
      if (ytdlpError.message.includes('Sign in to confirm you\'re not a bot') || 
          ytdlpError.message.includes('cookies') ||
          ytdlpError.message.includes('authentication')) {
        console.log('🔄 Authentication error detected, using ytdl-core for download...');
        
        try {
          // Fallback to ytdl-core for info
          const ytdlCore = require('@distube/ytdl-core');
          const fallbackInfo = await ytdlCore.getInfo(url);
          videoTitle = fallbackInfo.videoDetails.title.replace(/[\/\:*?"<>|]/g, '_');
          console.log('Video info retrieved successfully via ytdl-core fallback');
        } catch (fallbackError) {
          console.error('ytdl-core fallback also failed:', fallbackError.message);
          throw new Error('Both yt-dlp and ytdl-core failed to get video information. YouTube may be blocking requests.');
        }
      } else {
        throw ytdlpError; // Re-throw non-authentication errors
      }
    }
    
    // Set appropriate headers based on format
    if (format === 'audio') {
      // Set headers to force download to user's download folder
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      console.log('Creating direct audio stream using ytdl-core');
      
      // Use ytdl-core for audio streaming
      const ytdlCore = require('@distube/ytdl-core');
      
      // Create audio stream with ytdl-core
      const audioStream = ytdlCore(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        format: 'mp4'
      });
      
      // Handle stream errors
      audioStream.on('error', (err) => {
        console.error('ytdl-core audio stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream YouTube audio', details: err.message });
        } else {
          res.end();
        }
      });
      
      // Handle stream end
      audioStream.on('end', () => {
        console.log('Audio stream ended successfully');
      });
      
      // Pipe audio stream directly to response
      audioStream.pipe(res);
      
      // Handle client disconnect
      res.on('close', () => {
        console.log('Response closed, destroying audio stream');
        audioStream.destroy();
      });
      
    } else {
      // Set headers to force download to user's download folder
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      // Determine video quality for ytdl-core
      let streamOptions = {
        filter: 'videoandaudio',
        format: 'mp4'
      };
      
      if (!quality || quality === 'highest') {
        streamOptions.quality = 'highest';
      } else if (quality === 'lowest') {
        streamOptions.quality = 'lowest';
      } else if (!isNaN(parseInt(quality, 10))) {
        // For specific quality numbers, use a more precise approach
        const targetHeight = parseInt(quality, 10);
        
        // First try to get formats with both video and audio at exact or closest quality
        streamOptions.filter = (format) => {
          if (!format.hasVideo || !format.height) return false;
          
          // Prioritize formats with both video and audio
          if (format.hasAudio) {
            // Exact match gets highest priority
            if (format.height === targetHeight) return true;
            // Close matches within reasonable range
            if (format.height <= targetHeight && format.height >= targetHeight - 240) return true;
          }
          
          return false;
        };
        
        streamOptions.quality = 'highest';
        console.log(`YouTube: Filtering for video+audio quality at or near ${targetHeight}p`);
      } else {
        streamOptions.quality = 'highest';
      }
      
      console.log('Creating direct video stream using ytdl-core with options:', streamOptions);
      
      // Use ytdl-core for video streaming
      const ytdlCore = require('@distube/ytdl-core');
      
      // Log available formats for debugging and check if we need fallback
       try {
         const info = await ytdlCore.getInfo(url);
         const availableFormats = info.formats
           .filter(f => f.hasVideo && f.height)
           .map(f => ({ 
             height: f.height, 
             quality: f.qualityLabel, 
             itag: f.itag, 
             hasAudio: f.hasAudio,
             bitrate: f.bitrate || 'N/A',
             fps: f.fps || 'N/A'
           }))
           .sort((a, b) => b.height - a.height);
         console.log('Available video formats:', availableFormats.slice(0, 10)); // Show top 10
         
         if (streamOptions.filter && typeof streamOptions.filter === 'function') {
           const filteredFormats = info.formats.filter(streamOptions.filter)
             .filter(f => f.hasVideo && f.height)
             .map(f => ({ 
               height: f.height, 
               quality: f.qualityLabel, 
               itag: f.itag, 
               hasAudio: f.hasAudio,
               bitrate: f.bitrate || 'N/A',
               fps: f.fps || 'N/A'
             }))
             .sort((a, b) => b.height - a.height);
           console.log('Filtered formats that match criteria:', filteredFormats);
           
           // If no formats found with custom filter, use videoandaudio as fallback
           if (filteredFormats.length === 0) {
             console.log('No formats found with custom filter, using videoandaudio fallback');
             streamOptions.filter = 'videoandaudio';
           }
         } else if (streamOptions.filter === 'videoandaudio') {
           console.log('Using videoandaudio filter - will show combined video+audio formats');
         }
       } catch (err) {
         console.log('Could not log format details:', err.message);
       }
      
      // Create video stream with ytdl-core
      const videoStream = ytdlCore(url, streamOptions);
      
      // Handle stream errors
      videoStream.on('error', (err) => {
        console.error('ytdl-core video stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream YouTube video', details: err.message });
        } else {
          res.end();
        }
      });
      
      // Handle stream end
      videoStream.on('end', () => {
        console.log('Video stream ended successfully');
      });
      
      // Pipe video stream directly to response
      videoStream.pipe(res);
      
      // Handle client disconnect
      res.on('close', () => {
        console.log('Response closed, destroying video stream');
        videoStream.destroy();
      });
    }
  } catch (error) {
    console.error('Error downloading YouTube video:', error);
    res.status(500).json({ error: 'Failed to download YouTube video', details: error.message });
  }
}

module.exports = {
  getVideoInfo,
  downloadVideo
};