import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByName, updateUser } from '../../lib/users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

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

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  const user = await findUserByName(payload.name);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const ok = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Current password incorrect' });

  const salt = bcrypt.genSaltSync(8);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);

  await updateUser(user);
  res.json({ success: true });
}