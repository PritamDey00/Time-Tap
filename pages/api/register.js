<<<<<<< HEAD
import { createUser } from '../../lib/users.js';
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler.js';

export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'register' });

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'method',
        message: 'This endpoint only supports POST requests'
      });
    }

    const { name, password } = req.body || {};
    if (!name || !password) {
      throw new Error('Missing name or password');
    }

    const user = await createUser({ name, password });
    // Do not return passwordHash
    const safe = { id: user.id, name: user.name, points: user.points, streak: user.streak };
    
    console.log('User registered successfully:', { userId: user.id, name: user.name });
    res.status(201).json({ user: safe });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'register';
    return handleApiError(error, res, context);
=======
import { createUser } from '../../lib/users';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { name, password } = req.body || {};
  if (!name || !password) {
    res.status(400).json({ error: 'Missing name or password' });
    return;
  }
  try {
    const user = await createUser({ name, password });
    // Do not return passwordHash
    const safe = { id: user.id, name: user.name, points: user.points, streak: user.streak };
    res.status(201).json({ user: safe });
  } catch (e) {
    if (e.message === 'already_exists') {
      res.status(409).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
  }
}