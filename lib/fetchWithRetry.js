/**
 * Fetch with automatic retry logic and exponential backoff
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const delays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Success - return response
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx) - these won't succeed on retry
      if (response.status >= 400 && response.status < 500) {
        // Parse error response if available
        try {
          const errorData = await response.json();
          const error = new Error(errorData.message || `Client error: ${response.status}`);
          error.response = response;
          error.data = errorData;
          throw error;
        } catch (parseError) {
          const error = new Error(`Client error: ${response.status}`);
          error.response = response;
          throw error;
        }
      }
      
      // Server errors (5xx) - retry if we have attempts left
      if (attempt < maxRetries) {
        console.log(`Server error (${response.status}), retrying in ${delays[attempt]}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        continue;
      }
      
      // Max retries exhausted
      const error = new Error(`Server error after ${maxRetries} retries: ${response.status}`);
      error.response = response;
      throw error;
      
    } catch (error) {
      // Network errors (TypeError) - retry if we have attempts left
      if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        console.log(`Network error, retrying in ${delays[attempt]}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        continue;
      }
      
      // Re-throw if it's not a network error or we're out of retries
      throw error;
    }
  }
}

/**
 * Classify error type for user-friendly messaging
 * @param {Error} error - The error to classify
 * @returns {object} - Error information with type and user-friendly message
 */
export function classifyError(error) {
  // Network errors
  if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('Network')) {
    return {
      type: 'network',
      title: 'Connection Issue',
      message: 'Unable to reach the server. Check your internet connection.',
      retryable: true
    };
  }
  
  // Authentication errors
  if (error.message.includes('Unauthorized') || error.message.includes('log in')) {
    return {
      type: 'auth',
      title: 'Session Expired',
      message: 'Please log in again to continue.',
      retryable: false
    };
  }
  
  // Validation errors
  if (error.message.includes('validation') || error.message.includes('invalid') || error.message.includes('required')) {
    return {
      type: 'validation',
      title: 'Invalid Input',
      message: error.message,
      retryable: false
    };
  }
  
  // Not found errors
  if (error.message.includes('not found') || error.message.includes('404')) {
    return {
      type: 'notFound',
      title: 'Not Found',
      message: 'The todo item could not be found.',
      retryable: false
    };
  }
  
  // Timeout errors
  if (error.message.includes('timeout')) {
    return {
      type: 'timeout',
      title: 'Request Timeout',
      message: 'The operation took too long. Please try again.',
      retryable: true
    };
  }
  
  // Server errors (default)
  return {
    type: 'server',
    title: 'Server Error',
    message: 'Something went wrong. Please try again.',
    retryable: true
  };
}
