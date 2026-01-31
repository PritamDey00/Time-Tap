import fs from 'fs/promises';
import path from 'path';

/**
 * Filesystem Storage Adapter
 * 
 * Maintains existing filesystem behavior for local development.
 * Maps storage keys to JSON files in the data directory.
 */
export class FilesystemStorageAdapter {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
  }

  /**
   * Ensure the data directory exists
   */
  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  /**
   * Get the file path for a storage key
   * @param {string} key - Storage key
   * @returns {string} File path
   */
  getFilePath(key) {
    return path.join(this.dataDir, `${key}.json`);
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key
   * @returns {Promise<any>} The stored data or null if not found
   */
  async get(key) {
    try {
      await this.ensureDataDir();
      const filePath = this.getFilePath(key);
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw || 'null');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return null as default value
        return null;
      }
      if (error.code === 'EACCES') {
        // Permission denied, log and return null for graceful degradation
        console.error(`Permission denied reading storage key "${key}":`, error.message);
        return null;
      }
      if (error instanceof SyntaxError) {
        // JSON parsing error, log and return null
        console.error(`Invalid JSON in storage key "${key}":`, error.message);
        return null;
      }
      // Log any other error but don't throw to maintain graceful degradation
      console.error(`Error reading storage key "${key}":`, error.message);
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
      await this.ensureDataDir();
      const filePath = this.getFilePath(key);
      
      // Write to temporary file first for atomic operation
      const tempFile = filePath + '.tmp';
      await fs.writeFile(tempFile, JSON.stringify(value, null, 2));
      
      // Atomic rename
      await fs.rename(tempFile, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        const tempFile = this.getFilePath(key) + '.tmp';
        await fs.unlink(tempFile);
      } catch (unlinkError) {
        // Ignore cleanup errors - temp file might not exist
      }
      
      // Log specific error types for better debugging
      if (error.code === 'EROFS') {
        console.error(`Read-only filesystem error writing storage key "${key}":`, error.message);
        throw new Error(`Cannot write to read-only filesystem for key "${key}"`);
      }
      if (error.code === 'EACCES') {
        console.error(`Permission denied writing storage key "${key}":`, error.message);
        throw new Error(`Permission denied writing data for key "${key}"`);
      }
      if (error.code === 'ENOSPC') {
        console.error(`No space left on device writing storage key "${key}":`, error.message);
        throw new Error(`No space left on device for key "${key}"`);
      }
      
      console.error(`Error writing storage key "${key}":`, error.message);
      throw new Error(`Failed to store data for key "${key}": ${error.message}`);
    }
  }

  /**
   * Remove data by key
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it already deleted - graceful handling
        return;
      }
      if (error.code === 'EACCES') {
        console.error(`Permission denied deleting storage key "${key}":`, error.message);
        throw new Error(`Permission denied deleting data for key "${key}"`);
      }
      if (error.code === 'EROFS') {
        console.error(`Read-only filesystem error deleting storage key "${key}":`, error.message);
        throw new Error(`Cannot delete from read-only filesystem for key "${key}"`);
      }
      
      console.error(`Error deleting storage key "${key}":`, error.message);
      throw new Error(`Failed to delete data for key "${key}": ${error.message}`);
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch (error) {
      // Any error (ENOENT, EACCES, etc.) means we can't confirm existence
      // Return false for graceful degradation
      if (error.code !== 'ENOENT') {
        // Log non-ENOENT errors for debugging
        console.error(`Error checking existence of storage key "${key}":`, error.message);
      }
      return false;
    }
  }
}