import { RedisStorageAdapter } from '../redis-adapter';

// Mock @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ping: jest.fn(),
  })),
}));

describe('RedisStorageAdapter', () => {
  let adapter;
  let mockRedis;

  beforeEach(() => {
    // Set up environment variables
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    const { Redis } = require('@upstash/redis');
    adapter = new RedisStorageAdapter();
    mockRedis = adapter.redis;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    jest.clearAllMocks();
  });

  test('initializes with environment variables', () => {
    expect(adapter.redis).toBeDefined();
  });

  test('throws error when environment variables are missing', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(() => new RedisStorageAdapter()).toThrow('Redis configuration missing');
  });

  test('stores and retrieves data', async () => {
    const testData = { name: 'test', value: 123 };
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(testData);

    await adapter.set('test-key', testData);
    const retrieved = await adapter.get('test-key');

    expect(mockRedis.set).toHaveBeenCalledWith('test-key', testData);
    expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    expect(retrieved).toEqual(testData);
  });

  test('returns null for non-existent keys', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await adapter.get('non-existent-key');
    
    expect(result).toBeNull();
  });

  test('deletes data', async () => {
    mockRedis.del.mockResolvedValue(1);

    await adapter.delete('delete-test');
    
    expect(mockRedis.del).toHaveBeenCalledWith('delete-test');
  });

  test('checks existence correctly', async () => {
    mockRedis.exists.mockResolvedValue(1);
    
    const exists = await adapter.exists('existence-test');
    
    expect(mockRedis.exists).toHaveBeenCalledWith('existence-test');
    expect(exists).toBe(true);
  });

  test('returns false for non-existent keys in exists check', async () => {
    mockRedis.exists.mockResolvedValue(0);
    
    const exists = await adapter.exists('non-existent');
    
    expect(exists).toBe(false);
  });

  test('handles JSON string responses', async () => {
    const testData = { name: 'test', value: 123 };
    const jsonString = JSON.stringify(testData);
    mockRedis.get.mockResolvedValue(jsonString);

    const retrieved = await adapter.get('json-test');
    
    expect(retrieved).toEqual(testData);
  });

  test('handles raw string responses', async () => {
    const rawString = 'simple string';
    mockRedis.get.mockResolvedValue(rawString);

    const retrieved = await adapter.get('string-test');
    
    expect(retrieved).toBe(rawString);
  });

  test('gracefully handles get errors', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

    const result = await adapter.get('error-test');
    
    expect(result).toBeNull();
  });

  test('gracefully handles connection errors on get', async () => {
    mockRedis.get.mockRejectedValue(new Error('ECONNREFUSED: Connection refused'));

    const result = await adapter.get('connection-test');
    
    expect(result).toBeNull();
  });

  test('gracefully handles timeout errors on get', async () => {
    mockRedis.get.mockRejectedValue(new Error('timeout: Operation timed out'));

    const result = await adapter.get('timeout-test');
    
    expect(result).toBeNull();
  });

  test('gracefully handles authentication errors on get', async () => {
    mockRedis.get.mockRejectedValue(new Error('authentication failed'));

    const result = await adapter.get('auth-test');
    
    expect(result).toBeNull();
  });

  test('throws specific error on connection failure during set', async () => {
    mockRedis.set.mockRejectedValue(new Error('ECONNREFUSED: Connection refused'));

    await expect(adapter.set('connection-test', { data: 'test' }))
      .rejects.toThrow('Redis connection failed for key "connection-test"');
  });

  test('throws specific error on timeout during set', async () => {
    mockRedis.set.mockRejectedValue(new Error('timeout: Operation timed out'));

    await expect(adapter.set('timeout-test', { data: 'test' }))
      .rejects.toThrow('Redis timeout for key "timeout-test"');
  });

  test('throws specific error on authentication failure during set', async () => {
    mockRedis.set.mockRejectedValue(new Error('authentication failed'));

    await expect(adapter.set('auth-test', { data: 'test' }))
      .rejects.toThrow('Redis authentication failed for key "auth-test"');
  });

  test('throws specific error on memory issues during set', async () => {
    mockRedis.set.mockRejectedValue(new Error('OOM: out of memory'));

    await expect(adapter.set('memory-test', { data: 'test' }))
      .rejects.toThrow('Redis out of memory for key "memory-test"');
  });

  test('throws error on set failure', async () => {
    mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

    await expect(adapter.set('error-test', { data: 'test' }))
      .rejects.toThrow('Failed to store data for key "error-test"');
  });

  test('throws error on delete failure', async () => {
    mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

    await expect(adapter.delete('error-test'))
      .rejects.toThrow('Failed to delete data for key "error-test"');
  });

  test('gracefully handles exists errors', async () => {
    mockRedis.exists.mockRejectedValue(new Error('Redis connection failed'));

    const result = await adapter.exists('error-test');
    
    expect(result).toBe(false);
  });

  test('health check works correctly', async () => {
    mockRedis.ping.mockResolvedValue('PONG');

    const isHealthy = await adapter.healthCheck();
    
    expect(mockRedis.ping).toHaveBeenCalled();
    expect(isHealthy).toBe(true);
  });

  test('health check handles failures', async () => {
    mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

    const isHealthy = await adapter.healthCheck();
    
    expect(isHealthy).toBe(false);
  });

  // Retry logic tests
  describe('retry logic', () => {
    beforeEach(() => {
      // Mock console.warn to avoid noise in test output
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Mock setTimeout to make tests run faster
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback();
        return 1;
      });
    });

    afterEach(() => {
      console.warn.mockRestore();
      global.setTimeout.mockRestore();
    });

    test('retries on connection refused error', async () => {
      const connectionError = new Error('ECONNREFUSED: Connection refused');
      mockRedis.get
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce({ data: 'success' });

      const result = await adapter.get('retry-test');

      expect(mockRedis.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    test('retries on timeout error', async () => {
      const timeoutError = new Error('timeout: Operation timed out');
      mockRedis.set
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('OK');

      await adapter.set('retry-test', { data: 'test' });

      expect(mockRedis.set).toHaveBeenCalledTimes(3);
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    test('retries on network error', async () => {
      const networkError = new Error('network error: Connection lost');
      mockRedis.del
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(1);

      await adapter.delete('retry-test');

      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    test('does not retry on authentication error', async () => {
      const authError = new Error('authentication failed');
      mockRedis.exists.mockRejectedValue(authError);

      const result = await adapter.exists('no-retry-test');

      expect(mockRedis.exists).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('exhausts all retries and throws error', async () => {
      const connectionError = new Error('ECONNREFUSED: Connection refused');
      mockRedis.set.mockRejectedValue(connectionError);

      await expect(adapter.set('exhaust-retry-test', { data: 'test' }))
        .rejects.toThrow('Redis connection failed for key "exhaust-retry-test"');

      expect(mockRedis.set).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(console.warn).toHaveBeenCalledTimes(3);
    });

    test('calculates exponential backoff delays correctly', () => {
      expect(adapter.calculateDelay(0)).toBe(100); // base delay
      expect(adapter.calculateDelay(1)).toBe(200); // 100 * 2^1
      expect(adapter.calculateDelay(2)).toBe(400); // 100 * 2^2
      expect(adapter.calculateDelay(3)).toBe(800); // 100 * 2^3
      expect(adapter.calculateDelay(10)).toBe(5000); // capped at maxDelay
    });

    test('identifies retryable errors correctly', () => {
      expect(adapter.isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(adapter.isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(adapter.isRetryableError(new Error('timeout occurred'))).toBe(true);
      expect(adapter.isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(adapter.isRetryableError(new Error('EPIPE'))).toBe(true);
      expect(adapter.isRetryableError(new Error('socket hang up'))).toBe(true);
      expect(adapter.isRetryableError(new Error('network error'))).toBe(true);
      expect(adapter.isRetryableError(new Error('temporary failure'))).toBe(true);
      expect(adapter.isRetryableError(new Error('service unavailable'))).toBe(true);
      expect(adapter.isRetryableError(new Error('too many requests'))).toBe(true);

      // Non-retryable errors
      expect(adapter.isRetryableError(new Error('authentication failed'))).toBe(false);
      expect(adapter.isRetryableError(new Error('permission denied'))).toBe(false);
      expect(adapter.isRetryableError(new Error('invalid syntax'))).toBe(false);
    });

    test('health check retries on transient failures', async () => {
      const connectionError = new Error('ECONNREFUSED: Connection refused');
      mockRedis.ping
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('PONG');

      const isHealthy = await adapter.healthCheck();

      expect(mockRedis.ping).toHaveBeenCalledTimes(2);
      expect(isHealthy).toBe(true);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });
});