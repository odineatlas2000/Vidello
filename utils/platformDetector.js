/**
 * Detect the platform from a URL
 * @param {string} url - The URL to analyze
 * @returns {string} - The detected platform or 'unknown'
 */
function detectPlatform(url) {
  if (!url) return 'unknown';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  } else if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  } else if (urlLower.includes('instagram.com')) {
    return 'instagram';
  } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) {
    return 'facebook';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  } else if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  } else {
    return 'unknown';
  }
}

module.exports = {
  detectPlatform
};