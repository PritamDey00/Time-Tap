import { FilesystemStorageAdapter } from '../filesystem-adapter';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FilesystemStorageAdapter', () => {
  let adapter;
  let tempDir;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-test-'));
    
    // Mock process.cwd() to return our temp directory
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
    
    adapter = new FilesystemStorageAdapter();
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Restore process.cwd()
    process.cwd.mockRestore();
  });

  test('stores and retrieves data', async () => {
    const testData = { name: 'test', value: 123 };
    
    await adapter.set('test-key', testData);
    const retrieved = await adapter.get('test-key');
    
    expect(retrieved).toEqual(testData);
  });

  test('returns null for non-existent keys', async () => {
    const result = await adapter.get('non-existent-key');
    expect(result).toBeNull();
  });

  test('deletes data', async () => {
    const testData = { name: 'test' };
    
    await adapter.set('delete-test', testData);
    expect(await adapter.exists('delete-test')).toBe(true);
    
    await adapter.delete('delete-test');
    expect(await adapter.exists('delete-test')).toBe(false);
  });

  test('checks existence correctly', async () => {
    expect(await adapter.exists('existence-test')).toBe(false);
    
    await adapter.set('existence-test', { data: 'test' });
    expect(await adapter.exists('existence-test')).toBe(true);
  });

  test('handles arrays correctly', async () => {
    const testArray = [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }];
    
    await adapter.set('array-test', testArray);
    const retrieved = await adapter.get('array-test');
    
    expect(retrieved).toEqual(testArray);
    expect(Array.isArray(retrieved)).toBe(true);
  });

  test('gracefully handles file read errors', async () => {
    // Try to read from a key that doesn't exist
    const result = await adapter.get('non-existent');
    expect(result).toBeNull();
  });

  test('gracefully handles permission errors on read', async () => {
    // Mock fs.readFile to throw permission error
    const originalReadFile = fs.readFile;
    fs.readFile = jest.fn().mockRejectedValue(Object.assign(new Error('Permission denied'), { code: 'EACCES' }));

    const result = await adapter.get('permission-test');
    expect(result).toBeNull();

    // Restore original function
    fs.readFile = originalReadFile;
  });

  test('gracefully handles JSON parsing errors', async () => {
    // Create a file with invalid JSON
    const filePath = path.join(tempDir, 'data', 'invalid-json.json');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'invalid json content');

    const result = await adapter.get('invalid-json');
    expect(result).toBeNull();
  });

  test('handles read-only filesystem errors on write', async () => {
    // Mock fs.writeFile to throw EROFS error
    const originalWriteFile = fs.writeFile;
    fs.writeFile = jest.fn().mockRejectedValue(Object.assign(new Error('Read-only file system'), { code: 'EROFS' }));

    await expect(adapter.set('readonly-test', { data: 'test' }))
      .rejects.toThrow('Cannot write to read-only filesystem for key "readonly-test"');

    // Restore original function
    fs.writeFile = originalWriteFile;
  });

  test('handles permission errors on write', async () => {
    // Mock fs.writeFile to throw permission error
    const originalWriteFile = fs.writeFile;
    fs.writeFile = jest.fn().mockRejectedValue(Object.assign(new Error('Permission denied'), { code: 'EACCES' }));

    await expect(adapter.set('permission-write-test', { data: 'test' }))
      .rejects.toThrow('Permission denied writing data for key "permission-write-test"');

    // Restore original function
    fs.writeFile = originalWriteFile;
  });

  test('handles no space left errors on write', async () => {
    // Mock fs.writeFile to throw ENOSPC error
    const originalWriteFile = fs.writeFile;
    fs.writeFile = jest.fn().mockRejectedValue(Object.assign(new Error('No space left on device'), { code: 'ENOSPC' }));

    await expect(adapter.set('nospace-test', { data: 'test' }))
      .rejects.toThrow('No space left on device for key "nospace-test"');

    // Restore original function
    fs.writeFile = originalWriteFile;
  });

  test('creates data directory if it does not exist', async () => {
    // Remove the data directory
    const dataDir = path.join(tempDir, 'data');
    try {
      await fs.rm(dataDir, { recursive: true });
    } catch (error) {
      // Directory might not exist
    }

    // Setting data should create the directory
    await adapter.set('create-dir-test', { test: true });
    
    // Verify directory was created
    const stats = await fs.stat(dataDir);
    expect(stats.isDirectory()).toBe(true);
  });
});