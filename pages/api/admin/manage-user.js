import jwt from 'jsonwebtoken';
import { findUserByName, updateUser, deleteUserById, loadUsers } from '../../../lib/users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Check authentication
  const cookie = req.headers.cookie || '';
  const auth = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
  if (!auth) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const token = auth.split('=')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Check if user is admin
  if (!payload.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const { action, userId, points, streak } = req.body;

  try {
    switch (action) {
      case 'delete-user':
        if (!userId) {
          return res.status(400).json({ error: 'User ID required' });
        }
        
        await deleteUserById(userId);
        res.json({ success: true, message: 'User deleted successfully' });
        break;

      case 'set-points':
        if (!userId || points === undefined) {
          return res.status(400).json({ error: 'User ID and points required' });
        }
        
        const users = await loadUsers();
        const user = users.find(u => u.id === userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        user.points = Math.max(0, parseInt(points));
        if (streak !== undefined) {
          user.streak = Math.max(0, parseInt(streak));
        }
        
        const updatedUser = await updateUser(user);
        res.json({ 
          success: true, 
          message: 'User updated successfully',
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            points: updatedUser.points,
            streak: updatedUser.streak
          }
        });
        break;

      case 'reset-user':
        if (!userId) {
          return res.status(400).json({ error: 'User ID required' });
        }
        
        const allUsers = await loadUsers();
        const userToReset = allUsers.find(u => u.id === userId);
        if (!userToReset) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        userToReset.points = 0;
        userToReset.streak = 0;
        userToReset.lastConfirm = null;
        
        const resetUser = await updateUser(userToReset);
        res.json({ 
          success: true, 
          message: 'User reset successfully',
          user: {
            id: resetUser.id,
            name: resetUser.name,
            points: resetUser.points,
            streak: resetUser.streak
          }
        });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin manage user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}