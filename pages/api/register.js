import { createUser } from '../../lib/users';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { name, password } = req.body || {};
  if (!name || !password) {
    res.status(400).json({ error: 'Missing name or password' });
    return;
  }
  try {
    const user = await createUser({ name, password });
    // Do not return passwordHash
    const safe = { id: user.id, name: user.name, points: user.points, streak: user.streak };
    res.status(201).json({ user: safe });
  } catch (e) {
    if (e.message === 'already_exists') {
      res.status(409).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}