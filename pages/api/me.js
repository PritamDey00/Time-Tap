import jwt from 'jsonwebtoken';
import { findUserByName } from '../../lib/users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const auth = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
  if (!auth) {
    res.status(200).json({ user: null });
    return;
  }
  const token = auth.split('=')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findUserByName(payload.name);
    if (!user) return res.status(200).json({ user: null });

    // default timezone to Asia/Kolkata when not present
    const tz = user.timezone || 'Asia/Kolkata';

    const safe = {
      id: user.id,
      name: user.name,
      points: user.points,
      streak: user.streak,
      lastConfirm: user.lastConfirm,
      createdAt: user.createdAt,
      avatar: user.avatar || null,
      timezone: tz
    };
    res.json({ user: safe });
  } catch (e) {
    res.status(200).json({ user: null });
  }
}