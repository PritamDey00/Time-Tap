import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { findUserByName, verifyCredentials, deleteUserById } from '../../lib/users';
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
    await deleteUserById(user.id);

    // Clear auth cookie
    res.setHeader('Set-Cookie', serialize('auth', '', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 0
    }));

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not delete account' });
  }
}