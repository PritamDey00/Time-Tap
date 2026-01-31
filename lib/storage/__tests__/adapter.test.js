import { FilesystemStorageAdapter } from '../filesystem-adapter';

// Mock the Redis adapter to avoid requiring actual Redis connection in tests
jest.mock('../redis-adapter', () => ({
  RedisStorageAdapter: class MockRedisStorageAdapter {
    async get(key) { return null; }
    async set(key, value) { return; }
    async delete(key) { return; }
    async exists(key) { return false; }
  }
}));

describe('Storage Adapter Factory', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let createStorageAdapter, getStorageAdapter, resetStorageAdapter;

  beforeEach(async () => {
    // Clear module cache and re-import
    jest.resetModules();
    const adapterModule = await import('../adapter');
    createStorageAdapter = adapterModule.createStorageAdapter;
    getStorageAdapter = adapterModule.getStorageAdapter;
    resetStorageAdapter = adapterModule.resetStorageAdapter;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    resetStorageAdapter();
  });

  test('creates filesystem adapter in development', () => {
    process.env.NODE_ENV = 'development';
    const adapter = createStorageAdapter();
    expect(adapter.constructor.name).toBe('FilesystemStorageAdapter');
  });

  test('creates filesystem adapter when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'test';
    const adapter = createStorageAdapter();
    expect(adapter.constructor.name).toBe('FilesystemStorageAdapter');
  });

  test('creates Redis adapter in production', () => {
    process.env.NODE_ENV = 'production';
    // Mock environment variables for Redis
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    const adapter = createStorageAdapter();
    expect(adapter.constructor.name).toBe('MockRedisStorageAdapter');
  });

  test('getStorageAdapter returns singleton instance', () => {
    const adapter1 = getStorageAdapter();
    const adapter2 = getStorageAdapter();
    expect(adapter1).toBe(adapter2);
  });

  test('resetStorageAdapter clears singleton instance', () => {
    const adapter1 = getStorageAdapter();
    resetStorageAdapter();
    const adapter2 = getStorageAdapter();
    expect(adapter1).not.toBe(adapter2);
  });

  test('storage adapters implement required interface methods', () => {
    const adapter = createStorageAdapter();
    
    // Verify all required methods exist and are functions
    expect(typeof adapter.get).toBe('function');
    expect(typeof adapter.set).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.exists).toBe('function');
  });
});