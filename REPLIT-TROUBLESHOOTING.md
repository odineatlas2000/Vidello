# Replit Troubleshooting Guide

## Twitter/X Video Download Error Fix

If you're seeing the error:
```
Twitter extraction error: Error: Failed to extract twitter video information: Command failed with ENOENT: /home/runner/workspace/node_modules/yt-dlp-exec/bin/yt-dlp
```

This means yt-dlp-exec is trying to use a bundled binary that doesn't exist in Replit's environment.

## Quick Fix for Nix Environment Issues

If you're getting Nix build errors like "couldn't get nix env building nix env: exit status 1", follow these steps:

### Option 1: Use Simplified Nix Configuration

1. **Replace replit.nix** with the simplified version:
   ```bash
   cp replit-simple.nix replit.nix
   ```

2. **Run the setup script** in the Shell:
   ```bash
   chmod +x setup-replit.sh
   ./setup-replit.sh
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

### Option 2: Manual Setup (If Nix completely fails)

1. **Install yt-dlp manually**:
   ```bash
   pip3 install --user yt-dlp
   export PATH="$HOME/.local/bin:$PATH"
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   ```

2. **Set environment variables** in Replit Secrets:
   ```
   REPLIT=true
   NODE_ENV=production
   PORT=3000
   ```

3. **Install Node dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

### Solution Steps (Original Method):

#### 1. Verify System Dependencies
In your Replit Shell, run:
```bash
which yt-dlp
python3 --version
yt-dlp --version
```

If any of these commands fail, your `replit.nix` file may not be properly configured.

#### 2. Check replit.nix Configuration
Ensure your `replit.nix` file includes:
```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.ffmpeg
    pkgs.yt-dlp  # This is crucial!
    pkgs.curl
    pkgs.wget
    pkgs.git
  ];
  env = {
    PYTHON_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc.lib
      pkgs.zlib
      pkgs.glibc
    ];
    PYTHONPATH = "${pkgs.python3Packages.pip}/lib/python3.11/site-packages";
    PATH = "${pkgs.python3}/bin:${pkgs.yt-dlp}/bin:$PATH";
  };
}
```

#### 3. Environment Variables
Add these to your Replit's Secrets (Environment Variables):
```
REPLIT=true
NODE_ENV=production
PORT=3000
```

#### 4. Alternative: Manual yt-dlp Installation
If the system yt-dlp isn't working, try installing it manually in the Shell:
```bash
pip3 install --user yt-dlp
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

#### 5. Test yt-dlp Directly
Test if yt-dlp works with Twitter URLs:
```bash
yt-dlp --dump-single-json "https://x.com/i/status/1955649791175581774"
```

#### 6. Restart Your Repl
After making changes to `replit.nix` or environment variables:
1. Stop your Repl
2. Click "Run" again to restart
3. The system will rebuild with new dependencies

### Code Changes Applied

The following files have been updated for Replit compatibility:

1. **utils/ytdlpManager.js** - Now detects Replit environment and configures yt-dlp-exec to use system binary
2. **server.js** - Updated to Replit-compatible server configuration
3. **package.json** - Updated with Replit-specific dependencies and scripts
4. **controllers/twitterController.js** - Updated to use Replit-compatible ytdlpManager

### Testing the Fix

Once deployed to Replit, test the API:
```bash
curl "https://your-repl-name.your-username.repl.co/api/video-info?url=https%3A%2F%2Fx.com%2Fi%2Fstatus%2F1955649791175581774"
```

### Common Issues

1. **"yt-dlp not found"** - Check replit.nix configuration
2. **"Permission denied"** - Ensure PATH includes yt-dlp location
3. **"Module not found"** - Run `npm install` in Shell
4. **"Port already in use"** - Restart the Repl

### Support

If issues persist:
1. Check the Console tab for detailed error messages
2. Verify all Replit-specific files are present
3. Ensure environment variables are set correctly
4. Try the manual yt-dlp installation method

### Files Structure for Replit

```
├── .replit              # Replit configuration
├── replit.nix          # System dependencies
├── server.js           # Main server (Replit version)
├── package.json        # Dependencies (Replit version)
├── utils/
│   └── ytdlpManager.js # Video manager (Replit version)
├── controllers/
│   └── twitterController.js # Twitter handler (Replit version)
└── README-REPLIT.md    # Replit deployment guide
```

All original files are backed up with `.backup` extension.