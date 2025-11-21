import jwt from 'jsonwebtoken';
import { toggleUserAnonymousMode, findUserByName, findUserById } from '../../../lib/users';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from JWT token - handle both cookie and header formats
    let token = req.cookies.auth;
    
    if (!token) {
      // Try to get from Authorization header as fallback
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find user by name (as used in login.js and me.js) or by id as fallback
    let user;
    if (decoded.name) {
      user = await findUserByName(decoded.name);
    } else if (decoded.id) {
      user = await findUserById(decoded.id);
    }
    
    if (!user) {
      console.error('User not found for token payload:', { name: decoded.name, id: decoded.id });
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle anonymous mode for the user
    const updatedUser = await toggleUserAnonymousMode(user.id);
    
    // Remove sensitive data before sending response
    const { passwordHash, ...safeUser } = updatedUser;

    res.status(200).json({ 
      success: true, 
      user: safeUser,
      message: updatedUser.isAnonymous ? 'Anonymous mode enabled' : 'Anonymous mode disabled'
    });

  } catch (error) {
    console.error('Error toggling anonymous mode:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}