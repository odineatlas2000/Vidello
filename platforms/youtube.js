const ytdl = require('ytdl-core');

// Try to use yt-dlp-exec if available, otherwise fall back to ytdl-core
let ytdlp;
try {
  ytdlp = require('yt-dlp-exec');
} catch (error) {
  console.log('yt-dlp-exec not found, using ytdl-core only');
}

/**
 * Get video information using POST method
 */
async function getVideoInfo(url, res) {
  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = {
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      duration: info.videoDetails.lengthSeconds,
      formats: info.formats
        .filter(format => format.hasVideo || format.hasAudio)
        .map(format => ({
          itag: format.itag,
          quality: format.qualityLabel || (format.hasAudio && !format.hasVideo ? 'Audio Only' : 'Unknown'),
          mimeType: format.mimeType,
          hasVideo: format.hasVideo,
          hasAudio: format.hasAudio,
          contentLength: format.contentLength
        }))
    };
    return res.json({ platform: 'youtube', videoDetails });
  } catch (ytError) {
    console.error('YouTube extraction error:', ytError);
    return res.status(500).json({ error: 'Failed to extract YouTube video information. This may be due to changes on YouTube or a temporary issue. Please try again later or report this problem if it persists.' });
  }
}

/**
 * Get video information using GET method (alternative)
 */
async function getVideoInfoAlternative(url, res) {
  try {
    // If yt-dlp is available, use it
    if (ytdlp) {
      const info = await ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true
      });
      
      return res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats: info.formats.map(format => ({
          quality: format.height ? `${format.height}p` : 'Audio only',
          mimeType: format.ext,
          itag: format.format_id,
          hasAudio: format.acodec !== 'none',
          hasVideo: format.vcodec !== 'none'
        }))
      });
    } else {
      // Fall back to ytdl-core
      const info = await ytdl.getInfo(url);
      return res.json({
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0].url,
        duration: info.videoDetails.lengthSeconds,
        formats: info.formats
          .filter(format => format.hasVideo || format.hasAudio)
          .map(format => ({
            itag: format.itag,
            quality: format.qualityLabel || (format.hasAudio && !format.hasVideo ? 'Audio only' : 'Unknown'),
            mimeType: format.mimeType,
            hasAudio: format.hasAudio,
            hasVideo: format.hasVideo
          }))
      });
    }
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    return res.status(500).json({ 
      error: 'Failed to extract YouTube video information. This may be due to changes on YouTube or a temporary issue. Please try again later or report this problem if it persists.' 
    });
  }
}

/**
 * Download YouTube video
 */
async function downloadVideo(url, quality, res) {
  try {
    const info = await ytdl.getInfo(url);
    let format;
    
    // Select format based on quality parameter
    if (quality === 'audio') {
      format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
      res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp3"`);
    } else {
      format = ytdl.chooseFormat(info.formats, { quality: quality || 'highest' });
      res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`);
    }
    
    ytdl(url, { format: format }).pipe(res);
  } catch (error) {
    console.error('Error downloading YouTube video:', error);
    return res.status(500).json({ error: 'Failed to download YouTube video', details: error.message });
  }
}

module.exports = {
  getVideoInfo,
  getVideoInfoAlternative,
  downloadVideo
};