/**
 * Storage Adapter Interface and Factory
 * 
 * This module provides a unified interface for data persistence that works
 * across different environments (development with filesystem, production with Redis).
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {function(string): Promise<any>} get - Retrieve data by key
 * @property {function(string, any): Promise<void>} set - Store data by key
 * @property {function(string): Promise<void>} delete - Remove data by key
 * @property {function(string): Promise<boolean>} exists - Check if key exists
 */

/**
 * Storage Adapter Interface
 * 
 * All storage adapters must implement these methods:
 * - get(key): Promise<any> - Retrieve data by key
 * - set(key, value): Promise<void> - Store data by key
 * - delete(key): Promise<void> - Remove data by key
 * - exists(key): Promise<boolean> - Check if key exists
 */

import { FilesystemStorageAdapter } from './filesystem-adapter.js';
import { RedisStorageAdapter } from './redis-adapter.js';

/**
 * Creates the appropriate storage adapter based on environment
 * @returns {StorageAdapter} The storage adapter instance
 */
export function createStorageAdapter() {
  // Use Redis adapter in production environment
  if (process.env.NODE_ENV === 'production') {
    return new RedisStorageAdapter();
  }
  
  // Use filesystem adapter for development and testing
  return new FilesystemStorageAdapter();
}

/**
 * Get the singleton storage adapter instance
 * This ensures we use the same adapter instance throughout the application
 * @returns {StorageAdapter} The singleton storage adapter instance
 */
let adapterInstance = null;

export function getStorageAdapter() {
  if (!adapterInstance) {
    adapterInstance = createStorageAdapter();
  }
  return adapterInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 * @internal
 */
export function resetStorageAdapter() {
  adapterInstance = null;
}