import { loadTodos, saveTodos } from '../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { v4 as uuidv4 } from 'uuid';
<<<<<<< HEAD
import { handleApiError, validateRequest } from '../../lib/apiErrorHandler';
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

export default async function handler(req, res) {
  try {
<<<<<<< HEAD
    // Log request for debugging
    console.log('Personal todos API request:', {
      method: req.method,
      timestamp: new Date().toISOString()
    });

=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
    const user = verifyToken(req);
    
    if (req.method === 'GET') {
      // Get personal todos for user
      const todos = await loadTodos();
      const userTodos = todos.filter(todo => 
        todo.userId === user.id && !todo.classroomId
      );
      return res.status(200).json(userTodos);
      
    } else if (req.method === 'POST') {
<<<<<<< HEAD
      // Validate request data
      validateRequest(req, { text: true, priority: false });
      
      const { text, priority } = req.body;
      
      if (!text?.trim()) {
        throw new Error('Text is required');
=======
      // Create new personal todo
      const { text, priority } = req.body;
      
      if (!text?.trim()) {
        return res.status(400).json({ error: 'Text is required' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      }
      
      const todos = await loadTodos();
      const newTodo = {
        id: uuidv4(),
        userId: user.id,
        text: text.trim(),
        completed: false,
        priority: priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      todos.push(newTodo);
      await saveTodos(todos);
      
<<<<<<< HEAD
      console.log('Todo created successfully:', { todoId: newTodo.id, userId: user.id });
=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
      return res.status(201).json(newTodo);
      
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
<<<<<<< HEAD
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'validation',
        message: 'This endpoint only supports GET and POST methods'
      });
    }
    
  } catch (error) {
    return handleApiError(error, res);
=======
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Personal todos API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}
