// Initialize yt-dlp-exec with better configuration
let ytdlp;
try {
  const { create } = require('yt-dlp-exec');
  // Create yt-dlp instance with custom binary path
  ytdlp = create('./yt-dlp.exe');
  console.log('✅ YouTube controller: yt-dlp-exec initialized');
} catch (error) {
  console.error('❌ YouTube controller: Failed to initialize yt-dlp-exec:', error.message);
  // Fallback to ytdl-core if available
  try {
    ytdlp = require('ytdl-core');
    console.log('⚠️ YouTube controller: Using ytdl-core as fallback');
  } catch (fallbackError) {
    console.error('❌ YouTube controller: No video downloader available');
  }
}

/**
 * Get YouTube video information
 */
async function getVideoInfo(url, res) {
  try {
    if (!ytdlp) {
      return res.status(500).json({ 
        error: 'No video downloader available',
        details: 'Neither yt-dlp-exec nor ytdl-core is properly initialized'
      });
    }

    let info;
    
    // Check if we're using yt-dlp-exec or ytdl-core
    if (ytdlp.name === 'create' || typeof ytdlp === 'function') {
      // Using yt-dlp-exec
      info = await ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true
      });
      
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
    } else {
      // Using ytdl-core as fallback
      info = await ytdlp.getInfo(url);
      
      return res.json({
        platform: 'youtube',
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        duration: parseInt(info.videoDetails.lengthSeconds),
        formats: info.formats.map(format => ({
          quality: format.qualityLabel || 'Unknown',
          mimeType: format.container,
          formatId: format.itag,
          hasAudio: format.hasAudio,
          hasVideo: format.hasVideo
        }))
      });
    }
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
    
    if (!ytdlp) {
      return res.status(500).json({ 
        error: 'No video downloader available',
        details: 'Neither yt-dlp-exec nor ytdl-core is properly initialized'
      });
    }

    let info;
    let videoTitle;
    
    // Get video info first
    if (ytdlp.name === 'create' || typeof ytdlp === 'function') {
      // Using yt-dlp-exec
      info = await ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true
      });
      videoTitle = info.title.replace(/[\/\:*?"<>|]/g, '_');
    } else {
      // Using ytdl-core
      info = await ytdlp.getInfo(url);
      videoTitle = info.videoDetails.title.replace(/[\/\:*?"<>|]/g, '_');
    }
    
    console.log('Video info retrieved successfully');
    
    // Set appropriate headers based on format
    if (format === 'audio') {
      // Set headers to force download to user's download folder
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      console.log('Creating direct audio stream');
      
      // Use yt-dlp binary directly for better performance
      const path = require('path');
      const { spawn } = require('child_process');
      
      const ytdlpPath = path.join(__dirname, '../yt-dlp.exe');
      console.log('yt-dlp path:', ytdlpPath);
      
      // Create a process that streams directly to stdout
      const ytdlpProcess = spawn(ytdlpPath, [
        url,
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', '-'  // Output to stdout
      ]);
      
      // Log any errors
      ytdlpProcess.stderr.on('data', (data) => {
        console.log(`yt-dlp stderr: ${data}`);
      });
      
      // Handle process errors
      ytdlpProcess.on('error', (err) => {
        console.error('yt-dlp process error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream YouTube audio', details: err.message });
        } else {
          res.end();
        }
      });
      
      // Handle process exit
      ytdlpProcess.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        if (code !== 0 && !res.headersSent) {
          res.status(500).json({ error: 'Failed to download YouTube audio', details: `yt-dlp exited with code ${code}` });
        }
      });
      
      // Pipe stdout directly to response
      ytdlpProcess.stdout.pipe(res);
      
      // Handle client disconnect
      res.on('close', () => {
        console.log('Response closed, killing yt-dlp process');
        ytdlpProcess.kill();
      });
      
    } else {
      // Set headers to force download to user's download folder
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      // Use a simpler format string for better compatibility
      const formatString = quality ? `best[height<=${quality}][ext=mp4]/best[ext=mp4]/best` : 'best[ext=mp4]/best';
      
      console.log('Creating direct video stream with format:', formatString);
      
      // Use yt-dlp binary directly for better performance
      const path = require('path');
      const { spawn } = require('child_process');
      
      const ytdlpPath = path.join(__dirname, '../yt-dlp.exe');
      console.log('yt-dlp path:', ytdlpPath);
      
      // Create a process that streams directly to stdout
      const ytdlpProcess = spawn(ytdlpPath, [
        url,
        '-f', formatString,
        '--no-warnings',
        '--no-call-home',
        '-o', '-'  // Output to stdout
      ]);
      
      // Log any errors
      ytdlpProcess.stderr.on('data', (data) => {
        console.log(`yt-dlp stderr: ${data}`);
      });
      
      // Handle process errors
      ytdlpProcess.on('error', (err) => {
        console.error('yt-dlp process error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream YouTube video', details: err.message });
        } else {
          res.end();
        }
      });
      
      // Handle process exit
      ytdlpProcess.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        if (code !== 0 && !res.headersSent) {
          res.status(500).json({ error: 'Failed to download YouTube video', details: `yt-dlp exited with code ${code}` });
        }
      });
      
      // Pipe stdout directly to response
      ytdlpProcess.stdout.pipe(res);
      
      // Handle client disconnect
      res.on('close', () => {
        console.log('Response closed, killing yt-dlp process');
        ytdlpProcess.kill();
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