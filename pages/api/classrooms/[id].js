import jwt from 'jsonwebtoken';
import { findClassroomById, updateClassroom } from '../../../lib/classrooms';

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

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid classroom ID' });
  }

  if (req.method === 'GET') {
    try {
      const classroom = await findClassroomById(id);
      
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      // Return safe classroom data
      const safeClassroom = {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        avatar: classroom.avatar,
        createdBy: classroom.createdBy,
        createdAt: classroom.createdAt,
        memberCount: classroom.members.length,
        isUniversal: classroom.isUniversal,
        hasPassword: !!classroom.passwordHash,
        settings: classroom.settings,
        // Include member list for classroom members or creators
        members: classroom.members.includes(user.id) || classroom.createdBy === user.id 
          ? classroom.members 
          : undefined
      };
      
      res.json({ classroom: safeClassroom });
    } catch (error) {
      console.error('Error loading classroom:', error);
      res.status(500).json({ error: 'Failed to load classroom' });
    }
  } else if (req.method === 'PUT') {
    try {
      const classroom = await findClassroomById(id);
      
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      // Only classroom creator can update settings
      if (classroom.createdBy !== user.id) {
        return res.status(403).json({ error: 'Only the classroom creator can update settings' });
      }
      
      const { name, description, avatar, password, settings } = req.body;
      
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (avatar !== undefined) updates.avatar = avatar;
      if (password !== undefined) updates.password = password;
      if (settings !== undefined) updates.settings = { ...classroom.settings, ...settings };
      
      const updatedClassroom = await updateClassroom(id, updates);
      
      // Return safe classroom data
      const safeClassroom = {
        id: updatedClassroom.id,
        name: updatedClassroom.name,
        description: updatedClassroom.description,
        avatar: updatedClassroom.avatar,
        createdBy: updatedClassroom.createdBy,
        createdAt: updatedClassroom.createdAt,
        memberCount: updatedClassroom.members.length,
        isUniversal: updatedClassroom.isUniversal,
        hasPassword: !!updatedClassroom.passwordHash,
        settings: updatedClassroom.settings
      };
      
      res.json({ classroom: safeClassroom });
    } catch (error) {
      console.error('Error updating classroom:', error);
      if (error.message.includes('Validation failed')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update classroom' });
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}