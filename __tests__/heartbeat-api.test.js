/**
 * Tests for /api/heartbeat endpoint
 * Validates: Requirements 2.3
 */

import { createMocks } from 'node-mocks-http';
import heartbeatHandler from '../pages/api/heartbeat';
import jwt from 'jsonwebtoken';

// Mock the users module functions
jest.mock('../lib/users', () => ({
  findUserByName: jest.fn(),
  updateUser: jest.fn()
}));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

describe('/api/heartbeat', () => {
  let req, res, validToken, mockUser;

  beforeEach(() => {
    const { req: mockReq, res: mockRes } = createMocks();
    req = mockReq;
    res = mockRes;

    // Create a valid user for testing
    mockUser = {
      id: 'user-123',
      name: 'testuser',
      lastSeen: '2023-01-01T00:00:00.000Z'
    };

    // Create a valid JWT token
    validToken = jwt.sign(
      { name: mockUser.name, isAdmin: false },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Mock the users module functions
    const { findUserByName, updateUser } = require('../lib/users');
    findUserByName.mockResolvedValue(mockUser);
    updateUser.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST method', () => {
    beforeEach(() => {
      req.method = 'POST';
    });

    test('responds successfully for authenticated user', async () => {
      req.headers.cookie = `auth=${validToken}`;

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.lastSeen).toBeDefined();
    });

    test('updates user lastSeen timestamp', async () => {
      req.headers.cookie = `auth=${validToken}`;

      const beforeTime = new Date().getTime();
      await heartbeatHandler(req, res);

      const { updateUser } = require('../lib/users');
      
      // Verify that updateUser was called
      expect(updateUser).toHaveBeenCalled();
      
      // Verify the response includes the updated timestamp
      const data = JSON.parse(res._getData());
      expect(data.lastSeen).toBeDefined();
      expect(new Date(data.lastSeen).getTime()).toBeGreaterThanOrEqual(beforeTime);
    });

    test('skips heartbeat for admin users', async () => {
      const adminToken = jwt.sign(
        { name: 'admin', isAdmin: true },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.cookie = `auth=${adminToken}`;

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toBe('Admin user - no heartbeat tracking');
      
      // Verify that storage was not updated for admin users
      const { updateUser } = require('../lib/users');
      expect(updateUser).not.toHaveBeenCalled();
    });

    test('returns 401 for missing authentication', async () => {
      // No cookie header
      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Unauthorized');
      expect(data.type).toBe('auth');
      expect(data.retryable).toBe(false);
    });

    test('returns 401 for invalid token', async () => {
      req.headers.cookie = 'auth=invalid-token';

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Unauthorized');
      expect(data.type).toBe('auth');
      expect(data.retryable).toBe(false);
    });

    test('returns 404 for non-existent user', async () => {
      req.headers.cookie = `auth=${validToken}`;
      
      // Mock user not found
      const { findUserByName } = require('../lib/users');
      findUserByName.mockResolvedValue(null);

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Not Found');
      expect(data.type).toBe('notFound');
      expect(data.retryable).toBe(false);
    });

    test('handles storage errors gracefully', async () => {
      req.headers.cookie = `auth=${validToken}`;
      
      // Mock storage error during user update
      const { updateUser } = require('../lib/users');
      updateUser.mockRejectedValue(new Error('Storage error'));

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Internal Server Error');
      expect(data.type).toBe('server');
      expect(data.retryable).toBe(true);
    });
  });

  describe('Non-POST methods', () => {
    test('returns 405 for GET method', async () => {
      req.method = 'GET';

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method not allowed');
    });

    test('returns 405 for PUT method', async () => {
      req.method = 'PUT';

      await heartbeatHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method not allowed');
    });
  });
});