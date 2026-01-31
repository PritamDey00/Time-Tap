/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import todosIndexHandler from '../pages/api/todos/index';
import todosIdHandler from '../pages/api/todos/[id]';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

// Mock the todos library
jest.unmock('../lib/todos');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Todo Error Handling and Edge Cases', () => {
  let userToken;

  beforeAll(() => {
    const user = { id: 'test-user', name: 'Test User' };
    userToken = jwt.sign(user, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Edge Cases', () => {
    test('handles missing cookie header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' }
        // No headers at all
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });

    test('handles empty cookie header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: '' }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });

    test('handles malformed JWT token', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: 'token=malformed.jwt.token' }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });

    test('handles expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: 'test-user', name: 'Test User', exp: Math.floor(Date.now() / 1000) - 3600 },
        JWT_SECRET
      );

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: `token=${expiredToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });
  });  describe
('Input Validation Edge Cases', () => {
    test('handles extremely long todo text', async () => {
      const longText = 'a'.repeat(10000);
      
      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([]));
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: longText,
          priority: 'high'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      expect(newTodo.text).toBe(longText);
    });

    test('handles special characters in todo text', async () => {
      const specialText = '🚀 Special chars: <script>alert("xss")</script> & "quotes" & \'apostrophes\'';
      
      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([]));
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: specialText,
          priority: 'medium'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      expect(newTodo.text).toBe(specialText);
    });

    test('handles null and undefined values in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: null,
          priority: undefined
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({ error: 'classroomId and text are required' });
    });

    test('handles empty string after trimming', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: '   \n\t   ',
          priority: 'low'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({ error: 'classroomId and text are required' });
    });
  });

  describe('File System Error Scenarios', () => {
    test('handles permission denied error', async () => {
      jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('EACCES: permission denied'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Internal server error' });
    });

    test('handles disk full error during write', async () => {
      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([]));
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('ENOSPC: no space left on device'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: 'Test todo',
          priority: 'medium'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Internal server error' });
    });

    test('handles corrupted data file', async () => {
      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue('{"invalid": json}');

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Concurrent Access Scenarios', () => {
    test('handles race condition during todo creation', async () => {
      const initialTodos = [
        {
          id: 'existing-todo',
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: 'Existing todo',
          completed: false,
          priority: 'medium',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(initialTodos));
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: 'New todo',
          priority: 'high'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      // Verify the write operation includes both existing and new todos
      expect(fs.writeFile).toHaveBeenCalled();
      const writtenData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenData).toHaveLength(2);
      expect(writtenData[0].text).toBe('Existing todo');
      expect(writtenData[1].text).toBe('New todo');
    });
  });

  describe('Edge Case IDs and Parameters', () => {
    test('handles very long todo ID', async () => {
      const longId = 'a'.repeat(1000);
      const testTodos = [
        {
          id: longId,
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: 'Todo with long ID',
          completed: false,
          priority: 'medium',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(testTodos));
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: longId },
        body: { text: 'Updated text' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.text).toBe('Updated text');
    });

    test('handles special characters in classroom ID', async () => {
      const specialClassroomId = 'classroom-with-special-chars-123!@#$%^&*()';
      
      jest.spyOn(fs, 'mkdir').mockResolvedValue();
      jest.spyOn(fs, 'access').mockResolvedValue();
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([]));
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: specialClassroomId,
          text: 'Todo with special classroom ID',
          priority: 'medium'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      expect(newTodo.classroomId).toBe(specialClassroomId);
    });

    test('handles missing todo ID parameter', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: {}, // No id parameter
        body: { text: 'Updated text' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Todo ID is required' });
    });
  });
});