import { loadTodos, saveTodos } from '../../../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { handleApiError } from '../../../../lib/apiErrorHandler';

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
    // Log request for debugging
    console.log('Personal todo toggle API request:', {
      method: req.method,
      todoId: req.query.id,
      timestamp: new Date().toISOString()
    });

    const user = verifyToken(req);
    const { id: todoId } = req.query;
    
    if (!todoId) {
      throw new Error('Todo ID is required');
    }
    
    if (req.method === 'PATCH') {
      // Verify todo ownership
      await verifyTodoOwnership(todoId, user.id);
      
      // Toggle completion status
      const todos = await loadTodos();
      const todoIndex = todos.findIndex(t => t.id === todoId);
      
      if (todoIndex === -1) {
        throw new Error('Todo not found');
      }
      
      todos[todoIndex] = {
        ...todos[todoIndex],
        completed: !todos[todoIndex].completed,
        updatedAt: new Date().toISOString()
      };
      
      await saveTodos(todos);
      console.log('Todo toggled successfully:', { 
        todoId, 
        userId: user.id, 
        completed: todos[todoIndex].completed 
      });
      return res.status(200).json(todos[todoIndex]);
      
    } else {
      res.setHeader('Allow', ['PATCH']);
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'validation',
        message: 'This endpoint only supports PATCH method'
      });
    }
    
  } catch (error) {
    return handleApiError(error, res);
  }
}
