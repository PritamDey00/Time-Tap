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

  const { lastConfirm } = req.body;
  if (!lastConfirm) {
    res.status(400).json({ error: 'lastConfirm timestamp required' });
    return;
  }

  // Validate the timestamp format
  try {
    new Date(lastConfirm).toISOString();
  } catch (e) {
    res.status(400).json({ error: 'Invalid timestamp format' });
    return;
  }

  // Update user's lastConfirm
  user.lastConfirm = lastConfirm;
  const updated = await updateUser(user);

  res.json({ 
    success: true, 
    user: { 
      id: updated.id, 
      name: updated.name, 
      lastConfirm: updated.lastConfirm 
    } 
  });
}