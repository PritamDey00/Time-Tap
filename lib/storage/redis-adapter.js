import { Redis } from '@upstash/redis';

/**
 * Redis Storage Adapter
 * 
 * Provides Redis-based storage for production using Upstash Redis.
 * Handles JSON serialization/deserialization automatically.
 * Includes retry logic with exponential backoff for transient failures.
 */
export class RedisStorageAdapter {
  constructor() {
    this.redis = null;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 100, // milliseconds
      maxDelay: 5000, // milliseconds
      backoffMultiplier: 2
    };
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  initializeRedis() {
    try {
      // Check for required environment variables
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        console.error('Missing Redis configuration. Required environment variables:');
        console.error('- UPSTASH_REDIS_REST_URL');
        console.error('- UPSTASH_REDIS_REST_TOKEN');
        throw new Error('Redis configuration missing');
      }

      this.redis = new Redis({
        url,
        token,
      });

      console.log('Redis storage adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis storage adapter:', error.message);
      throw error;
    }
  }

  /**
   * Ensure Redis is initialized
   */
  ensureRedis() {
    if (!this.redis) {
      throw new Error('Redis not initialized');
    }
  }

  /**
   * Check if an error is retryable (transient failure)
   * @param {Error} error - The error to check
   * @returns {boolean} True if the error is retryable
   */
  isRetryableError(error) {
    const message = error.message.toLowerCase();
    
    // Network-related errors that are typically transient
    const retryablePatterns = [
      'econnrefused',    // Connection refused
      'enotfound',       // DNS resolution failed
      'timeout',         // Request timeout
      'econnreset',      // Connection reset by peer
      'epipe',           // Broken pipe
      'socket hang up',  // Socket disconnected
      'network error',   // Generic network error
      'temporary failure', // Temporary DNS failure
      'service unavailable', // Service temporarily down
      'too many requests'    // Rate limiting (should retry with backoff)
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Calculate delay for exponential backoff
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt) {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute Redis operation with retry logic
   * @param {Function} operation - The Redis operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @param {string} key - Storage key for logging
   * @returns {Promise<any>} Result of the operation
   */
  async executeWithRetry(operation, operationName, key) {
    let lastError;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // If this is the last attempt or error is not retryable, don't retry
        if (attempt === this.retryConfig.maxRetries || !this.isRetryableError(error)) {
          break;
        }

        // Calculate delay and wait before retrying
        const delay = this.calculateDelay(attempt);
        console.warn(
          `Redis ${operationName} failed for key "${key}" (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`
        );
        
        await this.sleep(delay);
      }
    }

    // All retries exhausted, throw the last error
    throw lastError;
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key
   * @returns {Promise<any>} The stored data or null if not found
   */
  async get(key) {
    try {
      this.ensureRedis();
      
      const result = await this.executeWithRetry(
        async () => await this.redis.get(key),
        'get',
        key
      );
      
      // Redis returns null for non-existent keys - return as default value
      if (result === null) {
        return null;
      }

      // If result is already an object (Upstash auto-parses JSON), return it
      if (typeof result === 'object') {
        return result;
      }

      // Otherwise, try to parse as JSON
      try {
        return JSON.parse(result);
      } catch (parseError) {
        // If parsing fails, log and return the raw value
        console.error(`JSON parsing failed for storage key "${key}":`, parseError.message);
        return result;
      }
    } catch (error) {
      // Log specific Redis error types for better debugging
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error(`Redis connection failed for storage key "${key}":`, error.message);
      } else if (error.message.includes('timeout')) {
        console.error(`Redis timeout reading storage key "${key}":`, error.message);
      } else if (error.message.includes('authentication')) {
        console.error(`Redis authentication failed for storage key "${key}":`, error.message);
      } else {
        console.error(`Error reading storage key "${key}":`, error.message);
      }
      
      // Return null for graceful degradation - don't throw unhandled exceptions
      return null;
    }
  }

  /**
   * Store data by key
   * @param {string} key - Storage key
   * @param {any} value - Data to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      this.ensureRedis();
      
      // Upstash Redis automatically handles JSON serialization
      await this.executeWithRetry(
        async () => await this.redis.set(key, value),
        'set',
        key
      );
    } catch (error) {
      // Log specific Redis error types for better debugging
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error(`Redis connection failed writing storage key "${key}":`, error.message);
        throw new Error(`Redis connection failed for key "${key}": ${error.message}`);
      } else if (error.message.includes('timeout')) {
        console.error(`Redis timeout writing storage key "${key}":`, error.message);
        throw new Error(`Redis timeout for key "${key}": ${error.message}`);
      } else if (error.message.includes('authentication')) {
        console.error(`Redis authentication failed writing storage key "${key}":`, error.message);
        throw new Error(`Redis authentication failed for key "${key}": ${error.message}`);
      } else if (error.message.includes('memory')) {
        console.error(`Redis out of memory writing storage key "${key}":`, error.message);
        throw new Error(`Redis out of memory for key "${key}": ${error.message}`);
      } else {
        console.error(`Error writing storage key "${key}":`, error.message);
        throw new Error(`Failed to store data for key "${key}": ${error.message}`);
      }
    }
  }

  /**
   * Remove data by key
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      this.ensureRedis();
      await this.executeWithRetry(
        async () => await this.redis.del(key),
        'delete',
        key
      );
    } catch (error) {
      // Log specific Redis error types for better debugging
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error(`Redis connection failed deleting storage key "${key}":`, error.message);
        throw new Error(`Redis connection failed for key "${key}": ${error.message}`);
      } else if (error.message.includes('timeout')) {
        console.error(`Redis timeout deleting storage key "${key}":`, error.message);
        throw new Error(`Redis timeout for key "${key}": ${error.message}`);
      } else if (error.message.includes('authentication')) {
        console.error(`Redis authentication failed deleting storage key "${key}":`, error.message);
        throw new Error(`Redis authentication failed for key "${key}": ${error.message}`);
      } else {
        console.error(`Error deleting storage key "${key}":`, error.message);
        throw new Error(`Failed to delete data for key "${key}": ${error.message}`);
      }
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      this.ensureRedis();
      const result = await this.executeWithRetry(
        async () => await this.redis.exists(key),
        'exists',
        key
      );
      return result === 1;
    } catch (error) {
      // Log specific Redis error types for better debugging
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error(`Redis connection failed checking existence of storage key "${key}":`, error.message);
      } else if (error.message.includes('timeout')) {
        console.error(`Redis timeout checking existence of storage key "${key}":`, error.message);
      } else if (error.message.includes('authentication')) {
        console.error(`Redis authentication failed checking existence of storage key "${key}":`, error.message);
      } else {
        console.error(`Error checking existence of storage key "${key}":`, error.message);
      }
      
      // Return false for graceful degradation - don't throw unhandled exceptions
      return false;
    }
  }

  /**
   * Health check for Redis connection
   * @returns {Promise<boolean>} True if Redis is accessible
   */
  async healthCheck() {
    try {
      this.ensureRedis();
      await this.executeWithRetry(
        async () => await this.redis.ping(),
        'ping',
        'healthcheck'
      );
      return true;
    } catch (error) {
      // Log specific Redis error types for better debugging
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('Redis health check failed - connection refused:', error.message);
      } else if (error.message.includes('timeout')) {
        console.error('Redis health check failed - timeout:', error.message);
      } else if (error.message.includes('authentication')) {
        console.error('Redis health check failed - authentication error:', error.message);
      } else {
        console.error('Redis health check failed:', error.message);
      }
      
      // Return false for graceful degradation - don't throw unhandled exceptions
      return false;
    }
  }
}