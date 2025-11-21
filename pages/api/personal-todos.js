import { loadTodos, saveTodos } from '../../lib/todos';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { v4 as uuidv4 } from 'uuid';

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
    const user = verifyToken(req);
    
    if (req.method === 'GET') {
      // Get personal todos for user
      const todos = await loadTodos();
      const userTodos = todos.filter(todo => 
        todo.userId === user.id && !todo.classroomId
      );
      return res.status(200).json(userTodos);
      
    } else if (req.method === 'POST') {
      // Create new personal todo
      const { text, priority } = req.body;
      
      if (!text?.trim()) {
        return res.status(400).json({ error: 'Text is required' });
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
      
      return res.status(201).json(newTodo);
      
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Personal todos API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
