import { loadUsers } from '../../lib/users';
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler';

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
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'users' });

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'method',
        message: 'This endpoint only supports GET requests'
      });
    }

    const users = await loadUsers();
    
    // sort by online status first (online > away > offline), then by points desc, then name
    users.sort((a, b) => {
      const aStatus = calculateOnlineStatus(a.lastSeen);
      const bStatus = calculateOnlineStatus(b.lastSeen);
      
      // Priority order: online > away > offline
      const statusPriority = { online: 3, away: 2, offline: 1 };
      const statusDiff = statusPriority[bStatus] - statusPriority[aStatus];
      
      if (statusDiff !== 0) return statusDiff;
      
      // If same status, sort by points desc, then name
      return b.points - a.points || a.name.localeCompare(b.name);
    });
    
    // This endpoint is used by the Universal Classroom, so anonymous mode should apply
    const safe = users.map(u => ({
      id: u.id,
      name: u.isAnonymous ? (u.anonymousName || 'Anonymous User') : u.name,
      points: u.points,
      streak: u.streak,
      lastConfirm: u.lastConfirm,
      avatar: u.isAnonymous ? null : (u.avatar || null),
      lastSeen: u.lastSeen || null,
      onlineStatus: calculateOnlineStatus(u.lastSeen),
      isAnonymous: u.isAnonymous || false,
      anonymousName: u.anonymousName || null
    }));
    
    console.log('Users loaded successfully:', { count: safe.length });
    res.json({ users: safe });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'users';
    return handleApiError(error, res, context);
  }
}