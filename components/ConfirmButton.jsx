import { useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

export default function ConfirmButton({
  children,
  onClick,
  confirmTitle,
  confirmMessage,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default', // 'default', 'danger', 'success'
  disabled = false,
  style = {},
  className = '',
  ...buttonProps
}) {
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    // If no confirmation is needed, call onClick directly
    if (!confirmTitle && !confirmMessage) {
      onClick && onClick(e);
      return;
    }
    
    // Show confirmation dialog
    setShowDialog(true);
  };

  const handleConfirm = () => {
    setShowDialog(false);
    onClick && onClick();
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const getButtonStyles = () => {
    const baseStyles = {
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      opacity: disabled ? 0.6 : 1,
      ...style
    };

    switch (type) {
      case 'danger':
        return {
          ...baseStyles,
          background: disabled 
            ? 'var(--muted)' 
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          boxShadow: disabled ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)'
        };
      case 'success':
        return {
          ...baseStyles,
          background: disabled 
            ? 'var(--muted)' 
            : 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: 'white',
          boxShadow: disabled ? 'none' : '0 4px 12px rgba(34, 197, 94, 0.3)'
        };
      default:
        return {
          ...baseStyles,
          background: disabled 
            ? 'var(--muted)' 
            : 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          color: 'white',
          boxShadow: disabled ? 'none' : '0 4px 12px var(--theme-primary)30'
        };
    }
  };

  const getHoverStyles = () => {
    if (disabled) return {};
    
    switch (type) {
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)'
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px rgba(34, 197, 94, 0.4)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, var(--theme-secondary), var(--theme-primary))',
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px var(--theme-primary)40'
        };
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        className={`confirm-button ${className}`}
        style={getButtonStyles()}
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            Object.assign(e.target.style, getHoverStyles());
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            Object.assign(e.target.style, getButtonStyles());
          }
        }}
        onMouseDown={(e) => {
          if (!disabled) {
            e.target.style.transform = 'translateY(0) scale(0.98)';
          }
        }}
        onMouseUp={(e) => {
          if (!disabled) {
            e.target.style.transform = 'translateY(-1px) scale(1)';
          }
        }}
      >
        {children}
      </button>

      <ConfirmationDialog
        isOpen={showDialog}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        cancelText={cancelText}
        type={type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <style jsx>{`
        .confirm-button {
          position: relative;
          overflow: hidden;
        }

        .confirm-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .confirm-button:hover::before {
          left: 100%;
        }

        /* Mobile responsive design */
        @media (max-width: 768px) {
          .confirm-button {
            padding: 10px 20px !important;
            font-size: 13px !important;
            border-radius: 10px !important;
          }
        }

        @media (max-width: 480px) {
          .confirm-button {
            padding: 12px 16px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
            min-height: 44px !important; /* Ensure touch target size */
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .confirm-button {
            border: 2px solid currentColor !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .confirm-button,
          .confirm-button::before {
            transition: none !important;
          }
        }

        /* Focus styles for accessibility */
        .confirm-button:focus {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
        }

        .confirm-button:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>
    </>
  );
}