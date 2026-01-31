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
  }
}