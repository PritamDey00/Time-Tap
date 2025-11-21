/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import todosIndexHandler from '../pages/api/todos/index';
import todosIdHandler from '../pages/api/todos/[id]';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

// Mock the todos library to use actual file operations for integration testing
jest.unmock('../lib/todos');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TEST_DATA_DIR = path.join(process.cwd(), 'test-data');
const TEST_TODOS_FILE = path.join(TEST_DATA_DIR, 'todos.json');

// Override the data directory for tests
jest.mock('fs/promises');
const mockFs = fs;

describe('Todo Classroom Isolation Integration Tests', () => {
  let testTodos;
  let user1Token, user2Token;

  beforeAll(() => {
    // Create test users
    const user1 = { id: 'user-1', name: 'User One' };
    const user2 = { id: 'user-2', name: 'User Two' };
    
    user1Token = jwt.sign(user1, JWT_SECRET);
    user2Token = jwt.sign(user2, JWT_SECRET);
  });

  beforeEach(() => {
    // Reset test data
    testTodos = [
      {
        id: 'todo-1',
        userId: 'user-1',
        classroomId: 'classroom-A',
        text: 'User 1 Todo in Classroom A',
        completed: false,
        priority: 'high',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      {
        id: 'todo-2',
        userId: 'user-1',
        classroomId: 'classroom-B',
        text: 'User 1 Todo in Classroom B',
        completed: false,
        priority: 'medium',
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      },
      {
        id: 'todo-3',
        userId: 'user-2',
        classroomId: 'classroom-A',
        text: 'User 2 Todo in Classroom A',
        completed: true,
        priority: 'low',
        createdAt: '2023-01-03T00:00:00.000Z',
        updatedAt: '2023-01-03T00:00:00.000Z'
      },
      {
        id: 'todo-4',
        userId: 'user-2',
        classroomId: 'classroom-B',
        text: 'User 2 Todo in Classroom B',
        completed: false,
        priority: 'high',
        createdAt: '2023-01-04T00:00:00.000Z',
        updatedAt: '2023-01-04T00:00:00.000Z'
      }
    ];

    // Mock file system operations
    mockFs.mkdir.mockResolvedValue();
    mockFs.access.mockResolvedValue();
    mockFs.readFile.mockResolvedValue(JSON.stringify(testTodos));
    mockFs.writeFile.mockResolvedValue();

    jest.clearAllMocks();
  });

  describe('Todo Retrieval Isolation', () => {
    test('user can only see their own todos in specific classroom', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-A' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const todos = JSON.parse(res._getData());
      
      expect(todos).toHaveLength(1);
      expect(todos[0]).toMatchObject({
        id: 'todo-1',
        userId: 'user-1',
        classroomId: 'classroom-A',
        text: 'User 1 Todo in Classroom A'
      });
    });

    test('user gets different todos for different classrooms', async () => {
      // Get todos from classroom A
      const { req: reqA, res: resA } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-A' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(reqA, resA);

      expect(resA._getStatusCode()).toBe(200);
      const todosA = JSON.parse(resA._getData());
      expect(todosA).toHaveLength(1);
      expect(todosA[0].text).toBe('User 1 Todo in Classroom A');

      // Get todos from classroom B
      const { req: reqB, res: resB } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-B' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(reqB, resB);

      expect(resB._getStatusCode()).toBe(200);
      const todosB = JSON.parse(resB._getData());
      expect(todosB).toHaveLength(1);
      expect(todosB[0].text).toBe('User 1 Todo in Classroom B');

      // Ensure they are different todos
      expect(todosA[0].id).not.toBe(todosB[0].id);
    });

    test('user cannot access other user todos even in same classroom', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user-2', classroomId: 'classroom-A' }, // Trying to access user-2's todos
        headers: { cookie: `token=${user1Token}` } // But authenticated as user-1
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });

    test('returns empty array when user has no todos in classroom', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-C' }, // Non-existent classroom
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const todos = JSON.parse(res._getData());
      expect(todos).toEqual([]);
    });
  });

  describe('Todo Creation Isolation', () => {
    test('creates todo in correct classroom for authenticated user', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-1',
          classroomId: 'classroom-C',
          text: 'New todo in classroom C',
          priority: 'high'
        },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      
      expect(newTodo).toMatchObject({
        userId: 'user-1',
        classroomId: 'classroom-C',
        text: 'New todo in classroom C',
        priority: 'high',
        completed: false
      });

      // Verify it was saved with other todos
      expect(mockFs.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      expect(savedData).toHaveLength(5); // Original 4 + new 1
      
      const savedTodo = savedData.find(t => t.text === 'New todo in classroom C');
      expect(savedTodo).toBeDefined();
      expect(savedTodo.classroomId).toBe('classroom-C');
    });

    test('prevents user from creating todos for other users', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-2', // Trying to create for user-2
          classroomId: 'classroom-A',
          text: 'Unauthorized todo',
          priority: 'medium'
        },
        headers: { cookie: `token=${user1Token}` } // But authenticated as user-1
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
      
      // Verify nothing was saved
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('Todo Modification Isolation', () => {
    test('user can only modify their own todos', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' }, // User 1's todo
        body: { text: 'Modified todo text' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const updatedTodo = JSON.parse(res._getData());
      expect(updatedTodo.text).toBe('Modified todo text');
    });

    test('user cannot modify other user todos', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-3' }, // User 2's todo
        body: { text: 'Unauthorized modification' },
        headers: { cookie: `token=${user1Token}` } // User 1 trying to modify
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });

    test('user can only delete their own todos', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'todo-2' }, // User 1's todo
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ success: true });
    });

    test('user cannot delete other user todos', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'todo-4' }, // User 2's todo
        headers: { cookie: `token=${user1Token}` } // User 1 trying to delete
      });

      await todosIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Access denied' });
    });
  });

  describe('Cross-Classroom Data Integrity', () => {
    test('modifying todo in one classroom does not affect other classrooms', async () => {
      // Modify todo in classroom A
      const { req: reqModify, res: resModify } = createMocks({
        method: 'PATCH',
        query: { id: 'todo-1' },
        body: { text: 'Modified in classroom A' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIdHandler(reqModify, resModify);
      expect(resModify._getStatusCode()).toBe(200);

      // Verify todos in classroom B are unchanged
      const { req: reqGet, res: resGet } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-B' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(reqGet, resGet);
      expect(resGet._getStatusCode()).toBe(200);
      
      const todosB = JSON.parse(resGet._getData());
      expect(todosB[0].text).toBe('User 1 Todo in Classroom B'); // Should be unchanged
    });

    test('deleting todo in one classroom does not affect other classrooms', async () => {
      // Delete todo in classroom A
      const { req: reqDelete, res: resDelete } = createMocks({
        method: 'DELETE',
        query: { id: 'todo-1' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIdHandler(reqDelete, resDelete);
      expect(resDelete._getStatusCode()).toBe(200);

      // Verify todos in classroom B still exist
      const { req: reqGet, res: resGet } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-B' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(reqGet, resGet);
      expect(resGet._getStatusCode()).toBe(200);
      
      const todosB = JSON.parse(resGet._getData());
      expect(todosB).toHaveLength(1);
      expect(todosB[0].text).toBe('User 1 Todo in Classroom B');
    });
  });

  describe('Multi-User Classroom Scenarios', () => {
    test('multiple users can have todos in same classroom without interference', async () => {
      // User 1 gets their todos from classroom A
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-A' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req1, res1);
      expect(res1._getStatusCode()).toBe(200);
      const user1Todos = JSON.parse(res1._getData());
      expect(user1Todos).toHaveLength(1);
      expect(user1Todos[0].text).toBe('User 1 Todo in Classroom A');

      // User 2 gets their todos from same classroom A
      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
        query: { userId: 'user-2', classroomId: 'classroom-A' },
        headers: { cookie: `token=${user2Token}` }
      });

      await todosIndexHandler(req2, res2);
      expect(res2._getStatusCode()).toBe(200);
      const user2Todos = JSON.parse(res2._getData());
      expect(user2Todos).toHaveLength(1);
      expect(user2Todos[0].text).toBe('User 2 Todo in Classroom A');

      // Verify they are completely separate
      expect(user1Todos[0].id).not.toBe(user2Todos[0].id);
      expect(user1Todos[0].userId).toBe('user-1');
      expect(user2Todos[0].userId).toBe('user-2');
    });

    test('user can create todos in multiple classrooms independently', async () => {
      // Create todo in classroom A
      const { req: reqA, res: resA } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-1',
          classroomId: 'classroom-A',
          text: 'New todo in A',
          priority: 'high'
        },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(reqA, resA);
      expect(resA._getStatusCode()).toBe(201);

      // Create todo in classroom B
      const { req: reqB, res: resB } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-1',
          classroomId: 'classroom-B',
          text: 'New todo in B',
          priority: 'low'
        },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(reqB, resB);
      expect(resB._getStatusCode()).toBe(201);

      // Verify both todos were created with correct classroom association
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      
      const firstSave = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      const secondSave = JSON.parse(mockFs.writeFile.mock.calls[1][1]);
      
      const newTodoA = firstSave.find(t => t.text === 'New todo in A');
      const newTodoB = secondSave.find(t => t.text === 'New todo in B');
      
      expect(newTodoA.classroomId).toBe('classroom-A');
      expect(newTodoB.classroomId).toBe('classroom-B');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty classroom gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'empty-classroom' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const todos = JSON.parse(res._getData());
      expect(todos).toEqual([]);
    });

    test('handles special characters in classroom IDs', async () => {
      const specialClassroomId = 'classroom-with-special-chars-123!@#';
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-1',
          classroomId: specialClassroomId,
          text: 'Todo with special classroom ID',
          priority: 'medium'
        },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const newTodo = JSON.parse(res._getData());
      expect(newTodo.classroomId).toBe(specialClassroomId);
    });

    test('maintains isolation with similar classroom IDs', async () => {
      // Create todos in similar classroom IDs
      testTodos.push(
        {
          id: 'todo-5',
          userId: 'user-1',
          classroomId: 'classroom-1',
          text: 'Todo in classroom-1',
          completed: false,
          priority: 'medium',
          createdAt: '2023-01-05T00:00:00.000Z',
          updatedAt: '2023-01-05T00:00:00.000Z'
        },
        {
          id: 'todo-6',
          userId: 'user-1',
          classroomId: 'classroom-11',
          text: 'Todo in classroom-11',
          completed: false,
          priority: 'medium',
          createdAt: '2023-01-06T00:00:00.000Z',
          updatedAt: '2023-01-06T00:00:00.000Z'
        }
      );

      mockFs.readFile.mockResolvedValue(JSON.stringify(testTodos));

      // Get todos from classroom-1
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-1' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req1, res1);
      expect(res1._getStatusCode()).toBe(200);
      const todos1 = JSON.parse(res1._getData());
      expect(todos1).toHaveLength(1);
      expect(todos1[0].text).toBe('Todo in classroom-1');

      // Get todos from classroom-11
      const { req: req11, res: res11 } = createMocks({
        method: 'GET',
        query: { userId: 'user-1', classroomId: 'classroom-11' },
        headers: { cookie: `token=${user1Token}` }
      });

      await todosIndexHandler(req11, res11);
      expect(res11._getStatusCode()).toBe(200);
      const todos11 = JSON.parse(res11._getData());
      expect(todos11).toHaveLength(1);
      expect(todos11[0].text).toBe('Todo in classroom-11');
    });
  });
});