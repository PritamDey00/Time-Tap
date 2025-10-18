export default function Leaderboard({ users = [], me }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981'; // Green
      case 'away': return '#f59e0b';   // Orange/Yellow
      case 'offline': return '#6b7280'; // Gray
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  return (
    <div className="leaderboard">
      {users.map((u) => (
        <div
          key={u.id}
          className="lb-row"
          style={{
            background: u.id === me.id ? 'linear-gradient(90deg, rgb(255 255 255 / 19%), rgb(255 255 255 / 19%))' : 'transparent'
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
            <div
              className="avatar"
              style={{
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {u.avatar ? (
                <img
                  src={u.avatar}
                  alt={`${u.name} avatar`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div style={{ fontWeight: 700 }}>{u.name.slice(0, 2).toUpperCase()}</div>
              )}
              
              {/* Online status indicator */}
              <div
                className="status-indicator"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(u.onlineStatus),
                  border: '2px solid var(--card)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                }}
                title={getStatusText(u.onlineStatus)}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                overflow: 'hidden'
              }}>
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {u.name}
                </span>
                
                {/* Status badge for online users */}
                {u.onlineStatus === 'online' && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    LIVE
                  </span>
                )}
              </div>
              
              <div className="small" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                color: 'var(--muted)'
              }}>
                <span>{u.streak ? `${u.streak} streak` : '—'}</span>
                <span style={{ 
                  fontSize: '8px', 
                  color: getStatusColor(u.onlineStatus),
                  fontWeight: 600
                }}>
                  • {getStatusText(u.onlineStatus).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700 }}>{u.points}</div>
            <div className="small">pts</div>
          </div>
        </div>
      ))}
    </div>
  );
}


