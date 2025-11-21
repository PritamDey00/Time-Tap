import { useEffect } from 'react';
import audioManager from '../lib/audioManager';

export default function ConfirmationDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  type = 'default', // 'default', 'danger', 'success'
  playNotificationSound = true,
  userMusicPreference = 'music1.mp3'
}) {
  // Close dialog on escape key and play notification sound
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
      
      // Play notification sound when dialog opens
      if (playNotificationSound) {
        audioManager.playNotificationSound(userMusicPreference).catch((error) => {
          console.warn('Could not play notification sound:', error);
        });
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel, playNotificationSound, userMusicPreference]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirmBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
          confirmHoverBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          iconColor: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        };
      case 'success':
        return {
          confirmBg: 'linear-gradient(135deg, #22c55e, #16a34a)',
          confirmHoverBg: 'linear-gradient(135deg, #16a34a, #15803d)',
          iconColor: '#22c55e',
          borderColor: 'rgba(34, 197, 94, 0.3)'
        };
      default:
        return {
          confirmBg: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          confirmHoverBg: 'linear-gradient(135deg, var(--theme-secondary), var(--theme-primary))',
          iconColor: 'var(--theme-primary)',
          borderColor: 'var(--glass-border)'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <>
      {/* Blur background overlay */}
      <div 
        className="confirmation-dialog-overlay"
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {/* Dialog container */}
        <div 
          className="confirmation-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: `2px solid ${typeStyles.borderColor}`,
            borderRadius: '24px',
            boxShadow: 'var(--soft-shadow), 0 0 40px var(--theme-primary)20',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            animation: 'slideInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background gradient effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: typeStyles.confirmBg,
            borderRadius: '22px 22px 0 0'
          }} />

          {/* Dialog content */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `${typeStyles.iconColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px',
              color: typeStyles.iconColor
            }}>
              {type === 'danger' ? '⚠️' : type === 'success' ? '✅' : '❓'}
            </div>

            {/* Title */}
            {title && (
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--primary)',
                lineHeight: '1.3'
              }}>
                {title}
              </h3>
            )}

            {/* Message */}
            {message && (
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: 'var(--muted)',
                lineHeight: '1.5',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                {message}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Cancel button */}
            <button
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid var(--glass-border)',
                background: 'var(--card-secondary)',
                color: 'var(--primary)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '100px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.background = 'var(--card)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = 'var(--card-secondary)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {cancelText}
            </button>

            {/* Confirm button */}
            <button
              onClick={onConfirm}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: typeStyles.confirmBg,
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '100px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.background = typeStyles.confirmHoverBg;
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = typeStyles.confirmBg;
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Mobile responsive design */
        @media (max-width: 768px) {
          .confirmation-dialog {
            margin: 20px !important;
            padding: 24px !important;
            max-width: calc(100vw - 40px) !important;
            border-radius: 20px !important;
          }

          .confirmation-dialog h3 {
            font-size: 18px !important;
          }

          .confirmation-dialog p {
            font-size: 14px !important;
          }

          .confirmation-dialog button {
            padding: 10px 20px !important;
            font-size: 13px !important;
            min-width: 80px !important;
          }
        }

        @media (max-width: 480px) {
          .confirmation-dialog {
            margin: 16px !important;
            padding: 20px !important;
            border-radius: 16px !important;
          }

          .confirmation-dialog div:first-child {
            width: 48px !important;
            height: 48px !important;
            font-size: 24px !important;
            margin-bottom: 16px !important;
          }

          .confirmation-dialog h3 {
            font-size: 16px !important;
            margin-bottom: 8px !important;
          }

          .confirmation-dialog p {
            font-size: 13px !important;
          }

          .confirmation-dialog > div:last-child {
            flex-direction: column !important;
            gap: 8px !important;
          }

          .confirmation-dialog button {
            width: 100% !important;
            padding: 12px !important;
            min-width: auto !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .confirmation-dialog {
            border-width: 3px !important;
          }

          .confirmation-dialog button {
            border-width: 2px !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .confirmation-dialog-overlay,
          .confirmation-dialog {
            animation: none !important;
          }

          .confirmation-dialog button {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}