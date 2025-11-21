import { loadTodos, saveTodos } from '../../../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function verifyToken(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth;
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

async function verifyTodoOwnership(todoId, userId) {
  const todos = await loadTodos();
  const todo = todos.find(t => t.id === todoId);
  
  if (!todo) {
    throw new Error('Todo not found');
  }
  
  if (todo.userId !== userId) {
    throw new Error('Access denied');
  }
  
  return todo;
}

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    const { id: todoId } = req.query;
    
    if (!todoId) {
      return res.status(400).json({ error: 'Todo ID is required' });
    }
    
    if (req.method === 'PATCH') {
      // Verify todo ownership
      await verifyTodoOwnership(todoId, user.id);
      
      // Toggle completion status
      const todos = await loadTodos();
      const todoIndex = todos.findIndex(t => t.id === todoId);
      
      if (todoIndex === -1) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      
      todos[todoIndex] = {
        ...todos[todoIndex],
        completed: !todos[todoIndex].completed,
        updatedAt: new Date().toISOString()
      };
      
      await saveTodos(todos);
      return res.status(200).json(todos[todoIndex]);
      
    } else {
      res.setHeader('Allow', ['PATCH']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Personal todo toggle API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (error.message === 'Todo not found') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
