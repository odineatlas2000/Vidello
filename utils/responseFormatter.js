/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
function formatError(message, statusCode = 500, details = null) {
  const response = {
    error: message,
    status: statusCode
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
}

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted success response
 */
function formatSuccess(data, message = 'Success') {
  return {
    success: true,
    message,
    data
  };
}

/**
 * Format video info response
 * @param {Object} videoInfo - Video information from yt-dlp
 * @param {string} platform - Platform name
 * @returns {Object} - Formatted video info response
 */
function formatResponse(videoInfo, platform) {
  if (!videoInfo) {
    throw new Error('Video info is required');
  }

  return {
    platform: platform || 'unknown',
    title: videoInfo.title || 'Unknown Title',
    thumbnail: videoInfo.thumbnail || null,
    duration: videoInfo.duration || null,
    uploader: videoInfo.uploader || null,
    upload_date: videoInfo.upload_date || null,
    view_count: videoInfo.view_count || null,
    formats: videoInfo.formats || [],
    url: videoInfo.webpage_url || videoInfo.original_url || null
  };
}

module.exports = {
  formatError,
  formatSuccess,
  formatResponse
};