/**
 * Standardized API error handler
 * Maps errors to appropriate HTTP status codes and user-friendly messages
 */

export function handleApiError(error, res, context = {}) {
  // Enhanced error logging with more context
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: {
      method: context.method || 'unknown',
      path: context.path || 'unknown',
      userId: context.userId || 'anonymous',
      userAgent: context.userAgent || 'unknown',
      ip: context.ip || 'unknown',
      ...context
    }
  });

  // Authentication errors
  if (error.message === 'No token provided' || error.message === 'Invalid token') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      type: 'auth',
      message: 'Please log in again to continue',
      retryable: false
    });
  }

  // Not found errors
  if (error.message === 'Todo not found' || 
      error.message === 'User not found' || 
      error.message === 'Classroom not found' ||
      error.message.includes('not found')) {
    return res.status(404).json({ 
      error: 'Not Found',
      type: 'notFound',
      message: 'The requested item could not be found',
      retryable: false
    });
  }

  // Access denied errors
  if (error.message === 'Access denied' || 
      error.message === 'Admin access required' ||
      error.message.includes('permission') ||
      error.message.includes('forbidden')) {
    return res.status(403).json({ 
      error: 'Forbidden',
      type: 'auth',
      message: 'You do not have permission to perform this action',
      retryable: false
    });
  }

  // Validation errors
  if (error.message.includes('validation') || 
      error.message.includes('required') || 
      error.message.includes('invalid') ||
      error.message.includes('Missing') ||
      error.message.includes('Bad request')) {
    return res.status(400).json({ 
      error: 'Bad Request',
      type: 'validation',
      message: error.message,
      retryable: false
    });
  }

  // Conflict errors (e.g., user already exists)
  if (error.message === 'already_exists' || 
      error.message.includes('already exists') ||
      error.message.includes('conflict')) {
    return res.status(409).json({ 
      error: 'Conflict',
      type: 'conflict',
      message: error.message,
      retryable: false
    });
  }

  // Method not allowed errors
  if (error.message.includes('Method not allowed')) {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      type: 'method',
      message: error.message,
      retryable: false
    });
  }

  // Default to server error (retryable)
  return res.status(500).json({ 
    error: 'Internal Server Error',
    type: 'server',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true
  });
}

/**
 * Validate request data
 */
export function validateRequest(req, schema) {
  const errors = [];

  if (schema.text !== undefined && req.body.text !== undefined) {
    if (typeof req.body.text !== 'string') {
      errors.push('Text must be a string');
    } else if (req.body.text.trim().length === 0) {
      errors.push('Text cannot be empty');
    } else if (req.body.text.length > 200) {
      errors.push('Text cannot exceed 200 characters');
    }
  }

  if (schema.priority !== undefined && req.body.priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(req.body.priority)) {
      errors.push('Priority must be one of: low, medium, high');
    }
  }

  if (schema.completed !== undefined && req.body.completed !== undefined) {
    if (typeof req.body.completed !== 'boolean') {
      errors.push('Completed must be a boolean');
    }
  }

  if (errors.length > 0) {
    throw new Error('Validation failed: ' + errors.join(', '));
  }
}
/**
 * Extract request context for error logging
 */
export function getRequestContext(req) {
  return {
    method: req.method,
    path: req.url,
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    timestamp: new Date().toISOString()
  };
}

/**
 * Log API request for debugging
 */
export function logApiRequest(req, additionalContext = {}) {
  console.log('API Request:', {
    ...getRequestContext(req),
    ...additionalContext
  });
}