import { useState, useEffect } from 'react';
import Router from 'next/router';

export default function AccountPanel({ user, isOpen, onClose, onToggleAnonymous }) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAnonymous(user.isAnonymous || false);
    }
  }, [user]);

  const handleToggleAnonymous = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/anonymous', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsAnonymous(data.user.isAnonymous);
        if (onToggleAnonymous) {
          onToggleAnonymous(data.user);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to toggle anonymous mode');
      }
    } catch (error) {
      console.error('Error toggling anonymous mode:', error);
      alert('Network error while toggling anonymous mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/logout', { method: 'POST' });
      Router.push('/');
    } catch (err) {
      console.error('logout error', err);
      Router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Blur background overlay */}
      <div 
        className="account-panel-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 998,
          animation: 'fadeIn 0.3s ease'
        }}
      />
      
      {/* Account panel */}
      <div 
        className="account-panel"
        style={{
          position: 'fixed',
          top: '80px',
          left: '20px',
          width: '320px',
          maxWidth: 'calc(100vw - 40px)',
          background: 'var(--glass)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '2px solid var(--glass-border)',
          borderRadius: '20px',
          boxShadow: 'var(--soft-shadow), 0 0 40px var(--theme-primary)20',
          padding: '24px',
          zIndex: 999,
          animation: 'slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* User info section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--card-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 8px 25px var(--theme-primary)30'
          }}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ 
                fontWeight: 700, 
                color: 'white', 
                fontSize: '20px' 
              }}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 700, 
              fontSize: '16px', 
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {isAnonymous ? (user.anonymousName || 'Anonymous User') : user.name}
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: '12px'
            }}>
              <span style={{
                padding: '2px 6px',
                background: 'linear-gradient(135deg, var(--theme-primary)20, var(--theme-secondary)20)',
                borderRadius: '6px',
                fontWeight: '600',
                color: 'var(--theme-primary)'
              }}>
                🏆 {user.points} pts
              </span>
              <span style={{
                padding: '2px 6px',
                background: 'linear-gradient(135deg, var(--theme-accent)20, var(--theme-primary)20)',
                borderRadius: '6px',
                fontWeight: '600',
                color: 'var(--theme-accent)'
              }}>
                🔥 {user.streak || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Anonymous mode toggle */}
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: isAnonymous 
            ? 'linear-gradient(135deg, var(--theme-accent)10, var(--theme-primary)10)' 
            : 'var(--card-secondary)',
          borderRadius: '12px',
          border: `1px solid ${isAnonymous ? 'var(--theme-accent)30' : 'var(--glass-border)'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              <span>{isAnonymous ? '🕶️' : '👤'}</span>
              Anonymous Mode
            </div>
            
            <button
              onClick={handleToggleAnonymous}
              disabled={isLoading}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: isAnonymous 
                  ? 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' 
                  : 'var(--muted)',
                position: 'relative',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: isAnonymous ? '26px' : '2px',
                transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }} />
            </button>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: '1.4'
          }}>
            {isAnonymous 
              ? 'Your identity is hidden in classrooms. Others will see you as "' + (user.anonymousName || 'Anonymous User') + '"'
              : 'Toggle to hide your identity in classrooms and appear as an anonymous user'
            }
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button 
            className="btn secondary"
            onClick={() => {
              onClose();
              Router.push('/dashboard');
            }}
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            🏠 Dashboard
          </button>
          
          <button 
            className="btn secondary"
            onClick={() => {
              onClose();
              Router.push('/classrooms');
            }}
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            🏫 Classrooms
          </button>
          
          <button 
            className="btn secondary"
            onClick={() => {
              onClose();
              Router.push('/account');
            }}
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            ⚙️ Account Settings
          </button>
          
          <button 
            className="btn"
            onClick={handleLogout}
            disabled={isLoading}
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              background: '#ef4444',
              marginTop: '8px'
            }}
          >
            {isLoading ? '⏳ Signing out...' : '🚪 Sign Out'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0;
            transform: translateX(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .account-panel {
            top: 70px !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            max-width: none !important;
            padding: 20px !important;
          }

          /* Enhanced touch targets */
          .account-panel button {
            min-height: 44px !important;
            padding: 12px 16px !important;
            font-size: 16px !important;
          }

          /* Anonymous mode toggle */
          .account-panel button[style*="width: 48px"] {
            min-width: 48px !important;
            min-height: 28px !important;
          }
        }

        @media (max-width: 600px) {
          .account-panel {
            top: 60px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
            max-width: none !important;
            padding: 16px !important;
            border-radius: 16px !important;
          }

          /* User info section mobile optimization */
          .account-panel div[style*="display: flex"][style*="gap: 16px"] {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }

          /* Avatar sizing for mobile */
          .account-panel div[style*="width: 60px"] {
            width: 50px !important;
            height: 50px !important;
          }

          /* Anonymous mode section mobile */
          .account-panel div[style*="margin-bottom: 20px"] {
            margin-bottom: 16px !important;
            padding: 12px !important;
          }

          /* Button improvements for mobile */
          .account-panel button {
            font-size: 15px !important;
            padding: 12px 16px !important;
          }
        }

        @media (max-width: 480px) {
          .account-panel {
            top: 55px !important;
            left: 6px !important;
            right: 6px !important;
            padding: 14px !important;
            border-radius: 14px !important;
          }

          /* Smaller avatar for very small screens */
          .account-panel div[style*="width: 60px"] {
            width: 44px !important;
            height: 44px !important;
            font-size: 16px !important;
          }

          /* Compact layout for small screens */
          .account-panel div[style*="margin-bottom: 20px"] {
            margin-bottom: 12px !important;
            padding: 10px !important;
          }

          .account-panel button {
            font-size: 14px !important;
            padding: 10px 14px !important;
          }

          /* Points and streak badges mobile */
          .account-panel div[style*="display: flex"][style*="gap: 8px"] {
            flex-direction: column !important;
            gap: 6px !important;
          }

          .account-panel span[style*="padding: 2px 6px"] {
            padding: 4px 8px !important;
            font-size: 11px !important;
            text-align: center !important;
          }
        }

        /* Touch-specific optimizations */
        @media (hover: none) and (pointer: coarse) {
          .account-panel button:hover {
            transform: none !important;
          }

          .account-panel button:active {
            transform: scale(0.95) !important;
            transition: transform 0.1s ease !important;
          }

          /* Anonymous toggle touch optimization */
          .account-panel button[style*="width: 48px"]:active {
            transform: scale(0.9) !important;
          }
        }

        /* Landscape orientation for mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .account-panel {
            top: 50px !important;
            max-height: calc(100vh - 60px) !important;
            overflow-y: auto !important;
          }

          .account-panel div[style*="display: flex"][style*="gap: 16px"] {
            flex-direction: row !important;
            text-align: left !important;
          }
        }
      `}</style>
    </>
  );
}