import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../../lib/users';
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

  const user = await findUserByName(payload.name);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { action, points, streak } = req.body;

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
      return res.status(400).json({ error: 'Invalid action' });
  }

  const updated = await updateUser(user);

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
}