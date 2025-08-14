/**
 * YT-DLP Manager Utility - Replit Compatible Version
 * Provides a centralized way to manage yt-dlp configuration and initialization
 * Optimized for Replit's Linux environment
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

    // Try to load yt-dlp-exec for other platforms (Replit compatible)
    try {
      const ytDlpExec = require('yt-dlp-exec');
      // For Replit, configure to use system yt-dlp
      if (process.env.REPLIT) {
        // Set the binary path to system yt-dlp for Replit
        ytDlpExec.setYtDlpPath('yt-dlp');
        console.log('🔧 YtDlpManager: Configured for Replit environment with system yt-dlp');
      }
      this.ytDlpExec = ytDlpExec;
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
   * Get video information using appropriate downloader
   */
  async getVideoInfo(url) {
    if (!this.isInitialized) {
      throw new Error('YtDlpManager not initialized');
    }

    const platform = detectPlatform(url);
    console.log(`🎯 Getting video info for ${platform} URL: ${url}`);

    try {
      // For YouTube, prefer ytdl-core if available
      if (platform === 'youtube' && this.ytdlCore) {
        console.log('📺 Using ytdl-core for YouTube info');
        const info = await this.ytdlCore.getInfo(url);
        return this.formatYtdlCoreInfo(info);
      }

      // For other platforms or if ytdl-core fails, use yt-dlp-exec
      if (this.ytDlpExec) {
        console.log('🎬 Using yt-dlp-exec for video info');
        const info = await this.ytDlpExec(url, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          addHeader: this.getHeadersForPlatform(platform),
          retries: 3,
          sleepInterval: 1
        });
        return this.formatYtDlpInfo(info);
      }

      throw new Error('No suitable downloader available');
    } catch (error) {
      console.error(`❌ Error getting video info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download video stream (Replit compatible)
   */
  async downloadVideo(url, options = {}) {
    if (!this.isInitialized) {
      throw new Error('YtDlpManager not initialized');
    }

    const platform = detectPlatform(url);
    console.log(`🎯 Downloading video for ${platform} URL: ${url}`);

    try {
      // For YouTube, prefer ytdl-core if available and no specific quality requested
      if (platform === 'youtube' && this.ytdlCore && !options.quality) {
        console.log('📺 Using ytdl-core for YouTube download');
        return this.ytdlCore(url, {
          quality: options.format === 'audio' ? 'highestaudio' : 'highest',
          filter: options.format === 'audio' ? 'audioonly' : 'videoandaudio'
        });
      }

      // Use yt-dlp-exec for other platforms or specific quality requests
      if (this.ytDlpExec) {
        console.log('🎬 Using yt-dlp-exec for download');
        
        const ytdlpOptions = {
          output: '-', // Stream to stdout
          format: this.getFormatForPlatform(platform, options),
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: this.getHeadersForPlatform(platform),
          retries: 5,
          sleepInterval: 1
        };

        console.log('🎯 yt-dlp download options:', ytdlpOptions);
        
        // Use yt-dlp-exec's streaming capability
        const stream = this.ytDlpExec.raw(url, ytdlpOptions);
        return stream;
      }

      throw new Error('No suitable downloader available');
    } catch (error) {
      console.error(`❌ Error downloading video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get appropriate headers for each platform
   */
  getHeadersForPlatform(platform) {
    const commonHeaders = [
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-ch-ua:"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-fetch-dest:document',
      'sec-fetch-mode:navigate',
      'sec-fetch-site:none'
    ];

    switch (platform) {
      case 'twitter':
        return [
          ...commonHeaders,
          'referer:https://x.com/',
          'origin:https://x.com'
        ];
      case 'instagram':
        return [
          ...commonHeaders,
          'referer:https://www.instagram.com/',
          'origin:https://www.instagram.com'
        ];
      case 'tiktok':
        return [
          ...commonHeaders,
          'referer:https://www.tiktok.com/',
          'origin:https://www.tiktok.com'
        ];
      case 'facebook':
        return [
          ...commonHeaders,
          'referer:https://www.facebook.com/',
          'origin:https://www.facebook.com'
        ];
      default:
        return commonHeaders;
    }
  }

  /**
   * Get appropriate format string for each platform
   */
  getFormatForPlatform(platform, options = {}) {
    if (options.format === 'audio') {
      return 'bestaudio/best';
    }

    if (options.quality) {
      return `best[height<=${options.quality}][ext=mp4]/best[ext=mp4]/best`;
    }

    switch (platform) {
      case 'twitter':
        return 'best[ext=mp4]/best';
      case 'instagram':
        return 'best[ext=mp4]/best';
      case 'tiktok':
        return 'best[ext=mp4]/best';
      case 'facebook':
        return 'best[ext=mp4]/best';
      case 'youtube':
        return 'best[ext=mp4]/best';
      default:
        return 'best[ext=mp4]/best';
    }
  }

  /**
   * Format ytdl-core info to standard format
   */
  formatYtdlCoreInfo(info) {
    return {
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails?.[0]?.url,
      uploader: info.videoDetails.author?.name,
      view_count: parseInt(info.videoDetails.viewCount),
      formats: info.formats.map(format => ({
        format_id: format.itag?.toString(),
        ext: format.container,
        quality: format.qualityLabel,
        filesize: format.contentLength ? parseInt(format.contentLength) : null,
        url: format.url
      }))
    };
  }

  /**
   * Format yt-dlp info to standard format
   */
  formatYtDlpInfo(info) {
    return {
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      uploader: info.uploader || info.channel,
      view_count: info.view_count,
      formats: info.formats?.map(format => ({
        format_id: format.format_id,
        ext: format.ext,
        quality: format.quality || format.height ? `${format.height}p` : 'unknown',
        filesize: format.filesize,
        url: format.url
      })) || []
    };
  }

  /**
   * Check if manager is ready to use
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get available downloaders
   */
  getAvailableDownloaders() {
    const downloaders = [];
    if (this.ytdlCore) downloaders.push('ytdl-core');
    if (this.ytDlpExec) downloaders.push('yt-dlp-exec');
    return downloaders;
  }
}

// Export singleton instance
module.exports = new YtDlpManager();