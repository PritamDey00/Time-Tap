import { loadTodos, saveTodos } from '../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError, validateRequest } from '../../lib/apiErrorHandler';

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
    // Log request for debugging
    console.log('Personal todos API request:', {
      method: req.method,
      timestamp: new Date().toISOString()
    });

    const user = verifyToken(req);
    
    if (req.method === 'GET') {
      // Get personal todos for user
      const todos = await loadTodos();
      const userTodos = todos.filter(todo => 
        todo.userId === user.id && !todo.classroomId
      );
      return res.status(200).json(userTodos);
      
    } else if (req.method === 'POST') {
      // Validate request data
      validateRequest(req, { text: true, priority: false });
      
      const { text, priority } = req.body;
      
      if (!text?.trim()) {
        throw new Error('Text is required');
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
      
      console.log('Todo created successfully:', { todoId: newTodo.id, userId: user.id });
      return res.status(201).json(newTodo);
      
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'validation',
        message: 'This endpoint only supports GET and POST methods'
      });
    }
    
  } catch (error) {
    return handleApiError(error, res);
  }
}
