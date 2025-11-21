import jwt from 'jsonwebtoken';
import { findClassroomById, addMemberToClassroom, verifyClassroomPassword } from '../../../../lib/classrooms';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.query;
  const { password } = req.body;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid classroom ID' });
  }

  try {
    const classroom = await findClassroomById(id);
    
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Check if user is already a member
    if (classroom.members.includes(user.id)) {
      return res.status(200).json({ 
        message: 'Already a member of this classroom',
        classroom: {
          id: classroom.id,
          name: classroom.name,
          memberCount: classroom.members.length
        }
      });
    }
    
    // Verify password if classroom is password protected
    if (classroom.passwordHash) {
      const isPasswordValid = await verifyClassroomPassword(id, password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid classroom password' });
      }
    }
    
    // Add user to classroom
    const updatedClassroom = await addMemberToClassroom(id, user.id);
    
    // Update user's joined classrooms list
    try {
      const userData = await findUserById(user.id);
      if (userData) {
        const joinedClassrooms = userData.joinedClassrooms || [];
        if (!joinedClassrooms.includes(id)) {
          joinedClassrooms.push(id);
          await updateUser(user.id, { joinedClassrooms });
        }
      }
    } catch (userError) {
      console.error('Error updating user classroom list:', userError);
      // Don't fail the join operation if user update fails
    }
    
    res.status(200).json({ 
      message: 'Successfully joined classroom',
      classroom: {
        id: updatedClassroom.id,
        name: updatedClassroom.name,
        memberCount: updatedClassroom.members.length
      }
    });
  } catch (error) {
    console.error('Error joining classroom:', error);
    if (error.message === 'Classroom is full') {
      res.status(400).json({ error: 'Classroom is full' });
    } else {
      res.status(500).json({ error: 'Failed to join classroom' });
    }
  }
}