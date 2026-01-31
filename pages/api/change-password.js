import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByName, updateUser } from '../../lib/users';
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'change-password' });

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

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    const user = await findUserByName(payload.name);
    if (!user) {
      throw new Error('User not found');
    }

    const ok = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!ok) {
      throw new Error('Current password incorrect');
    }

    const salt = bcrypt.genSaltSync(8);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);

    await updateUser(user);
    console.log('Password changed successfully:', { userId: user.id, name: user.name });
    res.json({ success: true });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'change-password';
    return handleApiError(error, res, context);
  }
}