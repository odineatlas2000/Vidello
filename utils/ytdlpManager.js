/**
 * YT-DLP Manager Utility - Replit Compatible Version
 * Provides a centralized way to manage yt-dlp configuration and initialization
 * Optimized for Replit's Linux environment
 */

const { detectPlatform } = require('./platformDetector');
const { spawn } = require('child_process');

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
      const ytDlpExec = require('yt-dlp-exec');
      
      // Configure yt-dlp-exec based on environment
      if (process.env.REPLIT) {
        try {
          // For Replit, try to use system yt-dlp
          if (typeof ytDlpExec.setYtDlpPath === 'function') {
            ytDlpExec.setYtDlpPath('yt-dlp');
            console.log('🔧 YtDlpManager: Configured for Replit environment with system yt-dlp');
          } else {
            console.warn('⚠️ YtDlpManager: setYtDlpPath method not available, using direct approach');
            this.useDirectYtDlp = true;
          }
        } catch (replitError) {
          console.warn('⚠️ YtDlpManager: Failed to set Replit yt-dlp path, using direct approach:', replitError.message);
          this.useDirectYtDlp = true;
        }
      } else if (process.platform === 'win32') {
        // For Windows, check if local yt-dlp.exe exists
        const path = require('path');
        const fs = require('fs');
        const localYtDlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
        if (fs.existsSync(localYtDlpPath)) {
          try {
            if (typeof ytDlpExec.setYtDlpPath === 'function') {
              ytDlpExec.setYtDlpPath(localYtDlpPath);
              console.log('🔧 YtDlpManager: Using local yt-dlp.exe for Windows');
            } else {
              console.warn('⚠️ YtDlpManager: setYtDlpPath method not available, using direct approach');
              this.useDirectYtDlp = true;
            }
          } catch (winError) {
            console.warn('⚠️ YtDlpManager: Failed to set Windows yt-dlp path, using direct approach:', winError.message);
            this.useDirectYtDlp = true;
          }
        } else {
          console.warn('⚠️ YtDlpManager: Local yt-dlp.exe not found, using direct approach');
          this.useDirectYtDlp = true;
        }
      } else {
        // For other platforms, use direct approach by default for reliability
        console.log('🔧 YtDlpManager: Using direct yt-dlp approach for maximum compatibility');
        this.useDirectYtDlp = true;
      }
      
      this.ytDlpExec = ytDlpExec;
      anyAvailable = true;
      console.log('✅ YtDlpManager: yt-dlp-exec initialized successfully');
    } catch (error) {
      console.warn('⚠️ YtDlpManager: yt-dlp-exec not available, using direct yt-dlp:', error.message);
      this.useDirectYtDlp = true;
    }

    // Always consider direct yt-dlp as available for fallback
    this.isInitialized = anyAvailable || this.useDirectYtDlp || true;
    console.log(`🔍 YtDlpManager: isInitialized = ${this.isInitialized}, useDirectYtDlp = ${this.useDirectYtDlp}`);
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

      // For other platforms or if ytdl-core fails, use yt-dlp-exec or direct yt-dlp
      if (this.ytDlpExec && !this.useDirectYtDlp) {
        try {
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
        } catch (ytDlpExecError) {
          console.warn('⚠️ yt-dlp-exec failed, falling back to direct yt-dlp:', ytDlpExecError.message);
          // Set flag to use direct approach for future calls
          this.useDirectYtDlp = true;
        }
      }

      // Fallback to direct yt-dlp for Replit
      if (this.useDirectYtDlp) {
        console.log('🎬 Using direct yt-dlp for video info');
        const info = await this.executeDirectYtDlp(url, {
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

      // Use direct yt-dlp for streaming downloads (more reliable for Replit)
      console.log('🎬 Using direct yt-dlp for download stream');
      
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
      
      // Use direct yt-dlp execution for streaming
      const stream = await this.executeDirectYtDlpStream(url, ytdlpOptions);
      return stream;

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
   * Execute yt-dlp directly for streaming downloads
   */
  async executeDirectYtDlpStream(url, options = {}) {
    return new Promise((resolve, reject) => {
      // Determine yt-dlp binary path
      let ytdlpPath = 'yt-dlp';
      
      if (process.platform === 'win32') {
        const path = require('path');
        const fs = require('fs');
        const localYtDlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
        if (fs.existsSync(localYtDlpPath)) {
          ytdlpPath = localYtDlpPath;
        } else {
          ytdlpPath = 'yt-dlp.exe';
        }
      }
      
      // Build command arguments
      const args = [url];
      
      // Add options
      if (options.output) args.push('-o', options.output);
      if (options.format) args.push('-f', options.format);
      if (options.noCheckCertificates) args.push('--no-check-certificates');
      if (options.noWarnings) args.push('--no-warnings');
      if (options.preferFreeFormats) args.push('--prefer-free-formats');
      if (options.retries) args.push('--retries', options.retries.toString());
      if (options.sleepInterval) args.push('--sleep-interval', options.sleepInterval.toString());
      
      // Add headers (properly quoted for command line)
      if (options.addHeader && Array.isArray(options.addHeader)) {
        options.addHeader.forEach(header => {
          args.push('--add-header');
          args.push(header);
        });
      }
      
      console.log(`🎬 Executing yt-dlp stream: ${ytdlpPath} ${args.join(' ')}`);
      
      try {
        const ytdlpProcess = spawn(ytdlpPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        ytdlpProcess.on('error', (error) => {
          console.error('❌ yt-dlp stream process error:', error.message);
          if (error.code === 'ENOENT') {
            reject(new Error(`yt-dlp binary not found at path: ${ytdlpPath}. Please ensure yt-dlp is installed and accessible.`));
          } else {
            reject(error);
          }
        });
        
        ytdlpProcess.stderr.on('data', (data) => {
          const errorOutput = data.toString();
          console.error('❌ yt-dlp stream stderr:', errorOutput);
        });
        
        ytdlpProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`❌ yt-dlp stream process exited with code ${code}`);
          }
        });
        
        // Return the stdout stream for piping
        resolve(ytdlpProcess.stdout);
        
      } catch (error) {
        console.error('❌ Failed to spawn yt-dlp stream process:', error.message);
        reject(error);
      }
    });
  }

  /**
   * Execute yt-dlp directly using child_process (Cross-platform fallback)
   */
  async executeDirectYtDlp(url, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [url];
      
      // Add options as command line arguments
      if (options.dumpSingleJson) args.push('--dump-single-json');
      if (options.noCheckCertificates) args.push('--no-check-certificates');
      if (options.noWarnings) args.push('--no-warnings');
      if (options.retries) args.push('--retries', options.retries.toString());
      if (options.sleepInterval) args.push('--sleep-interval', options.sleepInterval.toString());
      
      // Add headers (properly quoted for command line)
      if (options.addHeader && Array.isArray(options.addHeader)) {
        options.addHeader.forEach(header => {
          args.push('--add-header');
          args.push(header);
        });
      }
      
      // Determine the correct yt-dlp binary path based on environment
      let ytdlpPath;
      const path = require('path');
      const fs = require('fs');
      
      if (process.env.REPLIT) {
        // In Replit, use system yt-dlp
        ytdlpPath = 'yt-dlp';
        console.log('🔧 Using system yt-dlp for Replit environment');
      } else if (process.platform === 'win32') {
        // On Windows, prefer local yt-dlp.exe if it exists
        const localYtDlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
        if (fs.existsSync(localYtDlpPath)) {
          ytdlpPath = localYtDlpPath;
          console.log('🔧 Using local yt-dlp.exe for Windows');
        } else {
          // Fallback to system yt-dlp on Windows
          ytdlpPath = 'yt-dlp';
          console.log('🔧 Using system yt-dlp for Windows (local exe not found)');
        }
      } else {
        // On other platforms, use system yt-dlp
        ytdlpPath = 'yt-dlp';
        console.log('🔧 Using system yt-dlp for Unix-like system');
      }
      
      console.log('🚀 Executing direct yt-dlp:', ytdlpPath, args.slice(0, 3).join(' '), '...');
      
      const ytdlp = spawn(ytdlpPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32' // Use shell on Windows for better compatibility
      });
      
      let stdout = '';
      let stderr = '';
      
      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ytdlp.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout);
            console.log('✅ Direct yt-dlp execution successful');
            resolve(info);
          } catch (parseError) {
            console.error('❌ Failed to parse yt-dlp JSON output:', parseError.message);
            reject(new Error(`Failed to parse yt-dlp output: ${parseError.message}`));
          }
        } else {
          console.error('❌ yt-dlp execution failed:', stderr);
          reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
        }
      });
      
      ytdlp.on('error', (error) => {
        console.error('❌ Failed to spawn yt-dlp process:', error.message);
        if (error.code === 'ENOENT') {
          reject(new Error(`yt-dlp executable not found at path: ${ytdlpPath}. Please ensure yt-dlp is installed and accessible.`));
        } else {
          reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
        }
      });
    });
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