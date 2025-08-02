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

module.exports = {
  formatError,
  formatSuccess
};