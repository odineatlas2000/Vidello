/**
 * YT-DLP Manager Utility
 * Provides a centralized way to manage yt-dlp configuration and initialization
 */

const { detectPlatform } = require('./platformDetector');

class YtDlpManager {
  constructor() {
    this.ytDlpExec = null; // for all platforms supported by yt-dlp
    this.isInitialized = false;
    this.init();
  }

  init() {
    let anyAvailable = false;

    // Try to load @distube/ytdl-core first for YouTube (more reliable and updated)
    try {
      this.ytdlCore = require('@distube/ytdl-core');
      anyAvailable = true;
      console.log('✅ YtDlpManager: @distube/ytdl-core initialized successfully');
    } catch (error) {
      console.warn('⚠️ YtDlpManager: @distube/ytdl-core not available:', error.message);
      // Fallback to regular ytdl-core
      try {
        this.ytdlCore = require('ytdl-core');
        anyAvailable = true;
        console.log('✅ YtDlpManager: ytdl-core (fallback) initialized successfully');
      } catch (fallbackError) {
        console.warn('⚠️ YtDlpManager: ytdl-core fallback not available:', fallbackError.message);
      }
    }

    // Try to load yt-dlp-exec for other platforms
    try {
      this.ytDlpExec = require('yt-dlp-exec');
      anyAvailable = true;
      console.log('✅ YtDlpManager: yt-dlp-exec initialized successfully');
    } catch (error) {
      console.warn('⚠️ YtDlpManager: yt-dlp-exec not available:', error.message);
    }

    this.isInitialized = anyAvailable;
    console.log(`🔍 YtDlpManager: isInitialized = ${this.isInitialized}, anyAvailable = ${anyAvailable}`);
    if (!anyAvailable) {
      console.error('❌ YtDlpManager: No video downloaders available');
    }
  }

  /**
   * Get video information using the appropriate downloader based on URL
   */
  async getVideoInfo(url) {
    console.log(`Attempting to get video info for URL: ${url}`);
    if (!this.isInitialized) {
      throw new Error('No video downloader available');
    }

    const platform = detectPlatform(url);
    console.log(`Detected platform: ${platform}`);

    // Use ytdl-core for YouTube videos
    if (platform === 'youtube' && this.ytdlCore) {
      console.log(`Using ytdl-core for YouTube URL: ${url}`);
      try {
        const info = await this.ytdlCore.getInfo(url);
        console.log('ytdl-core raw result obtained');
        
        return {
          title: info.videoDetails.title,
          thumbnail: info.videoDetails.thumbnails?.[0]?.url || null,
          duration: parseInt(info.videoDetails.lengthSeconds) || 0,
          formats: info.formats.map(format => ({
            format_id: format.itag,
            ext: format.container,
            height: format.height,
            width: format.width,
            acodec: format.hasAudio ? format.audioCodec : 'none',
            vcodec: format.hasVideo ? format.videoCodec : 'none',
            filesize: format.contentLength
          }))
        };
      } catch (execError) {
        console.error('Error executing ytdl-core:', execError);
        throw new Error(`ytdl-core execution failed: ${execError.message}`);
      }
    }

    // For other platforms, use yt-dlp-exec if available
    if (this.ytDlpExec) {
      try {
        console.log(`🔍 YtDlpManager.getVideoInfo: URL=${url}, Detected platform=${platform}`);
        
        // Platform-specific headers
        let headers = [];
        if (platform === 'instagram') {
          headers = [
            'referer:https://www.instagram.com/',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          ];
          console.log('📱 Using Instagram headers');
        } else if (platform === 'vimeo') {
          headers = [
            'referer:https://vimeo.com/',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          ];
          console.log('🎬 Using Vimeo headers');
        } else {
          headers = [
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          ];
          console.log('🌐 Using default headers');
        }
        
        const options = {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true
        };
        
        if (headers.length > 0) {
          options.addHeader = headers;
        }
        
        const info = await this.ytDlpExec(url, options);
        
        return {
          title: info.title || `${platform} Video`,
          thumbnail: info.thumbnail,
          duration: info.duration,
          formats: info.formats || []
        };
      } catch (execError) {
        console.error(`Error executing yt-dlp for ${platform}:`, execError);
        throw new Error(`Failed to extract ${platform} video information: ${execError.message}`);
      }
    }
    
    throw new Error(`Platform ${platform} is not currently supported. yt-dlp-exec is not available.`);
  }

  /**
   * Check if the manager is properly initialized
   */
  isReady() {
    return Boolean(this.ytDlpExec);
  }

  /**
   * Get the type of downloader being used (summary)
   */
  getDownloaderType() {
    if (!this.isInitialized) return 'none';
    if (this.ytDlpExec) return 'yt-dlp-exec';
    return 'none';
  }

  /**
   * Check if the manager is ready to process requests
   */
  isReady() {
    console.log(`🔍 YtDlpManager.isReady(): returning ${this.isInitialized}`);
    return this.isInitialized;
  }

  /**
   * Download video using appropriate downloader
   */
  async downloadVideo(url, options = {}) {
    const platform = detectPlatform(url);
    
    if (platform === 'youtube' && this.ytdlCore) {
      // For YouTube, we can use ytdl-core streaming
      const streamOptions = {
        quality: options.quality || 'highest',
        filter: options.format === 'audio' ? 'audioonly' : 'videoandaudio'
      };
      
      return this.ytdlCore(url, streamOptions);
    }
    
    // For other platforms, return the yt-dlp-exec instance for manual handling
    if (this.ytDlpExec) {
      return this.ytDlpExec;
    }
    
    throw new Error(`No suitable downloader available for platform: ${platform}`);
  }

  /**
   * Get the raw downloader instances
   */
  getDownloader() {
    return { ytDlpExec: this.ytDlpExec };
  }
}

// Export a singleton instance
module.exports = new YtDlpManager();