/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import todosIndexHandler from '../pages/api/todos/index';
import todosIdHandler from '../pages/api/todos/[id]';
import todosToggleHandler from '../pages/api/todos/[id]/toggle';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

// Mock the todos library to use actual file operations for integration testing
jest.unmock('../lib/todos');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Todo API Endpoints', () => {
  let testTodos;
  let userToken;

  beforeAll(() => {
    const user = { id: 'test-user', name: 'Test User' };
    userToken = jwt.sign(user, JWT_SECRET);
  });

  beforeEach(() => {
    testTodos = [
      {
        id: 'todo-1',
        userId: 'test-user',
        classroomId: 'classroom-1',
        text: 'Test todo 1',
        completed: false,
        priority: 'high',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      {
        id: 'todo-2',
        userId: 'test-user',
        classroomId: 'classroom-1',
        text: 'Test todo 2',
        completed: true,
        priority: 'medium',
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      }
    ];

    // Mock file system operations
    jest.spyOn(fs, 'mkdir').mockResolvedValue();
    jest.spyOn(fs, 'access').mockResolvedValue();
    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(testTodos));
    jest.spyOn(fs, 'writeFile').mockResolvedValue();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/todos', () => {
    test('returns todos for authenticated user and classroom', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const todos = JSON.parse(res._getData());
      expect(todos).toHaveLength(2);
      expect(todos[0].text).toBe('Test todo 1');
      expect(todos[1].text).toBe('Test todo 2');
    });

    test('returns 401 when no token provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });

    test('returns 401 when invalid token provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: 'token=invalid-token' }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });

    test('returns 403 when user tries to access other user todos', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'other-user', classroomId: 'classroom-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });

    test('returns 400 when classroomId is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({ error: 'classroomId is required' });
    });
  });

  describe('POST /api/todos', () => {
    test('creates new todo successfully', async () => {
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
      const newTodo = JSON.parse(res._getData());
      
      expect(newTodo).toMatchObject({
        userId: 'test-user',
        classroomId: 'classroom-1',
        text: 'New todo',
        priority: 'high',
        completed: false
      });
      expect(newTodo.id).toBeDefined();
      expect(newTodo.createdAt).toBeDefined();
      expect(newTodo.updatedAt).toBeDefined();

      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('returns 403 when user tries to create todo for other user', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'other-user',
          classroomId: 'classroom-1',
          text: 'Unauthorized todo',
          priority: 'medium'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });

    test('returns 400 when required fields are missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1'
          // text is missing
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({ error: 'classroomId and text are required' });
    });

    test('trims whitespace from text', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: '  Whitespace todo  ',
          priority: 'low'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      expect(newTodo.text).toBe('Whitespace todo');
    });

    test('defaults priority to medium when not provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'test-user',
          classroomId: 'classroom-1',
          text: 'Default priority todo'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      expect(newTodo.priority).toBe('medium');
    });
  });

  describe('PATCH /api/todos/[id]', () => {
    test('updates todo text successfully', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' },
        body: { text: 'Updated todo text' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.text).toBe('Updated todo text');
      expect(updatedTodo.updatedAt).not.toBe('2023-01-01T00:00:00.000Z');
    });

    test('updates todo completion status', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' },
        body: { completed: true },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.completed).toBe(true);
    });

    test('updates todo priority', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' },
        body: { priority: 'low' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.priority).toBe('low');
    });

    test('returns 404 when todo not found', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'nonexistent-todo' },
        body: { text: 'Updated text' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Todo not found' });
    });

    test('returns 403 when user tries to update other user todo', async () => {
      testTodos.push({
        id: 'other-user-todo',
        userId: 'other-user',
        classroomId: 'classroom-1',
        text: 'Other user todo',
        completed: false,
        priority: 'medium',
        createdAt: '2023-01-03T00:00:00.000Z',
        updatedAt: '2023-01-03T00:00:00.000Z'
      });

      fs.readFile.mockResolvedValue(JSON.stringify(testTodos));

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'other-user-todo' },
        body: { text: 'Unauthorized update' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });

    test('sanitizes update fields', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' },
        body: { 
          text: '  Trimmed text  ',
          completed: 'true', // String should be converted to boolean
          priority: 'high',
          maliciousField: 'should be ignored'
        },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.text).toBe('Trimmed text');
      expect(updatedTodo.completed).toBe(true);
      expect(updatedTodo.priority).toBe('high');
      expect(updatedTodo.maliciousField).toBeUndefined();
    });
  });

  describe('DELETE /api/todos/[id]', () => {
    test('deletes todo successfully', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'todo-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ success: true });
      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('returns 404 when todo not found', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'nonexistent-todo' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Todo not found' });
    });

    test('returns 403 when user tries to delete other user todo', async () => {
      testTodos.push({
        id: 'other-user-todo',
        userId: 'other-user',
        classroomId: 'classroom-1',
        text: 'Other user todo',
        completed: false,
        priority: 'medium',
        createdAt: '2023-01-03T00:00:00.000Z',
        updatedAt: '2023-01-03T00:00:00.000Z'
      });

      fs.readFile.mockResolvedValue(JSON.stringify(testTodos));

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'other-user-todo' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });
  });

  describe('PATCH /api/todos/[id]/toggle', () => {
    test('toggles todo completion from false to true', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosToggleHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.completed).toBe(true);
      expect(updatedTodo.updatedAt).not.toBe('2023-01-01T00:00:00.000Z');
    });

    test('toggles todo completion from true to false', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-2' }, // This one is already completed
        headers: { cookie: `token=${userToken}` }
      });

      await todosToggleHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.completed).toBe(false);
    });

    test('returns 404 when todo not found', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'nonexistent-todo' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosToggleHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Todo not found' });
    });

    test('returns 403 when user tries to toggle other user todo', async () => {
      testTodos.push({
        id: 'other-user-todo',
        userId: 'other-user',
        classroomId: 'classroom-1',
        text: 'Other user todo',
        completed: false,
        priority: 'medium',
        createdAt: '2023-01-03T00:00:00.000Z',
        updatedAt: '2023-01-03T00:00:00.000Z'
      });

      fs.readFile.mockResolvedValue(JSON.stringify(testTodos));

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'other-user-todo' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosToggleHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });

    test('returns 405 for non-PATCH methods', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'todo-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosToggleHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
      expect(res.getHeader('Allow')).toBe('PATCH');
    });
  });

  describe('Error Handling', () => {
    test('handles file system errors gracefully', async () => {
      fs.readFile.mockRejectedValue(new Error('File system error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'test-user', classroomId: 'classroom-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Internal server error' });
    });

    test('handles malformed JSON in data file', async () => {
      fs.readFile.mockResolvedValue('invalid json');

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

  describe('Method Not Allowed', () => {
    test('returns 405 for unsupported methods on index endpoint', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: { cookie: `token=${userToken}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
      expect(res.getHeader('Allow')).toBe('GET, POST');
    });

    test('returns 405 for unsupported methods on id endpoint', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'todo-1' },
        headers: { cookie: `token=${userToken}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
      expect(res.getHeader('Allow')).toBe('PATCH, DELETE');
    });
  });
});