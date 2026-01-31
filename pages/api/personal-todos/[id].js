import { loadTodos, saveTodos } from '../../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { handleApiError, validateRequest } from '../../../lib/apiErrorHandler';

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
    console.log('Personal todo [id] API request:', {
      method: req.method,
      todoId: req.query.id,
      timestamp: new Date().toISOString()
    });

    const user = verifyToken(req);
    const { id: todoId } = req.query;
    
    if (!todoId) {
      throw new Error('Todo ID is required');
    }
    
    // Verify todo ownership
    await verifyTodoOwnership(todoId, user.id);
    
    if (req.method === 'PATCH') {
      // Validate request data
      validateRequest(req, { text: false, completed: false, priority: false });
      
      const updates = req.body;
      const todos = await loadTodos();
      const todoIndex = todos.findIndex(t => t.id === todoId);
      
      if (todoIndex === -1) {
        throw new Error('Todo not found');
      }
      
      // Sanitize updates
      const allowedUpdates = {};
      if (updates.text !== undefined) {
        if (!updates.text.trim()) {
          throw new Error('Text cannot be empty');
        }
        allowedUpdates.text = updates.text.trim();
      }
      if (updates.completed !== undefined) allowedUpdates.completed = Boolean(updates.completed);
      if (updates.priority !== undefined) allowedUpdates.priority = updates.priority;
      
      todos[todoIndex] = {
        ...todos[todoIndex],
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };
      
      await saveTodos(todos);
      console.log('Todo updated successfully:', { todoId, userId: user.id });
      return res.status(200).json(todos[todoIndex]);
      
    } else if (req.method === 'DELETE') {
      // Delete todo
      const todos = await loadTodos();
      const filteredTodos = todos.filter(t => t.id !== todoId);
      await saveTodos(filteredTodos);
      console.log('Todo deleted successfully:', { todoId, userId: user.id });
      return res.status(200).json({ success: true });
      
    } else {
      res.setHeader('Allow', ['PATCH', 'DELETE']);
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'validation',
        message: 'This endpoint only supports PATCH and DELETE methods'
      });
    }
    
  } catch (error) {
    return handleApiError(error, res);
  }
}
