/**
 * Tests for error scenarios and user feedback messages in the confirmation system
 * Covers API validation, timing errors, and user feedback mechanisms
 */

import { createMocks } from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import confirmHandler from '../pages/api/confirm';
import { findUserByName, updateUser } from '../lib/users';

// Mock the user library
jest.mock('../lib/users');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

describe('Confirmation API Error Scenarios', () => {
  let mockUser;
  let validToken;

  beforeEach(() => {
    mockUser = {
      id: 'test-user-id',
      name: 'testuser',
      points: 0,
      streak: 0,
      lastConfirm: null,
      createdAt: '2023-01-01T12:00:00.000Z'
    };

    validToken = jwt.sign({ name: 'testuser' }, JWT_SECRET);
    
    findUserByName.mockResolvedValue(mockUser);
    updateUser.mockImplementation(user => Promise.resolve(user));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication errors', () => {
    test('returns 401 when no auth cookie provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {},
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Not authenticated'
      });
    });

    test('returns 401 when invalid token provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: 'auth=invalid-token'
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid token'
      });
    });

    test('returns 404 when user not found', async () => {
      findUserByName.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'User not found'
      });
    });
  });

  describe('Timing validation errors', () => {
    test('returns "Too early" error when confirming before 30 minutes', async () => {
      const now = new Date('2023-01-01T12:25:00.000Z').getTime(); // 25 minutes after creation
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Too early'
      });

      Date.now.mockRestore();
    });

    test('returns "Missed confirmation window" error when confirming after 31 minutes', async () => {
      const now = new Date('2023-01-01T12:32:00.000Z').getTime(); // 32 minutes after creation
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missed confirmation window. Wait for next 30-minute cycle.'
      });

      // Verify streak was reset
      expect(updateUser).toHaveBeenCalledWith({
        ...mockUser,
        streak: 0
      });

      Date.now.mockRestore();
    });

    test('resets streak when missing confirmation window', async () => {
      mockUser.streak = 5; // User had a streak
      const now = new Date('2023-01-01T12:35:00.000Z').getTime(); // 35 minutes after creation
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(updateUser).toHaveBeenCalledWith({
        ...mockUser,
        streak: 0
      });

      Date.now.mockRestore();
    });
  });

  describe('Successful confirmation scenarios', () => {
    test('awards 1 point for first confirmation (no streak)', async () => {
      const now = new Date('2023-01-01T12:30:30.000Z').getTime(); // 30.5 minutes after creation
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.pointsAwarded).toBe(1);
      expect(responseData.user.points).toBe(1);
      expect(responseData.user.streak).toBe(1);

      expect(updateUser).toHaveBeenCalledWith({
        ...mockUser,
        points: 1,
        streak: 1,
        lastConfirm: new Date(now).toISOString()
      });

      Date.now.mockRestore();
    });

    test('awards 2 points for streak continuation', async () => {
      mockUser.streak = 3;
      mockUser.points = 5;
      const now = new Date('2023-01-01T12:30:30.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.pointsAwarded).toBe(2);
      expect(responseData.user.points).toBe(7);
      expect(responseData.user.streak).toBe(4);

      Date.now.mockRestore();
    });

    test('confirms at exact window boundaries', async () => {
      // Test at exactly 30 minutes
      let now = new Date('2023-01-01T12:30:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      let { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);
      expect(res._getStatusCode()).toBe(200);

      // Reset mocks
      jest.clearAllMocks();
      findUserByName.mockResolvedValue(mockUser);
      updateUser.mockImplementation(user => Promise.resolve(user));

      // Test at exactly 31 minutes
      now = new Date('2023-01-01T12:31:00.000Z').getTime();
      Date.now.mockReturnValue(now);

      ({ req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      }));

      await confirmHandler(req, res);
      expect(res._getStatusCode()).toBe(200);

      Date.now.mockRestore();
    });
  });

  describe('HTTP method validation', () => {
    test('returns 405 for non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      });
    });
  });

  describe('Timing calculations with lastConfirm', () => {
    test('uses lastConfirm timestamp when available', async () => {
      mockUser.lastConfirm = '2023-01-01T13:00:00.000Z'; // Previous confirmation
      const now = new Date('2023-01-01T13:30:30.000Z').getTime(); // 30.5 minutes after last confirm
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData()).pointsAwarded).toBe(1);

      Date.now.mockRestore();
    });

    test('validates timing against lastConfirm when too early', async () => {
      mockUser.lastConfirm = '2023-01-01T13:00:00.000Z';
      const now = new Date('2023-01-01T13:25:00.000Z').getTime(); // 25 minutes after last confirm
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Too early'
      });

      Date.now.mockRestore();
    });
  });

  describe('Edge case timing scenarios', () => {
    test('handles confirmation at exact millisecond boundaries', async () => {
      // Test 1ms before window opens
      let now = new Date('2023-01-01T12:29:59.999Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      let { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      });

      await confirmHandler(req, res);
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).error).toBe('Too early');

      // Reset and test 1ms after window closes
      jest.clearAllMocks();
      findUserByName.mockResolvedValue(mockUser);
      updateUser.mockImplementation(user => Promise.resolve(user));

      now = new Date('2023-01-01T12:31:00.001Z').getTime();
      Date.now.mockReturnValue(now);

      ({ req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `auth=${validToken}`
        },
      }));

      await confirmHandler(req, res);
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).error).toBe('Missed confirmation window. Wait for next 30-minute cycle.');

      Date.now.mockRestore();
    });
  });
});