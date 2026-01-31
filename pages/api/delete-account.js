import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { findUserByName, verifyCredentials, deleteUserById } from '../../lib/users';
<<<<<<< HEAD
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'delete-account' });

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'method',
        message: 'This endpoint only supports POST requests'
      });
    }

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

    const { password } = req.body || {};
    if (!password) {
      throw new Error('Password required to confirm deletion');
    }

    const user = await findUserByName(payload.name);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password before deletion
    const valid = await verifyCredentials({ name: user.name, password });
    if (!valid) {
      throw new Error('Incorrect password');
    }

=======
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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

  const { password } = req.body || {};
  if (!password) {
    res.status(400).json({ error: 'Password required to confirm deletion' });
    return;
  }

  const user = await findUserByName(payload.name);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Verify password before deletion
  const valid = await verifyCredentials({ name: user.name, password });
  if (!valid) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  try {
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
    await deleteUserById(user.id);

    // Clear auth cookie
    res.setHeader('Set-Cookie', serialize('auth', '', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 0
    }));

<<<<<<< HEAD
    console.log('Account deleted successfully:', { userId: user.id, name: user.name });
    res.json({ success: true });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'delete-account';
    return handleApiError(error, res, context);
=======
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not delete account' });
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}