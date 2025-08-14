#!/bin/bash

# Replit yt-dlp Setup Script
# This script ensures yt-dlp is properly installed and configured for Replit environment

echo "🚀 Setting up yt-dlp for Replit environment..."

# Check if we're in Replit
if [ -z "$REPLIT" ]; then
    echo "⚠️  Warning: REPLIT environment variable not set. This script is designed for Replit."
fi

# Update package lists
echo "📦 Updating package lists..."
sudo apt-get update -qq

# Install required dependencies
echo "🔧 Installing dependencies..."
sudo apt-get install -y python3 python3-pip curl wget ffmpeg

# Install yt-dlp using pip
echo "⬇️  Installing yt-dlp..."
pip3 install --user yt-dlp

# Add user bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo "🔧 Adding ~/.local/bin to PATH"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
fi

# Verify installation
echo "✅ Verifying yt-dlp installation..."
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp successfully installed!"
    echo "📍 yt-dlp location: $(which yt-dlp)"
    echo "📋 yt-dlp version: $(yt-dlp --version)"
else
    echo "❌ yt-dlp installation failed or not found in PATH"
    echo "🔍 Checking alternative locations..."
    
    # Check common installation paths
    if [ -f "$HOME/.local/bin/yt-dlp" ]; then
        echo "📍 Found yt-dlp at: $HOME/.local/bin/yt-dlp"
        export PATH="$HOME/.local/bin:$PATH"
    elif [ -f "/usr/local/bin/yt-dlp" ]; then
        echo "📍 Found yt-dlp at: /usr/local/bin/yt-dlp"
    else
        echo "❌ yt-dlp not found in common locations"
        exit 1
    fi
fi

# Test yt-dlp with a simple command
echo "🧪 Testing yt-dlp functionality..."
if yt-dlp --help > /dev/null 2>&1; then
    echo "✅ yt-dlp is working correctly!"
else
    echo "❌ yt-dlp test failed"
    exit 1
fi

# Create a symlink in the project directory for easy access (optional)
if [ ! -f "./yt-dlp" ] && command -v yt-dlp &> /dev/null; then
    echo "🔗 Creating project symlink to yt-dlp..."
    ln -sf "$(which yt-dlp)" ./yt-dlp
fi

echo "🎉 yt-dlp setup completed successfully!"
echo "💡 You can now use yt-dlp in your Node.js application."
echo "📝 Make sure to set the REPLIT environment variable if not already set."