// Use centralized YtDlpManager
const ytdlpManager = require('../utils/ytdlpManager');
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
  } catch (error) {
    console.error('YouTube extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract YouTube video information',
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

    // Get video info first to get title
    const info = await ytdlpManager.getVideoInfo(url);
    const videoTitle = info.title.replace(/[\/\:*?"<>|]/g, '_');
    
    console.log('Video info retrieved successfully');
    
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