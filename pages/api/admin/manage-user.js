import jwt from 'jsonwebtoken';
import { findUserByName, updateUser, deleteUserById, loadUsers } from '../../../lib/users';
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
        res.json({ success: true, message: 'User deleted successfully' });
        break;

      case 'set-points':
        if (!userId || points === undefined) {
          throw new Error('User ID and points required');
        }
        
        const users = await loadUsers();
        const user = users.find(u => u.id === userId);
        if (!user) {
          throw new Error('User not found');
        }
        
        user.points = Math.max(0, parseInt(points));
        if (streak !== undefined) {
          user.streak = Math.max(0, parseInt(streak));
        }
        
        const updatedUser = await updateUser(user);
        console.log('User points updated by admin:', { userId, points: updatedUser.points, adminId: payload.id });
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
          throw new Error('User ID required');
        }
        
        const allUsers = await loadUsers();
        const userToReset = allUsers.find(u => u.id === userId);
        if (!userToReset) {
          throw new Error('User not found');
        }
        
        userToReset.points = 0;
        userToReset.streak = 0;
        userToReset.lastConfirm = null;
        
        const resetUser = await updateUser(userToReset);
        console.log('User reset by admin:', { userId, adminId: payload.id });
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
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'admin/manage-user';
    return handleApiError(error, res, context);
  }
}