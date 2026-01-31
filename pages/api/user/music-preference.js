import { updateUserMusicPreference } from '../../../lib/users';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from JWT token
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { notificationMusic } = req.body;

    // Validate music file name
    const validMusicFiles = [
      'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3',
      'music5.mp3', 'music6.mp3', 'music7.mp3'
    ];

    if (!notificationMusic || !validMusicFiles.includes(notificationMusic)) {
      return res.status(400).json({ error: 'Invalid music file selection' });
    }

    // Update the user's music preference
    const updatedUser = await updateUserMusicPreference(decoded.userId, notificationMusic);

    res.json({ 
      success: true, 
      user: updatedUser,
      message: 'Music preference updated successfully'
    });
  } catch (error) {
    console.error('Error updating music preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}