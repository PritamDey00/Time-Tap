/**
 * @jest-environment node
 */

import todosIndexHandler from '../pages/api/todos/index';
import todosIdHandler from '../pages/api/todos/[id]';
import todosToggleHandler from '../pages/api/todos/[id]/toggle';
import jwt from 'jsonwebtoken';

// Mock the todos library
jest.mock('../lib/todos');
import {
  getUserClassroomTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion,
  loadTodos
} from '../lib/todos';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Todo API Endpoints', () => {
  let req, res, validToken, mockUser;

  beforeEach(() => {
    mockUser = { id: 'user-123', name: 'Test User' };
    validToken = jwt.sign(mockUser, JWT_SECRET);

    req = {
      headers: {
        cookie: `token=${validToken}`
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('/api/todos (index)', () => {
    describe('GET method', () => {
      beforeEach(() => {
        req.method = 'GET';
      });

      test('returns todos for authenticated user and classroom', async () => {
        req.query = { userId: 'user-123', classroomId: 'classroom-456' };
        const mockTodos = [
          {
            id: 'todo-1',
            userId: 'user-123',
            classroomId: 'classroom-456',
            text: 'Complete assignment',
            completed: false,
            priority: 'high'
          }
        ];

        getUserClassroomTodos.mockResolvedValue(mockTodos);

        await todosIndexHandler(req, res);

        expect(getUserClassroomTodos).toHaveBeenCalledWith('user-123', 'classroom-456');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockTodos);
      });

      test('returns 403 when user tries to access other user todos', async () => {
        req.query = { userId: 'other-user', classroomId: 'classroom-456' };

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
      });

      test('returns 400 when classroomId is missing', async () => {
        req.query = { userId: 'user-123' };

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'classroomId is required' });
      });

      test('returns 401 when no token provided', async () => {
        req.headers.cookie = '';

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      });

      test('returns 401 when invalid token provided', async () => {
        req.headers.cookie = 'token=invalid-token';

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      });
    });

    describe('POST method', () => {
      beforeEach(() => {
        req.method = 'POST';
      });

      test('creates new todo successfully', async () => {
        req.body = {
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'New todo item',
          priority: 'medium'
        };

        const mockCreatedTodo = {
          id: 'todo-new',
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'New todo item',
          completed: false,
          priority: 'medium',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        };

        createTodo.mockResolvedValue(mockCreatedTodo);

        await todosIndexHandler(req, res);

        expect(createTodo).toHaveBeenCalledWith({
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'New todo item',
          priority: 'medium'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockCreatedTodo);
      });

      test('trims whitespace from todo text', async () => {
        req.body = {
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: '  Whitespace todo  ',
          priority: 'low'
        };

        const mockCreatedTodo = { id: 'todo-new' };
        createTodo.mockResolvedValue(mockCreatedTodo);

        await todosIndexHandler(req, res);

        expect(createTodo).toHaveBeenCalledWith({
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'Whitespace todo',
          priority: 'low'
        });
      });

      test('uses default priority when not provided', async () => {
        req.body = {
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'Todo without priority'
        };

        const mockCreatedTodo = { id: 'todo-new' };
        createTodo.mockResolvedValue(mockCreatedTodo);

        await todosIndexHandler(req, res);

        expect(createTodo).toHaveBeenCalledWith({
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'Todo without priority',
          priority: 'medium'
        });
      });

      test('returns 403 when user tries to create todo for other user', async () => {
        req.body = {
          userId: 'other-user',
          classroomId: 'classroom-456',
          text: 'Unauthorized todo'
        };

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
      });

      test('returns 400 when required fields are missing', async () => {
        req.body = {
          userId: 'user-123'
          // Missing classroomId and text
        };

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'classroomId and text are required' });
      });

      test('returns 400 when text is empty or whitespace only', async () => {
        req.body = {
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: '   '
        };

        await todosIndexHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'classroomId and text are required' });
      });
    });

    test('returns 405 for unsupported methods', async () => {
      req.method = 'DELETE';

      await todosIndexHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST']);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });

  describe('/api/todos/[id]', () => {
    beforeEach(() => {
      req.query = { id: 'todo-123' };
      
      // Mock loadTodos for ownership verification
      loadTodos.mockResolvedValue([
        {
          id: 'todo-123',
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'Test todo',
          completed: false
        },
        {
          id: 'todo-456',
          userId: 'other-user',
          classroomId: 'classroom-456',
          text: 'Other user todo',
          completed: false
        }
      ]);
    });

    describe('PATCH method', () => {
      beforeEach(() => {
        req.method = 'PATCH';
      });

      test('updates todo successfully', async () => {
        req.body = {
          text: 'Updated todo text',
          completed: true,
          priority: 'high'
        };

        const mockUpdatedTodo = {
          id: 'todo-123',
          userId: 'user-123',
          text: 'Updated todo text',
          completed: true,
          priority: 'high',
          updatedAt: '2023-01-01T00:00:00.000Z'
        };

        updateTodo.mockResolvedValue(mockUpdatedTodo);

        await todosIdHandler(req, res);

        expect(updateTodo).toHaveBeenCalledWith('todo-123', {
          text: 'Updated todo text',
          completed: true,
          priority: 'high'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockUpdatedTodo);
      });

      test('sanitizes update fields', async () => {
        req.body = {
          text: '  Trimmed text  ',
          completed: 'true', // String should be converted to boolean
          priority: 'low',
          invalidField: 'should be ignored'
        };

        const mockUpdatedTodo = { id: 'todo-123' };
        updateTodo.mockResolvedValue(mockUpdatedTodo);

        await todosIdHandler(req, res);

        expect(updateTodo).toHaveBeenCalledWith('todo-123', {
          text: 'Trimmed text',
          completed: true,
          priority: 'low'
        });
      });

      test('returns 403 when user tries to update other user todo', async () => {
        req.query.id = 'todo-456'; // Belongs to other-user

        await todosIdHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
      });

      test('returns 404 when todo not found', async () => {
        req.query.id = 'nonexistent-todo';

        await todosIdHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Todo not found' });
      });
    });

    describe('DELETE method', () => {
      beforeEach(() => {
        req.method = 'DELETE';
      });

      test('deletes todo successfully', async () => {
        deleteTodo.mockResolvedValue(true);

        await todosIdHandler(req, res);

        expect(deleteTodo).toHaveBeenCalledWith('todo-123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
      });

      test('returns 403 when user tries to delete other user todo', async () => {
        req.query.id = 'todo-456'; // Belongs to other-user

        await todosIdHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
      });
    });

    test('returns 400 when todo ID is missing', async () => {
      req.query = {};
      req.method = 'PATCH';

      await todosIdHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Todo ID is required' });
    });

    test('returns 405 for unsupported methods', async () => {
      req.method = 'GET';

      await todosIdHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['PATCH', 'DELETE']);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });

  describe('/api/todos/[id]/toggle', () => {
    beforeEach(() => {
      req.method = 'PATCH';
      req.query = { id: 'todo-123' };
      
      // Mock loadTodos for ownership verification
      loadTodos.mockResolvedValue([
        {
          id: 'todo-123',
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'Test todo',
          completed: false
        }
      ]);
    });

    test('toggles todo completion successfully', async () => {
      const mockToggledTodo = {
        id: 'todo-123',
        userId: 'user-123',
        text: 'Test todo',
        completed: true,
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      toggleTodoCompletion.mockResolvedValue(mockToggledTodo);

      await todosToggleHandler(req, res);

      expect(toggleTodoCompletion).toHaveBeenCalledWith('todo-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockToggledTodo);
    });

    test('returns 403 when user tries to toggle other user todo', async () => {
      loadTodos.mockResolvedValue([
        {
          id: 'todo-123',
          userId: 'other-user', // Different user
          classroomId: 'classroom-456',
          text: 'Other user todo',
          completed: false
        }
      ]);

      await todosToggleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    test('returns 404 when todo not found', async () => {
      loadTodos.mockResolvedValue([]);

      await todosToggleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Todo not found' });
    });

    test('returns 400 when todo ID is missing', async () => {
      req.query = {};

      await todosToggleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Todo ID is required' });
    });

    test('returns 405 for unsupported methods', async () => {
      req.method = 'GET';

      await todosToggleHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['PATCH']);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    test('returns 401 when no authentication token', async () => {
      req.headers.cookie = '';

      await todosToggleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('Error handling', () => {
    test('handles internal server errors gracefully', async () => {
      req.method = 'GET';
      req.query = { userId: 'user-123', classroomId: 'classroom-456' };
      
      getUserClassroomTodos.mockRejectedValue(new Error('Database error'));

      await todosIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});