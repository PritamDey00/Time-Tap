import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../../lib/users';
import { handleApiError, getRequestContext, logApiRequest } from '../../../lib/apiErrorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'admin/test-points' });

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

    const user = await findUserByName(payload.name);
    if (!user) {
      throw new Error('User not found');
    }

    const { action, points, streak } = req.body;

    if (!action) {
      throw new Error('Action is required');
    }

    switch (action) {
      case 'add-points':
        user.points = (user.points || 0) + (points || 1);
        break;
      case 'set-points':
        user.points = points || 0;
        break;
      case 'set-streak':
        user.streak = streak || 0;
        break;
      case 'reset-all':
        user.points = 0;
        user.streak = 0;
        user.lastConfirm = null;
        break;
      default:
        throw new Error('Invalid action');
    }

    const updated = await updateUser(user);

    console.log('Test points updated:', { 
      userId: updated.id, 
      action, 
      points: updated.points, 
      streak: updated.streak 
    });

    res.json({ 
      success: true, 
      user: { 
        id: updated.id, 
        name: updated.name, 
        points: updated.points,
        streak: updated.streak,
        lastConfirm: updated.lastConfirm
      } 
    });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'admin/test-points';
    return handleApiError(error, res, context);
  }
}