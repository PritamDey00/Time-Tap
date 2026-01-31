import jwt from 'jsonwebtoken';
import { findUserByName, updateUser } from '../../lib/users';
import { addMemberToClassroom } from '../../lib/classrooms';
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
    let user = await findUserByName(payload.name);
    if (!user) return res.status(200).json({ user: null });

    // Ensure user is in Universal Classroom (migration for existing users)
    if (!user.joinedClassrooms) {
      user.joinedClassrooms = [];
    }
    
    if (!user.joinedClassrooms.includes('universal')) {
      try {
        // Add to user's joined classrooms list
        user.joinedClassrooms.push('universal');
        await updateUser(user.id, { joinedClassrooms: user.joinedClassrooms });
        
        // Add to universal classroom members list
        await addMemberToClassroom('universal', user.id);
      } catch (error) {
        console.error('Failed to add user to universal classroom:', error);
        // Don't fail the request if classroom addition fails
      }
    }

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
      timezone: tz,
      isAnonymous: user.isAnonymous || false,
      anonymousName: user.anonymousName || null
    };
    res.json({ user: safe });
  } catch (e) {
    res.status(200).json({ user: null });
  }
}