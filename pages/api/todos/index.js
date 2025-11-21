import { getUserClassroomTodos, createTodo } from '../../../lib/todos';
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

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    
    if (req.method === 'GET') {
      // Get todos for user and classroom
      const { userId, classroomId } = req.query;
      
      // Verify user can only access their own todos
      if (userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (!classroomId) {
        return res.status(400).json({ error: 'classroomId is required' });
      }
      
      const todos = await getUserClassroomTodos(userId, classroomId);
      return res.status(200).json(todos);
      
    } else if (req.method === 'POST') {
      // Create new todo
      const { userId, classroomId, text, priority } = req.body;
      
      // Verify user can only create todos for themselves
      if (userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (!classroomId || !text?.trim()) {
        return res.status(400).json({ error: 'classroomId and text are required' });
      }
      
      const todo = await createTodo({
        userId,
        classroomId,
        text: text.trim(),
        priority: priority || 'medium'
      });
      
      return res.status(201).json(todo);
      
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Todo API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}