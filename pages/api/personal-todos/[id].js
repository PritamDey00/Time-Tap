import { loadTodos, saveTodos } from '../../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
<<<<<<< HEAD
import { handleApiError, validateRequest } from '../../../lib/apiErrorHandler';
=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14

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
<<<<<<< HEAD
    // Log request for debugging
    console.log('Personal todo [id] API request:', {
      method: req.method,
      todoId: req.query.id,
      timestamp: new Date().toISOString()
    });

=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
    const user = verifyToken(req);
    const { id: todoId } = req.query;
    
    if (!todoId) {
<<<<<<< HEAD
      throw new Error('Todo ID is required');
=======
      return res.status(400).json({ error: 'Todo ID is required' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
    }
    
    // Verify todo ownership
    await verifyTodoOwnership(todoId, user.id);
    
    if (req.method === 'PATCH') {
<<<<<<< HEAD
      // Validate request data
      validateRequest(req, { text: false, completed: false, priority: false });
      
=======
      // Update todo
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      const updates = req.body;
      const todos = await loadTodos();
      const todoIndex = todos.findIndex(t => t.id === todoId);
      
      if (todoIndex === -1) {
<<<<<<< HEAD
        throw new Error('Todo not found');
=======
        return res.status(404).json({ error: 'Todo not found' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      }
      
      // Sanitize updates
      const allowedUpdates = {};
<<<<<<< HEAD
      if (updates.text !== undefined) {
        if (!updates.text.trim()) {
          throw new Error('Text cannot be empty');
        }
        allowedUpdates.text = updates.text.trim();
      }
=======
      if (updates.text !== undefined) allowedUpdates.text = updates.text.trim();
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      if (updates.completed !== undefined) allowedUpdates.completed = Boolean(updates.completed);
      if (updates.priority !== undefined) allowedUpdates.priority = updates.priority;
      
      todos[todoIndex] = {
        ...todos[todoIndex],
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };
      
      await saveTodos(todos);
<<<<<<< HEAD
      console.log('Todo updated successfully:', { todoId, userId: user.id });
=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      return res.status(200).json(todos[todoIndex]);
      
    } else if (req.method === 'DELETE') {
      // Delete todo
      const todos = await loadTodos();
      const filteredTodos = todos.filter(t => t.id !== todoId);
      await saveTodos(filteredTodos);
<<<<<<< HEAD
      console.log('Todo deleted successfully:', { todoId, userId: user.id });
=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      return res.status(200).json({ success: true });
      
    } else {
      res.setHeader('Allow', ['PATCH', 'DELETE']);
<<<<<<< HEAD
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'validation',
        message: 'This endpoint only supports PATCH and DELETE methods'
      });
    }
    
  } catch (error) {
    return handleApiError(error, res);
=======
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Personal todo API error:', error);
    
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
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}
