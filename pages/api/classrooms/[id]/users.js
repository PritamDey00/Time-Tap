import { loadUsers } from '../../../../lib/users';
import { findClassroomById } from '../../../../lib/classrooms';

function calculateOnlineStatus(lastSeen) {
  if (!lastSeen) return 'offline';
  
  const now = new Date();
  const lastSeenTime = new Date(lastSeen);
  const diffMinutes = (now - lastSeenTime) / (1000 * 60);
  
  // Consider user online if they were active within last 5 minutes
  if (diffMinutes <= 5) return 'online';
  
  // Consider user away if they were active within last 30 minutes
  if (diffMinutes <= 30) return 'away';
  
  // Otherwise offline
  return 'offline';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: classroomId } = req.query;

  try {
    // Get classroom to verify it exists and get member list
    const classroom = await findClassroomById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Load all users
    const allUsers = await loadUsers();
    
    // Filter users to include:
    // 1. Current classroom members (from classroom.members array)
    // 2. Users who have joined the classroom (from user.joinedClassrooms array) but haven't left
    const classroomUsers = allUsers.filter(user => {
      // Include if user is in classroom members list
      if (classroom.members.includes(user.id)) {
        return true;
      }
      
      // Include if user has joined this classroom (for offline retention)
      if (user.joinedClassrooms && user.joinedClassrooms.includes(classroomId)) {
        return true;
      }
      
      return false;
    });

    // Sort by online status first (online > away > offline), then by points desc, then name
    classroomUsers.sort((a, b) => {
      const aStatus = calculateOnlineStatus(a.lastSeen);
      const bStatus = calculateOnlineStatus(b.lastSeen);
      
      // Priority order: online > away > offline
      const statusPriority = { online: 3, away: 2, offline: 1 };
      const statusDiff = statusPriority[bStatus] - statusPriority[aStatus];
      
      if (statusDiff !== 0) return statusDiff;
      
      // If same status, sort by points desc, then name
      return b.points - a.points || a.name.localeCompare(b.name);
    });

    // Prepare safe user data with anonymous mode handling
    const safeUsers = classroomUsers.map(u => ({
      id: u.id,
      name: u.isAnonymous ? (u.anonymousName || 'Anonymous User') : u.name,
      points: u.points,
      streak: u.streak,
      lastConfirm: u.lastConfirm,
      avatar: u.isAnonymous ? null : (u.avatar || null),
      lastSeen: u.lastSeen || null,
      onlineStatus: calculateOnlineStatus(u.lastSeen),
      isAnonymous: u.isAnonymous || false,
      anonymousName: u.anonymousName || null,
      // Add flag to indicate if user has explicitly joined this classroom
      hasJoinedClassroom: u.joinedClassrooms && u.joinedClassrooms.includes(classroomId)
    }));

    res.json({ 
      users: safeUsers,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        memberCount: classroom.members.length,
        totalParticipants: safeUsers.length // Include offline users who haven't left
      }
    });

  } catch (error) {
    console.error('Error fetching classroom users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}