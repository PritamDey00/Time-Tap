import jwt from 'jsonwebtoken';
import { findUserByName, updateUser, deleteUserById, loadUsers } from '../../../lib/users';
<<<<<<< HEAD
import { handleApiError, getRequestContext, logApiRequest } from '../../../lib/apiErrorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'admin/manage-user' });

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'method',
        message: 'This endpoint only supports POST requests'
      });
    }

    // Check authentication
    const cookie = req.headers.cookie || '';
    const auth = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
    if (!auth) {
      throw new Error('No token provided');
    }

    const token = auth.split('=')[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      throw new Error('Invalid token');
    }

    // Check if user is admin
    if (!payload.isAdmin) {
      throw new Error('Admin access required');
    }

    const { action, userId, points, streak } = req.body;

    if (!action) {
      throw new Error('Action is required');
    }

    switch (action) {
      case 'delete-user':
        if (!userId) {
          throw new Error('User ID required');
        }
        
        await deleteUserById(userId);
        console.log('User deleted by admin:', { userId, adminId: payload.id });
=======
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
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
        res.json({ success: true, message: 'User deleted successfully' });
        break;

      case 'set-points':
        if (!userId || points === undefined) {
<<<<<<< HEAD
          throw new Error('User ID and points required');
=======
          return res.status(400).json({ error: 'User ID and points required' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
        }
        
        const users = await loadUsers();
        const user = users.find(u => u.id === userId);
        if (!user) {
<<<<<<< HEAD
          throw new Error('User not found');
=======
          return res.status(404).json({ error: 'User not found' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
        }
        
        user.points = Math.max(0, parseInt(points));
        if (streak !== undefined) {
          user.streak = Math.max(0, parseInt(streak));
        }
        
        const updatedUser = await updateUser(user);
<<<<<<< HEAD
        console.log('User points updated by admin:', { userId, points: updatedUser.points, adminId: payload.id });
=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
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
<<<<<<< HEAD
          throw new Error('User ID required');
=======
          return res.status(400).json({ error: 'User ID required' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
        }
        
        const allUsers = await loadUsers();
        const userToReset = allUsers.find(u => u.id === userId);
        if (!userToReset) {
<<<<<<< HEAD
          throw new Error('User not found');
=======
          return res.status(404).json({ error: 'User not found' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
        }
        
        userToReset.points = 0;
        userToReset.streak = 0;
        userToReset.lastConfirm = null;
        
        const resetUser = await updateUser(userToReset);
<<<<<<< HEAD
        console.log('User reset by admin:', { userId, adminId: payload.id });
=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
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
<<<<<<< HEAD
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'admin/manage-user';
    return handleApiError(error, res, context);
=======
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin manage user error:', error);
    res.status(500).json({ error: 'Internal server error' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}