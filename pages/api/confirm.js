import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../lib/users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Clock-synchronized confirmation: windows open at :00-:01 and :30-:31 of every hour
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' }); return;
  }
  const cookie = req.headers.cookie || '';
  const auth = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
  if (!auth) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const token = auth.split('=')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' }); return;
  }
  const user = await findUserByName(payload.name);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const now = new Date();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();

  // Check if we're in a valid confirmation window (skip check for admin user)
  const isInFirstWindow = currentMinutes === 0 && currentSeconds < 60; // :00:00 to :00:59
  const isInSecondWindow = currentMinutes === 30 && currentSeconds < 60; // :30:00 to :30:59
  const isAdmin = user.name === 'admin';

  if (!isInFirstWindow && !isInSecondWindow && !isAdmin) {
    res.status(400).json({
      error: 'Outside confirmation window. Next window opens at :00 or :30 of the hour.',
      nextWindow: currentMinutes < 30 ? ':30' : ':00 (next hour)'
    });
    return;
  }

  // Check if user already confirmed in this window to prevent double confirmations
  const lastConfirmTime = user.lastConfirm ? new Date(user.lastConfirm) : null;
  if (lastConfirmTime) {
    const lastConfirmHour = lastConfirmTime.getHours();
    const lastConfirmMinute = lastConfirmTime.getMinutes();
    const currentHour = now.getHours();

    // Check if already confirmed in current window
    const sameHour = lastConfirmHour === currentHour;
    const confirmedInSameWindow = sameHour && (
      (isInFirstWindow && lastConfirmMinute === 0) ||
      (isInSecondWindow && lastConfirmMinute === 30)
    );

    if (confirmedInSameWindow) {
      res.status(400).json({
        error: 'Already confirmed in this window. Wait for next confirmation window.',
        nextWindow: isInFirstWindow ? ':30' : ':00 (next hour)'
      });
      return;
    }
  }

  // Calculate streak logic based on consecutive confirmations
  let pointsAwarded = 1;
  let newStreak = 1;

  if (lastConfirmTime && user.streak > 0) {
    // Check if this continues a streak (confirmed in previous window)
    const timeSinceLastConfirm = now.getTime() - lastConfirmTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    // Streak continues if confirmed within reasonable time of last window
    if (timeSinceLastConfirm <= oneHour + 5 * 60 * 1000) { // Allow 5 min grace period
      pointsAwarded = 2;
      newStreak = user.streak + 1;
    }
  }

  user.points = (user.points || 0) + pointsAwarded;
  user.streak = newStreak;
  user.lastConfirm = now.toISOString();

  const updated = await updateUser(user);
  res.json({
    user: {
      id: updated.id,
      name: updated.name,
      points: updated.points,
      streak: updated.streak,
      lastConfirm: updated.lastConfirm
    },
    pointsAwarded,
    windowType: isInFirstWindow ? ':00 window' : ':30 window'
  });
}