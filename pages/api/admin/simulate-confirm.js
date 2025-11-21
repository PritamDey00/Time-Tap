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

  const { scenario } = req.body;
  const now = Date.now();

  switch (scenario) {
    case 'successful-confirm':
      // Simulate successful confirmation
      let pointsAwarded = 1;
      if (user.streak && user.streak > 0) {
        pointsAwarded = 2;
        user.streak = user.streak + 1;
      } else {
        user.streak = 1;
      }
      user.points = (user.points || 0) + pointsAwarded;
      user.lastConfirm = new Date(now).toISOString();
      break;

    case 'missed-window':
      // Simulate missed window - reset streak
      user.streak = 0;
      user.lastConfirm = new Date(now).toISOString();
      break;

    case 'build-streak':
      // Build up a streak for testing
      user.streak = 5;
      user.points = (user.points || 0) + 10;
      user.lastConfirm = new Date(now - 35 * 60 * 1000).toISOString(); // 35 minutes ago
      break;

    case 'new-user':
      // Reset to new user state
      user.points = 0;
      user.streak = 0;
      user.lastConfirm = null;
      break;

    default:
      return res.status(400).json({ error: 'Invalid scenario' });
  }

  const updated = await updateUser(user);

  res.json({ 
    success: true, 
    scenario,
    user: { 
      id: updated.id, 
      name: updated.name, 
      points: updated.points,
      streak: updated.streak,
      lastConfirm: updated.lastConfirm
    } 
  });
}