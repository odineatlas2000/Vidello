/**
 * YT-DLP Manager Utility
 * Provides a centralized way to manage yt-dlp configuration and initialization
 */

class YtDlpManager {
  constructor() {
    this.ytdlp = null;
    this.isYtDlpExec = false;
    this.isInitialized = false;
    this.init();
  }

  init() {
    try {
      // Try to use yt-dlp-exec first
      const { create } = require('yt-dlp-exec');
      this.ytdlp = create('./yt-dlp.exe');
      this.isYtDlpExec = true;
      this.isInitialized = true;
      console.log('✅ YtDlpManager: yt-dlp-exec initialized successfully');
    } catch (error) {
      console.log('⚠️ YtDlpManager: yt-dlp-exec not available, trying ytdl-core...');
      
      try {
        // Fallback to ytdl-core
        this.ytdlp = require('ytdl-core');
        this.isYtDlpExec = false;
        this.isInitialized = true;
        console.log('✅ YtDlpManager: ytdl-core initialized as fallback');
      } catch (fallbackError) {
        console.error('❌ YtDlpManager: No video downloader available');
        this.isInitialized = false;
      }
    }
  }

  /**
   * Get video information using the available downloader
   */
  async getVideoInfo(url) {
    if (!this.isInitialized) {
      throw new Error('No video downloader available');
    }

    if (this.isYtDlpExec) {
      // Using yt-dlp-exec
      const info = await this.ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true
      });

      return {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats: info.formats || []
      };
    } else {
      // Using ytdl-core
      const info = await this.ytdlp.getInfo(url);
      
      return {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        duration: parseInt(info.videoDetails.lengthSeconds),
        formats: info.formats || []
      };
    }
  }

  /**
   * Check if the manager is properly initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get the type of downloader being used
   */
  getDownloaderType() {
    if (!this.isInitialized) return 'none';
    return this.isYtDlpExec ? 'yt-dlp-exec' : 'ytdl-core';
  }

  /**
   * Get the raw downloader instance
   */
  getDownloader() {
    return this.ytdlp;
  }
}

// Export a singleton instance
module.exports = new YtDlpManager();