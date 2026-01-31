import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../lib/users';
<<<<<<< HEAD
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler';

=======
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Heartbeat endpoint to track user activity and update last seen timestamp
export default async function handler(req, res) {
<<<<<<< HEAD
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'heartbeat' });

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

    // Skip heartbeat for admin users
    if (payload.isAdmin) {
      console.log('Heartbeat skipped for admin user:', { userId: payload.id });
      return res.json({ success: true, message: 'Admin user - no heartbeat tracking' });
    }

    const user = await findUserByName(payload.name);
    if (!user) {
      throw new Error('User not found');
    }

    // Update last seen timestamp
    user.lastSeen = new Date().toISOString();
    
    await updateUser(user);
    console.log('Heartbeat updated successfully:', { userId: user.id, lastSeen: user.lastSeen });
    res.json({ success: true, lastSeen: user.lastSeen });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'heartbeat';
    return handleApiError(error, res, context);
=======
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

  // Skip heartbeat for admin users
  if (payload.isAdmin) {
    res.json({ success: true, message: 'Admin user - no heartbeat tracking' });
    return;
  }

  const user = await findUserByName(payload.name);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Update last seen timestamp
  user.lastSeen = new Date().toISOString();
  
  try {
    await updateUser(user);
    res.json({ success: true, lastSeen: user.lastSeen });
  } catch (error) {
    console.error('Error updating user heartbeat:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}