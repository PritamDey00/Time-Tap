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
  }
}

async function loadTodos() {
  await ensureStore();
  const raw = await fs.readFile(TODOS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveTodos(todos) {
  await ensureStore();
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
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
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
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