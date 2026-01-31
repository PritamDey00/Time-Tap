<<<<<<< HEAD
import { getStorageAdapter } from './storage/adapter.js';

// Storage key for todos data
const TODOS_STORAGE_KEY = 'todos';

// Queue for sequential save operations to prevent race conditions
let saveQueue = Promise.resolve();

async function ensureStore() {
  const storage = getStorageAdapter();
  
  try {
    // Check if todos data exists
    const exists = await storage.exists(TODOS_STORAGE_KEY);
    if (!exists) {
      // Initialize with empty array if not exists
      await storage.set(TODOS_STORAGE_KEY, []);
    }
  } catch (error) {
    console.error('Error ensuring todos store:', error.message);
    // Initialize with empty array on any error
    try {
      await storage.set(TODOS_STORAGE_KEY, []);
    } catch (initError) {
      console.error('Failed to initialize todos store:', initError.message);
      throw new Error('Unable to initialize todos storage');
    }
=======
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TODOS_FILE = path.join(DATA_DIR, 'todos.json');

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(TODOS_FILE);
  } catch (e) {
    await fs.writeFile(TODOS_FILE, JSON.stringify([]));
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}

async function loadTodos() {
<<<<<<< HEAD
  try {
    await ensureStore();
    const storage = getStorageAdapter();
    const todos = await storage.get(TODOS_STORAGE_KEY);
    
    // Handle null/undefined case (key doesn't exist)
    if (todos === null || todos === undefined) {
      console.log('No todos data found, initializing with empty array');
      await saveTodosInternal([]);
      return [];
    }
    
    // Validate structure
    if (!Array.isArray(todos)) {
      console.error('Invalid todos data structure, resetting to empty array');
      await saveTodosInternal([]);
      return [];
    }
    
    return todos;
  } catch (error) {
    console.error('Error loading todos:', {
      error: error.message,
      stack: error.stack,
      storageKey: TODOS_STORAGE_KEY
    });
    
    // If data is corrupted or any other error, reset to empty array
    try {
      await saveTodosInternal([]);
      return [];
    } catch (resetError) {
      console.error('Failed to reset todos after load error:', resetError.message);
      throw new Error('Unable to load or reset todos data');
    }
  }
}

// Internal save function with atomic writes
async function saveTodosInternal(todos) {
  await ensureStore();
  
  // Validate data before writing
  if (!Array.isArray(todos)) {
    throw new Error('Todos must be an array');
  }
  
  try {
    const storage = getStorageAdapter();
    await storage.set(TODOS_STORAGE_KEY, todos);
  } catch (error) {
    console.error('Error saving todos:', error.message);
    throw new Error(`Failed to save todos: ${error.message}`);
  }
}

// Public save function with queuing for concurrent access handling
async function saveTodos(todos) {
  saveQueue = saveQueue.then(() => saveTodosInternal(todos));
  return saveQueue;
=======
  await ensureStore();
  const raw = await fs.readFile(TODOS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveTodos(todos) {
  await ensureStore();
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
}

async function getUserClassroomTodos(userId, classroomId) {
  const todos = await loadTodos();
  return todos.filter(todo => todo.userId === userId && todo.classroomId === classroomId);
}

async function createTodo({ userId, classroomId, text, priority = 'medium' }) {
  if (!userId || !classroomId || !text?.trim()) {
    throw new Error('Missing required fields: userId, classroomId, and text are required');
  }

  const todos = await loadTodos();
  const todo = {
<<<<<<< HEAD
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
=======
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
    userId,
    classroomId,
    text: text.trim(),
    completed: false,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  todos.push(todo);
  await saveTodos(todos);
  return todo;
}

async function updateTodo(todoId, updates) {
  const todos = await loadTodos();
  const idx = todos.findIndex(t => t.id === todoId);
  if (idx === -1) throw new Error('Todo not found');

  const updatedTodo = {
    ...todos[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  todos[idx] = updatedTodo;
  await saveTodos(todos);
  return updatedTodo;
}

async function deleteTodo(todoId) {
  const todos = await loadTodos();
  const idx = todos.findIndex(t => t.id === todoId);
  if (idx === -1) throw new Error('Todo not found');

  todos.splice(idx, 1);
  await saveTodos(todos);
  return true;
}

async function toggleTodoCompletion(todoId) {
  const todos = await loadTodos();
  const idx = todos.findIndex(t => t.id === todoId);
  if (idx === -1) throw new Error('Todo not found');

  todos[idx].completed = !todos[idx].completed;
  todos[idx].updatedAt = new Date().toISOString();

  await saveTodos(todos);
  return todos[idx];
}

export {
  loadTodos,
  saveTodos,
  getUserClassroomTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion
};