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
        } else if (platform === 'twitter') {
          headers = [
            'referer:https://x.com/',
            'origin:https://x.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language:en-US,en;q=0.9',
            'accept-encoding:gzip, deflate, br',
            'sec-ch-ua:"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile:?0',
            'sec-ch-ua-platform:"Windows"',
            'sec-fetch-dest:document',
            'sec-fetch-mode:navigate',
            'sec-fetch-site:none',
            'sec-fetch-user:?1',
            'upgrade-insecure-requests:1'
          ];
          console.log('🐦 Using enhanced Twitter/X headers');
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
        
        // Platform-specific options
        if (platform === 'twitter') {
          options.retries = 5;
          options.fragmentRetries = 5;
          options.skipUnavailableFragments = true;
          options.ignoreErrors = false;
          options.sleepInterval = 1;
          options.maxSleepInterval = 5;
          console.log('🐦 Using enhanced Twitter-specific options');
        }
        
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
    console.log(`🎬 YtDlpManager.downloadVideo: URL=${url}, Platform=${platform}`);
    
    if (platform === 'youtube' && this.ytdlCore) {
      // For YouTube, we can use ytdl-core streaming
      const streamOptions = {
        quality: options.quality || 'highest',
        filter: options.format === 'audio' ? 'audioonly' : 'videoandaudio'
      };
      
      return this.ytdlCore(url, streamOptions);
    }
    
    // For other platforms, use yt-dlp-exec with streaming
    if (this.ytDlpExec) {
      console.log(`🔧 Using yt-dlp-exec for ${platform} download`);
      
      // Prepare yt-dlp options
      const ytdlpOptions = {
        output: '-', // Stream to stdout
        format: options.format || 'best[ext=mp4]/best',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true
      };
      
      // Add platform-specific headers
       if (platform === 'twitter') {
         ytdlpOptions.addHeader = [
           'referer:https://x.com/',
           'origin:https://x.com',
           'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
           'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
           'sec-ch-ua:"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
           'sec-fetch-dest:document',
           'sec-fetch-mode:navigate',
           'sec-fetch-site:none'
         ];

         ytdlpOptions.retries = 5;
         ytdlpOptions.sleepInterval = 1;
       }
      
      console.log('🎯 yt-dlp download options:', ytdlpOptions);
      
      // Create and return the download stream using yt-dlp-exec directly
      // Use the exec method with proper streaming
      const ytdlpExec = require('yt-dlp-exec');
      const { spawn } = require('child_process');
      const path = require('path');
      
      // Use the bundled yt-dlp.exe from the project root
      const ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
      
      // Build command arguments for download
      const args = [url];
      
      // Add format
      if (ytdlpOptions.format) {
        args.push('--format', ytdlpOptions.format);
      }
      
      // Add output to stdout
      if (ytdlpOptions.output) {
        args.push('--output', ytdlpOptions.output);
      }
      
      // Add headers
      if (ytdlpOptions.addHeader && Array.isArray(ytdlpOptions.addHeader)) {
        ytdlpOptions.addHeader.forEach(header => {
          args.push('--add-header', header);
        });
      }
      
      // Add boolean options
      if (ytdlpOptions.noCheckCertificates) args.push('--no-check-certificates');
      if (ytdlpOptions.noWarnings) args.push('--no-warnings');
      if (ytdlpOptions.preferFreeFormats) args.push('--prefer-free-formats');
      
      // Add retry options
      if (ytdlpOptions.retries) {
        args.push('--retries', ytdlpOptions.retries.toString());
      }
      if (ytdlpOptions.sleepInterval) {
        args.push('--sleep-interval', ytdlpOptions.sleepInterval.toString());
      }
      
      console.log('🎯 Spawning yt-dlp with args:', args);
      
      const downloadProcess = spawn(ytdlpPath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      return downloadProcess.stdout;
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