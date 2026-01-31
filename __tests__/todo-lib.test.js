/**
 * @jest-environment node
 */

import fs from 'fs/promises';
import path from 'path';
import {
  loadTodos,
  saveTodos,
  getUserClassroomTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion
} from '../lib/todos';

// Mock fs module
jest.mock('fs/promises');

describe('Todo Library Functions', () => {
  const mockTodos = [
    {
      id: 'todo-1',
      userId: 'user-123',
      classroomId: 'classroom-456',
      text: 'Complete assignment',
      completed: false,
      priority: 'high',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'todo-2',
      userId: 'user-123',
      classroomId: 'classroom-789',
      text: 'Review notes',
      completed: true,
      priority: 'medium',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    },
    {
      id: 'todo-3',
      userId: 'user-456',
      classroomId: 'classroom-456',
      text: 'Other user todo',
      completed: false,
      priority: 'low',
      createdAt: '2023-01-03T00:00:00.000Z',
      updatedAt: '2023-01-03T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful file operations by default
    fs.mkdir.mockResolvedValue();
    fs.access.mockResolvedValue();
    fs.readFile.mockResolvedValue(JSON.stringify(mockTodos));
    fs.writeFile.mockResolvedValue();
  });

  describe('loadTodos', () => {
    test('loads todos from file successfully', async () => {
      const todos = await loadTodos();

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data'),
        { recursive: true }
      );
      expect(fs.access).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json')
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json'),
        'utf8'
      );
      expect(todos).toEqual(mockTodos);
    });

    test('creates empty todos file when file does not exist', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));
      fs.readFile.mockResolvedValue(JSON.stringify([]));

      const todos = await loadTodos();

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json'),
        JSON.stringify([])
      );
      expect(todos).toEqual([]);
    });

    test('handles empty file content', async () => {
      fs.readFile.mockResolvedValue('');

      const todos = await loadTodos();

      expect(todos).toEqual([]);
    });

    test('handles malformed JSON gracefully', async () => {
      fs.readFile.mockResolvedValue('invalid json');

      await expect(loadTodos()).rejects.toThrow();
    });
  });

  describe('saveTodos', () => {
    test('saves todos to file successfully', async () => {
      const todosToSave = [{ id: 'test', text: 'Test todo' }];

      await saveTodos(todosToSave);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data'),
        { recursive: true }
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json'),
        JSON.stringify(todosToSave, null, 2)
      );
    });

    test('creates directory if it does not exist', async () => {
      fs.mkdir.mockResolvedValue();

      await saveTodos([]);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data'),
        { recursive: true }
      );
    });
  });

  describe('getUserClassroomTodos', () => {
    test('returns todos for specific user and classroom', async () => {
      const todos = await getUserClassroomTodos('user-123', 'classroom-456');

      expect(todos).toEqual([
        {
          id: 'todo-1',
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'Complete assignment',
          completed: false,
          priority: 'high',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ]);
    });

    test('returns empty array when no todos match criteria', async () => {
      const todos = await getUserClassroomTodos('nonexistent-user', 'classroom-456');

      expect(todos).toEqual([]);
    });

    test('filters by both userId and classroomId', async () => {
      const todos = await getUserClassroomTodos('user-123', 'classroom-789');

      expect(todos).toEqual([
        {
          id: 'todo-2',
          userId: 'user-123',
          classroomId: 'classroom-789',
          text: 'Review notes',
          completed: true,
          priority: 'medium',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      ]);
    });
  });

  describe('createTodo', () => {
    beforeEach(() => {
      // Mock Date.now for consistent timestamps
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-04T00:00:00.000Z');
      jest.spyOn(Date, 'now').mockReturnValue(1672790400000);
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('creates new todo successfully', async () => {
      const todoData = {
        userId: 'user-789',
        classroomId: 'classroom-123',
        text: 'New todo item',
        priority: 'high'
      };

      const createdTodo = await createTodo(todoData);

      expect(createdTodo).toEqual({
        id: expect.any(String),
        userId: 'user-789',
        classroomId: 'classroom-123',
        text: 'New todo item',
        completed: false,
        priority: 'high',
        createdAt: '2023-01-04T00:00:00.000Z',
        updatedAt: '2023-01-04T00:00:00.000Z'
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json'),
        expect.any(String)
      );
      
      // Verify the saved data contains the new todo
      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      const newTodo = savedData.find(t => t.text === 'New todo item');
      expect(newTodo).toBeDefined();
      expect(newTodo.userId).toBe('user-789');
      expect(newTodo.classroomId).toBe('classroom-123');
    });

    test('uses default priority when not provided', async () => {
      const todoData = {
        userId: 'user-789',
        classroomId: 'classroom-123',
        text: 'Todo without priority'
      };

      const createdTodo = await createTodo(todoData);

      expect(createdTodo.priority).toBe('medium');
    });

    test('trims whitespace from text', async () => {
      const todoData = {
        userId: 'user-789',
        classroomId: 'classroom-123',
        text: '  Whitespace todo  '
      };

      const createdTodo = await createTodo(todoData);

      expect(createdTodo.text).toBe('Whitespace todo');
    });

    test('throws error when required fields are missing', async () => {
      await expect(createTodo({})).rejects.toThrow(
        'Missing required fields: userId, classroomId, and text are required'
      );

      await expect(createTodo({ userId: 'user-123' })).rejects.toThrow(
        'Missing required fields: userId, classroomId, and text are required'
      );

      await expect(createTodo({ 
        userId: 'user-123', 
        classroomId: 'classroom-456' 
      })).rejects.toThrow(
        'Missing required fields: userId, classroomId, and text are required'
      );

      await expect(createTodo({ 
        userId: 'user-123', 
        classroomId: 'classroom-456',
        text: '   ' // Only whitespace
      })).rejects.toThrow(
        'Missing required fields: userId, classroomId, and text are required'
      );
    });

    test('generates unique IDs for todos', async () => {
      const todoData = {
        userId: 'user-789',
        classroomId: 'classroom-123',
        text: 'First todo'
      };

      const todo1 = await createTodo(todoData);
      
      // Change mock values for second todo
      jest.spyOn(Date, 'now').mockReturnValue(1672790500000);
      jest.spyOn(Math, 'random').mockReturnValue(0.987654321);
      
      const todo2 = await createTodo({ ...todoData, text: 'Second todo' });

      expect(todo1.id).not.toBe(todo2.id);
    });
  });

  describe('updateTodo', () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-05T00:00:00.000Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('updates todo successfully', async () => {
      const updates = {
        text: 'Updated todo text',
        completed: true,
        priority: 'low'
      };

      const updatedTodo = await updateTodo('todo-1', updates);

      expect(updatedTodo).toEqual({
        id: 'todo-1',
        userId: 'user-123',
        classroomId: 'classroom-456',
        text: 'Updated todo text',
        completed: true,
        priority: 'low',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-05T00:00:00.000Z'
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json'),
        expect.any(String)
      );
      
      // Verify the saved data contains the updated todo
      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      const savedTodo = savedData.find(t => t.id === 'todo-1');
      expect(savedTodo.text).toBe('Updated todo text');
      expect(savedTodo.completed).toBe(true);
      expect(savedTodo.priority).toBe('low');
    });

    test('updates only provided fields', async () => {
      const updates = { completed: true };

      const updatedTodo = await updateTodo('todo-1', updates);

      expect(updatedTodo.text).toBe('Complete assignment'); // Original text preserved
      expect(updatedTodo.completed).toBe(true); // Updated field
      expect(updatedTodo.priority).toBe('high'); // Original priority preserved
    });

    test('throws error when todo not found', async () => {
      await expect(updateTodo('nonexistent-todo', { text: 'Updated' }))
        .rejects.toThrow('Todo not found');
    });

    test('updates timestamp on modification', async () => {
      const updatedTodo = await updateTodo('todo-1', { text: 'New text' });

      expect(updatedTodo.updatedAt).toBe('2023-01-05T00:00:00.000Z');
      expect(updatedTodo.createdAt).toBe('2023-01-01T00:00:00.000Z'); // Should not change
    });
  });

  describe('deleteTodo', () => {
    test('deletes todo successfully', async () => {
      const result = await deleteTodo('todo-1');

      expect(result).toBe(true);
      
      // Verify the todo was removed from the saved data
      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(savedData.find(t => t.id === 'todo-1')).toBeUndefined();
      expect(savedData).toHaveLength(2); // Original 3 minus 1 deleted
    });

    test('throws error when todo not found', async () => {
      await expect(deleteTodo('nonexistent-todo'))
        .rejects.toThrow('Todo not found');
    });

    test('does not modify other todos when deleting', async () => {
      await deleteTodo('todo-1');

      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(savedData.find(t => t.id === 'todo-2')).toBeDefined();
      expect(savedData.find(t => t.id === 'todo-3')).toBeDefined();
    });
  });

  describe('toggleTodoCompletion', () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-06T00:00:00.000Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('toggles completion status from false to true', async () => {
      const toggledTodo = await toggleTodoCompletion('todo-1');

      expect(toggledTodo.completed).toBe(true);
      expect(toggledTodo.updatedAt).toBe('2023-01-06T00:00:00.000Z');
    });

    test('toggles completion status from true to false', async () => {
      const toggledTodo = await toggleTodoCompletion('todo-2');

      expect(toggledTodo.completed).toBe(false);
      expect(toggledTodo.updatedAt).toBe('2023-01-06T00:00:00.000Z');
    });

    test('throws error when todo not found', async () => {
      await expect(toggleTodoCompletion('nonexistent-todo'))
        .rejects.toThrow('Todo not found');
    });

    test('preserves other todo properties when toggling', async () => {
      const toggledTodo = await toggleTodoCompletion('todo-1');

      expect(toggledTodo.id).toBe('todo-1');
      expect(toggledTodo.userId).toBe('user-123');
      expect(toggledTodo.classroomId).toBe('classroom-456');
      expect(toggledTodo.text).toBe('Complete assignment');
      expect(toggledTodo.priority).toBe('high');
      expect(toggledTodo.createdAt).toBe('2023-01-01T00:00:00.000Z');
    });

    test('saves updated todo to file', async () => {
      await toggleTodoCompletion('todo-1');

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'todos.json'),
        expect.any(String)
      );
      
      // Verify the saved data contains the toggled todo
      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      const toggledTodo = savedData.find(t => t.id === 'todo-1');
      expect(toggledTodo.completed).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('handles file system errors gracefully', async () => {
      fs.readFile.mockRejectedValue(new Error('Permission denied'));

      await expect(loadTodos()).rejects.toThrow('Permission denied');
    });

    test('handles write errors gracefully', async () => {
      fs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(saveTodos([])).rejects.toThrow('Disk full');
    });
  });
});