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
          console.warn('⚠️ YtDlpManager: Replit configuration failed:', replitError.message);
          this.useDirectYtDlp = true;
        }
      } else if (process.env.RENDER) {
        try {
          // For Render.com, use system yt-dlp installed via pip
          if (typeof ytDlpExec.setYtDlpPath === 'function') {
            // Try common Render.com paths
            const renderPaths = [
              '/opt/render/.local/bin/yt-dlp',
              '/home/render/.local/bin/yt-dlp', 
              'yt-dlp'
            ];
            
            let pathSet = false;
            for (const path of renderPaths) {
              try {
                ytDlpExec.setYtDlpPath(path);
                console.log(`🔧 YtDlpManager: Configured for Render.com environment with yt-dlp at ${path}`);
                pathSet = true;
                break;
              } catch (pathError) {
                console.log(`⚠️ YtDlpManager: Path ${path} not available, trying next...`);
              }
            }
            
            if (!pathSet) {
              console.warn('⚠️ YtDlpManager: No valid yt-dlp path found for Render.com, using direct approach');
              this.useDirectYtDlp = true;
            }
          } else {
            console.warn('⚠️ YtDlpManager: setYtDlpPath method not available, using direct approach');
            this.useDirectYtDlp = true;
          }
        } catch (renderError) {
           console.warn('⚠️ YtDlpManager: Render.com configuration failed:', renderError.message);
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
    // Temporarily disable complex headers for Twitter to avoid parsing issues
    if (platform === 'twitter') {
      return [];
    }
    
    const commonHeaders = [
      'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Fetch-Dest:document',
      'Sec-Fetch-Mode:navigate',
      'Sec-Fetch-Site:none'
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
    try {
      // Resolve yt-dlp path dynamically using the same professional resolver
      const ytdlpPath = await this.resolveYtDlpPath();
      
      return new Promise((resolve, reject) => {
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
            args.push('--add-header', header);
          });
        }
        
        console.log(`🎬 Executing yt-dlp stream: ${ytdlpPath} ${args.join(' ')}`);
        
        try {
          const ytdlpProcess = spawn(ytdlpPath, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: process.platform === 'win32' // Use shell on Windows for better compatibility
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
    } catch (error) {
      console.error('❌ Failed to resolve yt-dlp path:', error.message);
      throw error;
    }
  }

  /**
   * Professional yt-dlp resolver with dynamic installation fallback
   */
  async resolveYtDlpPath() {
    const path = require('path');
    const fs = require('fs');
    const { spawn } = require('child_process');
    
    // Define potential paths based on environment
    let candidatePaths = [];
    
    if (process.env.RENDER) {
      candidatePaths = [
        process.env.HOME + '/.local/bin/yt-dlp',
        '/opt/render/.local/bin/yt-dlp',
        '/home/render/.local/bin/yt-dlp',
        process.env.HOME + '/.yt-dlp-venv/bin/yt-dlp', // Virtual environment path
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp', // System package path
        'yt-dlp'
      ];
    } else if (process.env.REPLIT) {
      candidatePaths = [
        '/home/runner/.local/bin/yt-dlp',
        '/usr/local/bin/yt-dlp',
        'yt-dlp'
      ];
    } else if (process.platform === 'win32') {
      candidatePaths = [
        path.join(__dirname, '..', 'yt-dlp.exe'),
        'yt-dlp.exe',
        'yt-dlp'
      ];
    } else {
      candidatePaths = [
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
        'yt-dlp'
      ];
    }
    
    // Test each path
    for (const candidatePath of candidatePaths) {
      if (candidatePath !== 'yt-dlp' && candidatePath !== 'yt-dlp.exe') {
        if (fs.existsSync(candidatePath)) {
          console.log(`✅ Found yt-dlp at: ${candidatePath}`);
          return candidatePath;
        }
      } else {
        // Test if command is available in PATH
        try {
          await new Promise((resolve, reject) => {
            const testProcess = spawn(candidatePath, ['--version'], {
              stdio: ['ignore', 'pipe', 'pipe'],
              shell: process.platform === 'win32'
            });
            
            testProcess.on('close', (code) => {
              if (code === 0) {
                console.log(`✅ Found yt-dlp in PATH: ${candidatePath}`);
                resolve(candidatePath);
              } else {
                reject(new Error(`Command failed with code ${code}`));
              }
            });
            
            testProcess.on('error', reject);
            
            setTimeout(() => reject(new Error('Timeout')), 5000);
          });
          
          return candidatePath;
        } catch (error) {
          console.log(`❌ ${candidatePath} not available in PATH: ${error.message}`);
        }
      }
    }
    
    // If we reach here, yt-dlp is not found - attempt dynamic installation
    if (process.env.RENDER) {
      console.log('🔄 Attempting dynamic yt-dlp installation for Render.com...');
      try {
        await this.installYtDlpDynamically();
        return process.env.HOME + '/.local/bin/yt-dlp';
      } catch (installError) {
        console.error('❌ Dynamic installation failed:', installError.message);
      }
    }
    
    throw new Error('yt-dlp executable not found and dynamic installation failed');
  }
  
  /**
   * Dynamic yt-dlp installation for Render.com
   * Uses multiple strategies to handle externally-managed environments
   */
  async installYtDlpDynamically() {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    // Strategy 1: Try pipx first (recommended for externally-managed environments)
    try {
      console.log('📦 Attempting yt-dlp installation via pipx...');
      await this.runInstallCommand('pipx', ['install', 'yt-dlp']);
      
      // Check if pipx installed yt-dlp is accessible
      const pipxPath = process.env.HOME + '/.local/bin/yt-dlp';
      if (fs.existsSync(pipxPath)) {
        console.log('✅ yt-dlp installed successfully via pipx');
        return;
      }
    } catch (error) {
      console.log('⚠️ pipx installation failed, trying virtual environment...');
    }
    
    // Strategy 2: Create virtual environment and install yt-dlp
    try {
      console.log('📦 Creating virtual environment for yt-dlp...');
      const venvPath = path.join(process.env.HOME || '/tmp', '.yt-dlp-venv');
      
      // Create virtual environment
      await this.runInstallCommand('python3', ['-m', 'venv', venvPath]);
      
      // Install yt-dlp in virtual environment
      const venvPip = path.join(venvPath, 'bin', 'pip');
      await this.runInstallCommand(venvPip, ['install', '--upgrade', 'yt-dlp']);
      
      // Create symlink to make yt-dlp accessible
      const venvYtDlp = path.join(venvPath, 'bin', 'yt-dlp');
      const localBinDir = path.join(process.env.HOME, '.local', 'bin');
      const localYtDlp = path.join(localBinDir, 'yt-dlp');
      
      // Ensure .local/bin directory exists
      if (!fs.existsSync(localBinDir)) {
        fs.mkdirSync(localBinDir, { recursive: true });
      }
      
      // Create symlink
      if (fs.existsSync(venvYtDlp)) {
        if (fs.existsSync(localYtDlp)) {
          fs.unlinkSync(localYtDlp);
        }
        fs.symlinkSync(venvYtDlp, localYtDlp);
        console.log('✅ yt-dlp installed successfully via virtual environment');
        return;
      }
    } catch (error) {
      console.log('⚠️ Virtual environment installation failed, trying system packages...');
    }
    
    // Strategy 3: Try system package manager
    try {
      console.log('📦 Attempting system package installation...');
      await this.runInstallCommand('apt', ['update'], { timeout: 30000 });
      await this.runInstallCommand('apt', ['install', '-y', 'yt-dlp'], { timeout: 120000 });
      console.log('✅ yt-dlp installed successfully via apt');
      return;
    } catch (error) {
      console.log('⚠️ System package installation failed');
    }
    
    // Strategy 4: Last resort - try with --break-system-packages (not recommended)
    try {
      console.log('📦 Last resort: attempting pip with --break-system-packages...');
      await this.runInstallCommand('python3', ['-m', 'pip', 'install', '--user', '--upgrade', '--break-system-packages', 'yt-dlp']);
      console.log('✅ yt-dlp installed successfully with --break-system-packages');
      return;
    } catch (error) {
      console.error('❌ All installation strategies failed');
      throw new Error('Failed to install yt-dlp using any available method');
    }
  }
  
  /**
   * Helper method to run installation commands
   */
  async runInstallCommand(command, args, options = {}) {
    const { spawn } = require('child_process');
    const timeout = options.timeout || 60000;
    
    return new Promise((resolve, reject) => {
      console.log(`🔧 Running: ${command} ${args.join(' ')}`);
      
      const installProcess = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false
      });
      
      let stdout = '';
      let stderr = '';
      
      installProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      installProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      installProcess.on('error', (error) => {
        reject(error);
      });
      
      setTimeout(() => {
        installProcess.kill();
        reject(new Error('Command timeout'));
      }, timeout);
    });
  }
  
  /**
   * Execute yt-dlp directly using child_process (Cross-platform fallback)
   */
  async executeDirectYtDlp(url, options = {}) {
    try {
      // Resolve yt-dlp path dynamically
      const ytdlpPath = await this.resolveYtDlpPath();
      
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
        
        console.log('🚀 Executing yt-dlp:', ytdlpPath);
        console.log('🔧 Arguments:', args);
        
        const ytdlp = spawn(ytdlpPath, args, {
           stdio: ['ignore', 'pipe', 'pipe'],
           shell: false // Don't use shell to avoid argument parsing issues
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
               const result = JSON.parse(stdout);
               console.log('✅ yt-dlp execution successful');
               resolve(result);
             } catch (parseError) {
               console.error('❌ Failed to parse yt-dlp JSON output:', parseError.message);
               reject(new Error(`Failed to parse yt-dlp output: ${parseError.message}`));
             }
           } else {
             console.error(`❌ yt-dlp process exited with code ${code}`);
             console.error('❌ stderr:', stderr);
             reject(new Error(`yt-dlp failed with exit code ${code}: ${stderr}`));
           }
         });
         
         ytdlp.on('error', (error) => {
           console.error('❌ Failed to spawn yt-dlp process:', error.message);
           if (error.code === 'ENOENT') {
             reject(new Error(`yt-dlp executable not found at path: ${ytdlpPath}. Please ensure yt-dlp is installed and accessible.`));
           } else {
             reject(error);
           }
         });
         
         setTimeout(() => {
           ytdlp.kill();
           reject(new Error('yt-dlp execution timeout'));
         }, 30000); // 30 seconds timeout
       });
      } catch (error) {
        console.error('❌ Failed to resolve yt-dlp path:', error.message);
        throw error;
      }
    }
  
  /**
   * Get video information using yt-dlp (Cross-platform)
   */
  async getVideoInfo(url, options = {}) {
    try {
      console.log('🔍 Getting video info for:', url);
      
      const defaultOptions = {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        retries: 3,
        sleepInterval: 1,
        addHeader: [
          'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
      };
      
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Try direct yt-dlp execution first
      try {
        const result = await this.executeDirectYtDlp(url, mergedOptions);
        return result;
      } catch (directError) {
        console.error('❌ Direct yt-dlp failed:', directError.message);
        throw directError;
      }
    } catch (error) {
      console.error('❌ Error getting video info:', error.message);
      throw error;
    }
  }
  
  /**
   * Download video using yt-dlp (Cross-platform)
   */
  async downloadVideo(url, outputPath, options = {}) {
    try {
      console.log('📥 Downloading video:', url);
      console.log('📁 Output path:', outputPath);
      
      const defaultOptions = {
        output: outputPath,
        format: 'best[ext=mp4]/best',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        retries: 3,
        sleepInterval: 1,
        addHeader: [
          'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
      };
      
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Use streaming method for downloads
      const stream = await this.executeDirectYtDlpStream(url, mergedOptions);
      return stream;
    } catch (error) {
      console.error('❌ Error downloading video:', error.message);
      throw error;
    }
  }

  /**
   * Check if manager is ready to use
   */
  isReady() {
    console.log(`🔍 YtDlpManager.isReady(): returning ${this.isInitialized}`);
    return this.isInitialized;
  }
}

module.exports = YtDlpManager;