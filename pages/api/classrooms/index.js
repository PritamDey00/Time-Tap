import jwt from 'jsonwebtoken';
import { createClassroom, loadClassrooms } from '../../../lib/classrooms';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authenticateUser(req) {
  const cookie = req.headers.cookie || '';
  const auth = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
  if (!auth) return null;
  
  const token = auth.split('=')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    try {
      const { search } = req.query;
      let classrooms = await loadClassrooms();
      
      // Filter by search term if provided
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase().trim();
        classrooms = classrooms.filter(classroom => 
          classroom.name.toLowerCase().includes(searchTerm) ||
          (classroom.description && classroom.description.toLowerCase().includes(searchTerm))
        );
      }
      
      // Remove sensitive data from response
      const safeClassrooms = classrooms.map(classroom => ({
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        avatar: classroom.avatar,
        createdBy: classroom.createdBy,
        createdAt: classroom.createdAt,
        memberCount: classroom.members.length,
        members: classroom.members, // Include members array for membership checks
        isUniversal: classroom.isUniversal,
        hasPassword: !!classroom.passwordHash,
        settings: {
          allowAnonymous: classroom.settings.allowAnonymous,
          maxMembers: classroom.settings.maxMembers
        }
      }));
      
      res.json({ classrooms: safeClassrooms });
    } catch (error) {
      console.error('Error loading classrooms:', error);
      res.status(500).json({ error: 'Failed to load classrooms' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, avatar, password, settings } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      const classroom = await createClassroom({
        name,
        description,
        avatar,
        password,
        createdBy: user.id,
        settings
      });
      
      // Return safe classroom data
      const safeClassroom = {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        avatar: classroom.avatar,
        createdBy: classroom.createdBy,
        createdAt: classroom.createdAt,
        memberCount: classroom.members.length,
        members: classroom.members, // Include members array for membership checks
        isUniversal: classroom.isUniversal,
        hasPassword: !!classroom.passwordHash,
        settings: classroom.settings
      };
      
      res.status(201).json({ classroom: safeClassroom });
    } catch (error) {
      console.error('Error creating classroom:', error);
      if (error.message.includes('Validation failed') || error.message.includes('already exists')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create classroom' });
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}