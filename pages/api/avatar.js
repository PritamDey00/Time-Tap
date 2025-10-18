import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../lib/users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// body: { avatar: "<data-url>" }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cookie = req.headers.cookie || '';
  const auth = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });

  const token = auth.split('=')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { avatar } = req.body || {};
  if (!avatar) return res.status(400).json({ error: 'No avatar provided' });

  const user = await findUserByName(payload.name);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Basic validation: accept data URLs only (client sends FileReader result)
  if (typeof avatar !== 'string' || !avatar.startsWith('data:')) {
    return res.status(400).json({ error: 'Invalid avatar format' });
  }

  user.avatar = avatar;
  await updateUser(user);
  res.json({ success: true, avatar: user.avatar });
}