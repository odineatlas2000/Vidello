#!/bin/bash

# Replit Setup Script - Fallback for Nix issues
echo "🚀 Setting up VidGrabber for Replit..."

# Check if yt-dlp is available
if ! command -v yt-dlp &> /dev/null; then
    echo "📦 Installing yt-dlp via pip..."
    pip3 install --user yt-dlp
    export PATH="$HOME/.local/bin:$PATH"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
else
    echo "✅ yt-dlp already available"
fi

# Verify yt-dlp installation
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp version: $(yt-dlp --version)"
else
    echo "❌ yt-dlp installation failed"
    exit 1
fi

# Check ffmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg available"
else
    echo "⚠️ ffmpeg not found - some features may not work"
fi

# Set environment variables
export REPLIT=true
export NODE_ENV=production

echo "🎉 Setup complete! You can now run: npm start"