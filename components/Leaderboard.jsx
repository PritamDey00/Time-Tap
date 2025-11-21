import React, { memo, useMemo, useState, useEffect } from 'react';
import CustomScrollbar from './CustomScrollbar';

const Leaderboard = memo(function Leaderboard({ users = [], me, className = '', maxHeight = '400px' }) {
  // Track previous positions for smooth animations
  const prevPositionsRef = React.useRef({});
  
  // Calculate position changes
  const positionChanges = useMemo(() => {
    const changes = {};
    users.forEach((user, index) => {
      const prevIndex = prevPositionsRef.current[user.id];
      if (prevIndex !== undefined && prevIndex !== index) {
        changes[user.id] = {
          from: prevIndex,
          to: index,
          direction: index < prevIndex ? 'up' : 'down'
        };
      }
    });
    
    // Update positions
    users.forEach((user, index) => {
      prevPositionsRef.current[user.id] = index;
    });
    
    return changes;
  }, [users]);
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

  // Enhanced styling for current user row
  const getCurrentUserRowStyle = (user) => {
    if (user.id !== me?.id) return {};
    
    return {
      background: 'linear-gradient(90deg, var(--theme-primary)15, var(--theme-secondary)10)',
      border: '1px solid var(--theme-primary)30',
      boxShadow: '0 2px 8px var(--theme-primary)20',
      transform: 'scale(1.02)',
    };
  };

  // Enhanced styling for offline users
  const getOfflineUserStyle = (user) => {
    if (user.onlineStatus !== 'offline') return {};
    
    return {
      opacity: 0.7,
      filter: 'grayscale(20%)',
    };
  };

  // Memoized row styles for performance
  const memoizedRowStyles = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = {
        ...getCurrentUserRowStyle(user),
        ...getOfflineUserStyle(user),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      };
      return acc;
    }, {});
  }, [users, me?.id]);

  const getRowStyle = (user) => memoizedRowStyles[user.id] || {};

  const LeaderboardContent = () => (
    <div className="leaderboard-content leaderboard-smooth-update" role="list" aria-label="User rankings">
      {users.map((u, index) => (
        <div
          key={u.id}
          className={`lb-row leaderboard-row-enhanced ${positionChanges[u.id] ? `position-change-${positionChanges[u.id].direction}` : ''}`}
          style={getRowStyle(u)}
          role="listitem"
          aria-label={`Rank ${index + 1}: ${u.isAnonymous ? (u.anonymousName || 'Anonymous User') : (u.name || 'Unknown User')}, ${u.points} points, ${u.streak} day streak, ${getStatusText(u.onlineStatus)}`}
          tabIndex={0}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
            <div
              className="avatar leaderboard-avatar-enhanced"
              style={{
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              {u.avatar && !u.isAnonymous ? (
                <img
                  src={u.avatar}
                  alt={`${u.isAnonymous ? 'Anonymous user' : u.name} avatar`}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    borderRadius: 8,
                    transition: 'all 0.3s ease'
                  }}
                />
              ) : (
                <div style={{ 
                  fontWeight: 700,
                  transition: 'all 0.3s ease'
                }}>
                  {u.isAnonymous 
                    ? '👤' 
                    : (u.name || '').slice(0, 2).toUpperCase()
                  }
                </div>
              )}
              
              {/* Enhanced online status indicator */}
              <div
                className="status-indicator leaderboard-status-enhanced"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(u.onlineStatus),
                  border: '2px solid var(--card)',
                  boxShadow: `0 0 8px ${getStatusColor(u.onlineStatus)}40`,
                  transition: 'all 0.3s ease',
                }}
                title={getStatusText(u.onlineStatus)}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 100px)' }}>
              <div style={{ 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                overflow: 'hidden',
                flexWrap: 'wrap'
              }}>
                <div className="username-tooltip">
                  <span 
                    className="leaderboard-username"
                    style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      color: u.id === me?.id ? 'var(--theme-primary)' : 'var(--primary)',
                      transition: 'color 0.3s ease',
                      maxWidth: '100%',
                      display: 'inline-block',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {u.isAnonymous ? (u.anonymousName || 'Anonymous User') : (u.name || 'Unknown User')}
                  </span>
                  {/* Show tooltip for names longer than 12 characters on mobile, 20 on desktop */}
                  {((u.isAnonymous ? (u.anonymousName || 'Anonymous User') : (u.name || 'Unknown User')).length > 12) && (
                    <div className="tooltip-content">
                      {u.isAnonymous ? (u.anonymousName || 'Anonymous User') : (u.name || 'Unknown User')}
                    </div>
                  )}
                </div>
                
                {/* Enhanced anonymous indicator */}
                {u.isAnonymous && (
                  <span 
                    className="leaderboard-anonymous-badge"
                    style={{
                      fontSize: '10px',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--theme-primary)20',
                      color: 'var(--theme-primary)',
                      fontWeight: 500,
                      flexShrink: 0,
                      border: '1px solid var(--theme-primary)30',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    👤
                  </span>
                )}
                
                {/* Enhanced status badges */}
                {u.onlineStatus === 'online' && (
                  <span 
                    className="leaderboard-status-badge online"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontWeight: 600,
                      flexShrink: 0,
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 0 4px rgba(16, 185, 129, 0.2)',
                      animation: 'pulse-online 2s infinite',
                    }}
                  >
                    LIVE
                  </span>
                )}
                {u.onlineStatus === 'away' && (
                  <span 
                    className="leaderboard-status-badge away"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      fontWeight: 600,
                      flexShrink: 0,
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    AWAY
                  </span>
                )}
                {u.onlineStatus === 'offline' && (
                  <span 
                    className="leaderboard-status-badge offline"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(107, 114, 128, 0.15)',
                      color: '#6b7280',
                      fontWeight: 600,
                      flexShrink: 0,
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                    }}
                  >
                    OFFLINE
                  </span>
                )}
              </div>
              
              <div className="small leaderboard-user-info" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                color: 'var(--muted)',
                transition: 'color 0.3s ease',
              }}>
                <span>{u.streak ? `${u.streak} streak` : '—'}</span>
                <span style={{ 
                  fontSize: '8px', 
                  color: getStatusColor(u.onlineStatus),
                  fontWeight: 600,
                  opacity: 0.8,
                }}>
                  • {getStatusText(u.onlineStatus).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div 
            className="leaderboard-points"
            style={{ 
              textAlign: 'right', 
              flexShrink: 0,
              transition: 'all 0.3s ease',
              minWidth: '70px',
              width: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              fontWeight: 700,
              color: u.id === me?.id ? 'var(--theme-primary)' : 'var(--primary)',
              fontSize: u.id === me?.id ? '16px' : '14px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              lineHeight: 1.2
            }}>
              {u.points?.toLocaleString() || '0'}
            </div>
            <div className="small" style={{ 
              color: 'var(--muted)',
              transition: 'color 0.3s ease',
              fontSize: '11px',
              lineHeight: 1
            }}>
              pts
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        /* Leaderboard content container with smooth updates */
        .leaderboard-content {
          padding: 0;
          margin: 0;
        }

        /* Smooth update animation - prevents flickering */
        .leaderboard-smooth-update {
          animation: smoothFadeIn 0.3s ease-in-out;
        }

        @keyframes smoothFadeIn {
          0% {
            opacity: 0.95;
          }
          100% {
            opacity: 1;
          }
        }

        /* Position change animations */
        .position-change-up {
          animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px var(--theme-primary)40 !important;
        }

        .position-change-down {
          animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          0% {
            transform: translateY(60px);
            opacity: 0.5;
            background: linear-gradient(90deg, var(--theme-primary)20, var(--theme-secondary)15);
          }
          50% {
            transform: translateY(-5px);
            opacity: 1;
            background: linear-gradient(90deg, var(--theme-primary)25, var(--theme-secondary)20);
            box-shadow: 0 8px 30px var(--theme-primary)50;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          0% {
            transform: translateY(-60px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(5px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Prevent layout shift during updates */
        .leaderboard-content {
          min-height: 50px;
          will-change: contents;
          contain: layout style;
        }

        /* Base leaderboard row styling with optimized transitions */
        .lb-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          margin: 0 0 8px 0;
          background: var(--card-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
          will-change: transform;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .lb-row:last-child {
          margin-bottom: 0;
        }

        .lb-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, var(--theme-primary)05, var(--theme-secondary)05);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }

        .lb-row:hover::before {
          opacity: 1;
        }

        .lb-row > * {
          position: relative;
          z-index: 1;
        }

        /* Avatar styling */
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px var(--theme-primary)30;
        }

        /* Enhanced leaderboard row styling with smooth animations */
        .leaderboard-row-enhanced {
          position: relative;
          transform-origin: left center;
          will-change: transform, box-shadow;
        }

        .leaderboard-row-enhanced:hover {
          transform: translateX(8px) scale(1.02) !important;
          box-shadow: 0 12px 35px var(--theme-primary)20, 0 4px 15px var(--theme-primary)15 !important;
          border-color: var(--theme-primary)60 !important;
          z-index: 10;
        }
        
        .leaderboard-row-enhanced:hover .leaderboard-avatar-enhanced {
          transform: scale(1.15) rotate(2deg);
          box-shadow: 0 8px 25px var(--theme-primary)50;
          filter: brightness(1.1);
        }
        
        .leaderboard-row-enhanced:hover .leaderboard-username {
          color: var(--theme-primary) !important;
          text-shadow: 0 0 8px var(--theme-primary)30;
        }
        
        .leaderboard-row-enhanced:hover .leaderboard-points {
          transform: scale(1.08);
          color: var(--theme-primary) !important;
          text-shadow: 0 0 8px var(--theme-primary)30;
        }
        
        .leaderboard-row-enhanced:hover .leaderboard-status-enhanced {
          transform: scale(1.3);
          box-shadow: 0 0 16px currentColor !important;
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 16px currentColor;
          }
          50% {
            box-shadow: 0 0 24px currentColor;
          }
        }
        
        /* Anonymous badge hover effect with enhanced animation */
        .leaderboard-row-enhanced:hover .leaderboard-anonymous-badge {
          background-color: var(--theme-primary)40 !important;
          border-color: var(--theme-primary)70 !important;
          transform: scale(1.15) rotate(-2deg);
          box-shadow: 0 4px 12px var(--theme-primary)30;
        }

        /* Status badge enhanced animations */
        .leaderboard-status-badge {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }

        .leaderboard-row-enhanced:hover .leaderboard-status-badge {
          transform: scale(1.1);
          box-shadow: 0 4px 12px currentColor;
        }

        .leaderboard-row-enhanced:hover .leaderboard-status-badge.online {
          animation: bounce-glow 0.6s ease-in-out;
        }

        @keyframes bounce-glow {
          0%, 100% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 6px 20px currentColor;
          }
        }
        
        /* Status badge animations */
        @keyframes pulse-online {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95);
          }
        }
        
        /* Theme-specific enhancements - Modular Design System */
        
        /* Light Theme (Default) */
        .leaderboard-row-enhanced {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.8);
          backdrop-filter: blur(10px);
        }

        .leaderboard-row-enhanced:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }

        /* Dark Theme */
        :global(.dark) .leaderboard-row-enhanced {
          background: rgba(30, 41, 59, 0.8) !important;
          border: 1px solid rgba(71, 85, 105, 0.4) !important;
          backdrop-filter: blur(15px);
        }

        :global(.dark) .leaderboard-row-enhanced:hover {
          background: rgba(30, 41, 59, 0.95) !important;
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25) !important;
        }

        :global(.dark) .leaderboard-content {
          color: #e2e8f0;
        }
        
        /* Ocean Theme (Dark Blue) */
        :global(.dark-blue) .leaderboard-row-enhanced {
          background: rgba(30, 58, 138, 0.2) !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          backdrop-filter: blur(12px);
        }

        :global(.dark-blue) .leaderboard-row-enhanced:hover {
          background: rgba(30, 58, 138, 0.35) !important;
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3) !important;
        }

        :global(.dark-blue) .leaderboard-content {
          color: #dbeafe;
        }
        
        /* Rose Theme (Pink) */
        :global(.pink) .leaderboard-row-enhanced {
          background: rgba(252, 231, 243, 0.9) !important;
          border: 1px solid rgba(236, 72, 153, 0.25) !important;
          backdrop-filter: blur(10px);
        }

        :global(.pink) .leaderboard-row-enhanced:hover {
          background: rgba(252, 231, 243, 1) !important;
          border-color: rgba(236, 72, 153, 0.5) !important;
          box-shadow: 0 8px 25px rgba(236, 72, 153, 0.2) !important;
        }

        :global(.pink) .leaderboard-content {
          color: #831843;
        }
        
        /* Sunny Theme (Yellow) */
        :global(.yellow) .leaderboard-row-enhanced {
          background: rgba(254, 243, 199, 0.9) !important;
          border: 1px solid rgba(245, 158, 11, 0.25) !important;
          backdrop-filter: blur(10px);
        }

        :global(.yellow) .leaderboard-row-enhanced:hover {
          background: rgba(254, 243, 199, 1) !important;
          border-color: rgba(245, 158, 11, 0.5) !important;
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2) !important;
        }

        :global(.yellow) .leaderboard-content {
          color: #92400e;
        }
        
        /* Nature Theme (Green) */
        :global(.green) .leaderboard-row-enhanced {
          background: rgba(220, 252, 231, 0.9) !important;
          border: 1px solid rgba(34, 197, 94, 0.25) !important;
          backdrop-filter: blur(10px);
        }

        :global(.green) .leaderboard-row-enhanced:hover {
          background: rgba(220, 252, 231, 1) !important;
          border-color: rgba(34, 197, 94, 0.5) !important;
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2) !important;
        }

        :global(.green) .leaderboard-content {
          color: #14532d;
        }

        /* Theme-specific status indicators */
        :global(.dark) .status-dot.online {
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
        }

        :global(.dark-blue) .status-dot.online {
          background-color: #60a5fa;
          box-shadow: 0 0 12px rgba(96, 165, 250, 0.8);
        }

        :global(.pink) .status-dot.online {
          background-color: #f472b6;
          box-shadow: 0 0 12px rgba(244, 114, 182, 0.6);
        }

        :global(.yellow) .status-dot.online {
          background-color: #fbbf24;
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
        }

        :global(.green) .status-dot.online {
          background-color: #34d399;
          box-shadow: 0 0 12px rgba(52, 211, 153, 0.6);
        }
        
        /* Enhanced PC display optimizations - Wider for long names */
        @media (min-width: 1200px) {
          .leaderboard-row-enhanced {
            padding: 20px 18px !important;
            gap: 16px !important;
            min-height: 80px;
          }
          
          .leaderboard-avatar-enhanced {
            width: 52px !important;
            height: 52px !important;
          }
          
          .leaderboard-username {
            font-size: 16px !important;
            font-weight: 600 !important;
            max-width: 280px !important;
            line-height: 1.3;
          }
          
          .leaderboard-points {
            font-size: 18px !important;
            min-width: 85px !important;
            width: 85px !important;
            text-align: right;
          }
          
          .leaderboard-user-info {
            font-size: 13px !important;
          }
          
          .leaderboard-status-badge {
            font-size: 11px !important;
            padding: 3px 8px !important;
          }

          /* Wider container for PC */
          .leaderboard-unified-scroll {
            min-width: 420px;
          }
        }

        /* Enhanced tablet display optimizations - Better text handling */
        @media (min-width: 769px) and (max-width: 1199px) {
          .leaderboard-row-enhanced {
            padding: 18px 16px !important;
            gap: 14px !important;
            min-height: 72px;
          }
          
          .leaderboard-avatar-enhanced {
            width: 48px !important;
            height: 48px !important;
          }
          
          .leaderboard-username {
            font-size: 15px !important;
            font-weight: 600 !important;
            max-width: 220px !important;
            line-height: 1.3;
          }
          
          .leaderboard-points {
            font-size: 16px !important;
            min-width: 75px !important;
            width: 75px !important;
            text-align: right;
          }
          
          .leaderboard-user-info {
            font-size: 12px !important;
          }

          /* Wider container for tablet */
          .leaderboard-unified-scroll {
            min-width: 380px;
          }
        }

        /* Enhanced mobile responsive design */
        @media (max-width: 768px) {
          .leaderboard-row-enhanced {
            padding: 10px 8px !important;
            gap: 8px !important;
            flex-wrap: nowrap !important;
          }
          
          .leaderboard-avatar-enhanced {
            width: 36px !important;
            height: 36px !important;
            flex-shrink: 0 !important;
          }
          
          .leaderboard-status-enhanced {
            width: 10px !important;
            height: 10px !important;
            bottom: -1px !important;
            right: -1px !important;
          }
          
          .leaderboard-status-badge {
            font-size: 9px !important;
            padding: 2px 4px !important;
            border-radius: 6px !important;
          }
          
          .leaderboard-username {
            font-size: 14px !important;
            font-weight: 600 !important;
            max-width: 120px !important;
          }
          
          .leaderboard-points {
            font-size: 14px !important;
            min-width: 50px !important;
            width: 50px !important;
            text-align: right !important;
          }
          
          .leaderboard-user-info {
            font-size: 11px !important;
          }
        }
        
        @media (max-width: 480px) {
          .leaderboard-row-enhanced {
            padding: 8px 6px !important;
            gap: 6px !important;
          }
          
          .leaderboard-avatar-enhanced {
            width: 32px !important;
            height: 32px !important;
          }
          
          .leaderboard-status-enhanced {
            width: 8px !important;
            height: 8px !important;
          }
          
          .leaderboard-status-badge {
            font-size: 8px !important;
            padding: 1px 3px !important;
          }
          
          .leaderboard-username {
            font-size: 13px !important;
          }
          
          .leaderboard-points {
            font-size: 13px !important;
            min-width: 35px !important;
          }
          
          .leaderboard-user-info {
            font-size: 10px !important;
          }
          
          .leaderboard-anonymous-badge {
            font-size: 8px !important;
            padding: 1px 3px !important;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .leaderboard-row-enhanced {
            border: 2px solid var(--primary) !important;
          }
          
          .leaderboard-status-badge {
            border-width: 2px !important;
          }
        }
        
        /* Enhanced tooltip styles for long names */
        .username-tooltip {
          position: relative;
          display: inline-block;
          width: 100%;
          max-width: 100%;
        }
        
        .username-tooltip .tooltip-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%);
          background: var(--card);
          color: var(--primary);
          text-align: center;
          border-radius: 10px;
          padding: 10px 14px;
          z-index: 1000;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          border: 1px solid var(--glass-border);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(15px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          max-width: 280px;
          word-wrap: break-word;
          white-space: normal;
          line-height: 1.3;
        }
        
        .username-tooltip .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: var(--card) transparent transparent transparent;
        }
        
        .username-tooltip:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-4px);
        }

        /* Prevent text overflow and ensure proper alignment */
        .leaderboard-row-enhanced {
          align-items: stretch;
        }

        .leaderboard-row-enhanced > div:first-child {
          align-items: center;
        }

        /* Better text wrapping for very long names */
        @media (max-width: 768px) {
          .leaderboard-username {
            max-width: 140px !important;
            font-size: 13px !important;
          }

          .username-tooltip .tooltip-content {
            max-width: 200px;
            font-size: 12px;
          }
        }

        @media (min-width: 1200px) {
          .username-tooltip .tooltip-content {
            max-width: 320px;
            font-size: 14px;
          }
        }
        
        /* Ensure tooltip doesn't interfere with mobile touch */
        @media (hover: none) and (pointer: coarse) {
          .username-tooltip .tooltip-content {
            display: none;
          }
        }

        /* Staggered animation entrance for rows */
        .leaderboard-content .leaderboard-row-enhanced {
          animation: slideInUp 0.4s ease-out;
          animation-fill-mode: both;
        }

        .leaderboard-content .leaderboard-row-enhanced:nth-child(1) { animation-delay: 0.1s; }
        .leaderboard-content .leaderboard-row-enhanced:nth-child(2) { animation-delay: 0.15s; }
        .leaderboard-content .leaderboard-row-enhanced:nth-child(3) { animation-delay: 0.2s; }
        .leaderboard-content .leaderboard-row-enhanced:nth-child(4) { animation-delay: 0.25s; }
        .leaderboard-content .leaderboard-row-enhanced:nth-child(5) { animation-delay: 0.3s; }
        .leaderboard-content .leaderboard-row-enhanced:nth-child(n+6) { animation-delay: 0.35s; }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Focus states for accessibility */
        .leaderboard-row-enhanced:focus,
        .leaderboard-row-enhanced:focus-within {
          outline: 3px solid var(--theme-primary);
          outline-offset: 2px;
          border-radius: 12px;
          z-index: 20;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .leaderboard-row-enhanced {
            border: 2px solid var(--primary);
          }
          
          .leaderboard-status-badge {
            border: 2px solid currentColor;
          }
          
          .avatar {
            border: 2px solid var(--primary);
          }
        }

        /* Screen reader announcements */
        .leaderboard-row-enhanced::after {
          content: '';
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .leaderboard-row-enhanced,
          .leaderboard-avatar-enhanced,
          .leaderboard-username,
          .leaderboard-points,
          .leaderboard-status-enhanced,
          .leaderboard-anonymous-badge,
          .leaderboard-status-badge {
            transition: none !important;
            animation: none !important;
          }
          
          .leaderboard-row-enhanced:hover {
            transform: none !important;
          }
          
          .username-tooltip .tooltip-content {
            transition: none !important;
          }

          .leaderboard-content .leaderboard-row-enhanced {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );

  // Always use unified scroll container for consistent experience
  return (
    <CustomScrollbar
      variant="leaderboard-unified"
      maxHeight={maxHeight}
      className={`leaderboard-unified-scroll ${className}`.trim()}
      smoothScroll={true}
      autoHide={false}
    >
      <LeaderboardContent />
    </CustomScrollbar>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if users data or me.id actually changed
  if (prevProps.me?.id !== nextProps.me?.id) return false;
  if (prevProps.users.length !== nextProps.users.length) return false;
  
  // Deep comparison of users array
  const usersChanged = JSON.stringify(prevProps.users) !== JSON.stringify(nextProps.users);
  return !usersChanged; // Return true to skip re-render if nothing changed
});

export default Leaderboard;


