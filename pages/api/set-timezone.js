import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../lib/users';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/*
  Save a user's preferred timezone string (e.g. "America/New_York") into their profile.
  Client can detect timezone via Intl and call this API to keep server-side timing consistent.
*/
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

  const { timezone } = req.body || {};
  if (!timezone || typeof timezone !== 'string') return res.status(400).json({ error: 'Missing timezone' });

  const user = await findUserByName(payload.name);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Minimal validation: check that Intl accepts it
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid timezone' });
  }

  user.timezone = timezone;
  await updateUser(user);

  res.json({ success: true, timezone });
}