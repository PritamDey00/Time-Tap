import { serialize } from 'cookie';

export default function handler(req, res) {
  // Clear auth cookie
  res.setHeader('Set-Cookie', serialize('auth', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0
  }));
  res.json({ success: true });
}