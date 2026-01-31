import jwt from 'jsonwebtoken';
import { findClassroomById, removeMemberFromClassroom } from '../../../../lib/classrooms';
import { findUserById, updateUser } from '../../../../lib/users';

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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid classroom ID' });
  }

  try {
    const classroom = await findClassroomById(id);
    
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Check if user is a member
    if (!classroom.members.includes(user.id)) {
      return res.status(200).json({ 
        message: 'Not a member of this classroom',
        classroom: {
          id: classroom.id,
          name: classroom.name,
          memberCount: classroom.members.length
        }
      });
    }
    
    // Prevent leaving universal classroom
    if (classroom.isUniversal) {
      return res.status(400).json({ error: 'Cannot leave the universal classroom' });
    }
    
    // Remove user from classroom
    const updatedClassroom = await removeMemberFromClassroom(id, user.id);
    
    // Update user's joined classrooms list
    try {
      const userData = await findUserById(user.id);
      if (userData && userData.joinedClassrooms) {
        const joinedClassrooms = userData.joinedClassrooms.filter(classroomId => classroomId !== id);
        await updateUser(user.id, { joinedClassrooms });
      }
    } catch (userError) {
      console.error('Error updating user classroom list:', userError);
      // Don't fail the leave operation if user update fails
    }
    
    res.status(200).json({ 
      message: 'Successfully left classroom',
      classroom: {
        id: updatedClassroom.id,
        name: updatedClassroom.name,
        memberCount: updatedClassroom.members.length
      }
    });
  } catch (error) {
    console.error('Error leaving classroom:', error);
    res.status(500).json({ error: 'Failed to leave classroom' });
  }
}