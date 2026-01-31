import { verifyCredentials } from '../../lib/users';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'login' });

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

    // Check for admin credentials first
    const isAdmin = name === 'admin' && password === 'admin2007';
    
    if (isAdmin) {
      // Admin login - create JWT with admin flag
      const payload = { 
        id: 'admin', 
        name: 'admin', 
        isAdmin: true 
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      res.setHeader('Set-Cookie', serialize('auth', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      }));
      
      console.log('Admin login successful');
      return res.json({ 
        user: { 
          id: 'admin', 
          name: 'admin', 
          points: 0, 
          streak: 0,
          isAdmin: true 
        } 
      });
    }

    // Regular student login flow
    const user = await verifyCredentials({ name, password });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const payload = { id: user.id, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.setHeader('Set-Cookie', serialize('auth', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    }));
    
    console.log('User login successful:', { userId: user.id, name: user.name });
    res.json({ user: { id: user.id, name: user.name, points: user.points, streak: user.streak } });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'login';
    return handleApiError(error, res, context);
  }
}