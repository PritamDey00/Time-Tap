import { useState, useEffect } from 'react';
import AccountPanel from './AccountPanel';

export default function AccountButton({ user, onUserUpdate }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
      }
    };

    if (isPanelOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isPanelOpen]);

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleToggleAnonymous = (updatedUser) => {
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Account button - positioned in top left */}
      <button
        className="account-button"
        onClick={handleTogglePanel}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '16px',
          border: '2px solid var(--glass-border)',
          background: 'var(--glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'var(--soft-shadow), 0 0 20px var(--theme-primary)15',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 997,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--primary)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.05)';
          e.target.style.boxShadow = 'var(--soft-shadow), 0 0 30px var(--theme-primary)25';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = 'var(--soft-shadow), 0 0 20px var(--theme-primary)15';
        }}
        title={isPanelOpen ? 'Close account panel' : 'Open account panel'}
      >
        {/* Button background gradient effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isPanelOpen 
            ? 'linear-gradient(135deg, var(--theme-primary)20, var(--theme-secondary)20)'
            : 'transparent',
          borderRadius: '14px',
          transition: 'all 0.3s ease'
        }} />
        
        {/* Button content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          transition: 'all 0.3s ease'
        }}>
          {isPanelOpen ? (
            <span style={{ 
              fontSize: '16px',
              transform: 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }}>
              ←
            </span>
          ) : (
            <>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Account" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '10px',
                    objectFit: 'cover'
                  }} 
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Hover effect overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          transition: 'left 0.5s ease'
        }} className="hover-shine" />
      </button>

      {/* Account Panel */}
      <AccountPanel 
        user={user}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onToggleAnonymous={handleToggleAnonymous}
      />

      <style jsx>{`
        .account-button:hover .hover-shine {
          left: 100%;
        }
        
        /* Comprehensive mobile fixes for account panel icon display */
        @media (max-width: 768px) {
          .account-button {
            top: max(16px, env(safe-area-inset-top, 16px)) !important;
            left: max(16px, env(safe-area-inset-left, 16px)) !important;
            width: 46px !important;
            height: 46px !important;
            /* Ensure button stays within viewport bounds */
            position: fixed !important;
            z-index: 999 !important;
            /* Prevent any overflow or clipping */
            overflow: visible !important;
            /* Ensure proper box model */
            box-sizing: border-box !important;
            /* Prevent browser zoom issues */
            transform-origin: top left !important;
          }
          
          /* Adjust inner content for mobile */
          .account-button > div:last-child {
            width: 30px !important;
            height: 30px !important;
          }
          
          .account-button img,
          .account-button > div:last-child > div {
            width: 28px !important;
            height: 28px !important;
            font-size: 12px !important;
          }
        }
        
        @media (max-width: 600px) {
          .account-button {
            top: max(14px, env(safe-area-inset-top, 14px)) !important;
            left: max(14px, env(safe-area-inset-left, 14px)) !important;
            width: 44px !important;
            height: 44px !important;
            /* Additional mobile-specific constraints */
            min-width: 44px !important;
            min-height: 44px !important;
            /* Ensure touch target accessibility */
            touch-action: manipulation !important;
          }
          
          /* Adjust inner content */
          .account-button > div:last-child {
            width: 28px !important;
            height: 28px !important;
          }
          
          .account-button img,
          .account-button > div:last-child > div {
            width: 26px !important;
            height: 26px !important;
            font-size: 11px !important;
          }
          
          /* Adjust close arrow for mobile */
          .account-button span {
            font-size: 14px !important;
          }
        }
        
        @media (max-width: 480px) {
          .account-button {
            top: max(12px, env(safe-area-inset-top, 12px)) !important;
            left: max(12px, env(safe-area-inset-left, 12px)) !important;
            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;
            min-height: 42px !important;
            /* Extra small screen optimizations */
            border-width: 1.5px !important;
            border-radius: 14px !important;
          }
          
          /* Adjust inner content for very small screens */
          .account-button > div:last-child {
            width: 26px !important;
            height: 26px !important;
          }
          
          .account-button img,
          .account-button > div:last-child > div {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
            border-radius: 8px !important;
          }
          
          /* Adjust close arrow for very small screens */
          .account-button span {
            font-size: 12px !important;
          }
        }
        
        /* Extra small screens and landscape phones */
        @media (max-width: 360px) {
          .account-button {
            top: max(10px, env(safe-area-inset-top, 10px)) !important;
            left: max(10px, env(safe-area-inset-left, 10px)) !important;
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            border-radius: 12px !important;
          }
          
          .account-button > div:last-child {
            width: 24px !important;
            height: 24px !important;
          }
          
          .account-button img,
          .account-button > div:last-child > div {
            width: 22px !important;
            height: 22px !important;
            font-size: 9px !important;
            border-radius: 6px !important;
          }
        }
        
        /* Landscape orientation optimizations */
        @media (max-width: 768px) and (orientation: landscape) {
          .account-button {
            top: max(8px, env(safe-area-inset-top, 8px)) !important;
            left: max(12px, env(safe-area-inset-left, 12px)) !important;
            /* Slightly smaller in landscape to save vertical space */
            width: 40px !important;
            height: 40px !important;
          }
        }
        
        /* High DPI displays - prevent scaling issues */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .account-button {
            /* Ensure crisp rendering on high DPI displays */
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
        }
        
        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          .account-button {
            /* iOS Safari safe area handling */
            top: max(16px, constant(safe-area-inset-top), env(safe-area-inset-top)) !important;
            left: max(16px, constant(safe-area-inset-left), env(safe-area-inset-left)) !important;
            /* Prevent iOS zoom on double tap */
            touch-action: manipulation !important;
            /* Prevent iOS selection highlighting */
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
          }
        }
        
        /* Android Chrome specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) and (min-resolution: .001dpcm) {
          .account-button {
            /* Android Chrome optimizations */
            will-change: transform !important;
            /* Prevent Android zoom issues */
            touch-action: manipulation !important;
          }
        }
        
        /* Prevent button from being affected by page zoom */
        @media (max-width: 768px) {
          .account-button {
            /* Maintain consistent sizing regardless of zoom level */
            zoom: 1 !important;
            /* Prevent transform scaling issues */
            transform: none !important;
          }
          
          .account-button:hover {
            transform: none !important;
          }
          
          .account-button:active {
            transform: scale(0.95) !important;
          }
        }
        
        /* Ensure button is always visible and accessible */
        @media (max-width: 768px) {
          .account-button {
            /* Prevent any parent container from hiding the button */
            visibility: visible !important;
            opacity: 1 !important;
            display: flex !important;
            /* Ensure it's above all other content */
            z-index: 999999 !important;
            /* Prevent any clipping */
            clip: auto !important;
            clip-path: none !important;
            /* Ensure proper stacking context */
            isolation: isolate !important;
          }
        }
      `}</style>
    </>
  );
}