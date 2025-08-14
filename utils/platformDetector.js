/**
 * Detect the platform from a URL
 * @param {string} url - The URL to analyze
 * @returns {string} - The detected platform or 'unknown'
 */
function detectPlatform(url) {
  if (!url) return 'unknown';
  
  // Decode URL if it's encoded
  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    // If decoding fails, use original URL
    decodedUrl = url;
  }
  
  const urlLower = decodedUrl.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  } else if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  } else if (urlLower.includes('instagram.com')) {
    return 'instagram';
  } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) {
    return 'facebook';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || urlLower.includes('t.co')) {
    return 'twitter';
  } else if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  } else if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) {
    return 'pinterest';
  } else {
    return 'unknown';
  }
}

module.exports = {
  detectPlatform
};