import { useState } from 'react';
import EnhancedConfirmationDialog from './EnhancedConfirmationDialog';

/**
 * Demo component showing how to use the notification system with music
 */
export default function NotificationDemo() {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('default');

  const handleShowDialog = (type) => {
    setDialogType(type);
    setShowDialog(true);
  };

  const handleConfirm = () => {
    setShowDialog(false);
    alert('Action confirmed!');
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const getDialogProps = () => {
    switch (dialogType) {
      case 'success':
        return {
          title: 'Success!',
          message: 'Your action was completed successfully.',
          confirmText: 'Great!',
          type: 'success'
        };
      case 'danger':
        return {
          title: 'Are you sure?',
          message: 'This action cannot be undone. Please confirm that you want to proceed.',
          confirmText: 'Delete',
          type: 'danger'
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Please confirm that you want to proceed with this action.',
          confirmText: 'Confirm',
          type: 'default'
        };
    }
  };

  return (
    <div style={{
      padding: '24px',
      background: 'var(--card)',
      borderRadius: '16px',
      border: '1px solid var(--glass-border)',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '16px',
        background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '18px',
        fontWeight: '700'
      }}>
        🔔 Notification Demo
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: 'var(--muted)',
        marginBottom: '20px',
        lineHeight: '1.4'
      }}>
        Test the notification system with your selected music. Each dialog will play your chosen notification sound.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          className="btn"
          onClick={() => handleShowDialog('default')}
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🔔 Default Notification
        </button>
        
        <button
          className="btn"
          onClick={() => handleShowDialog('success')}
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ✅ Success Notification
        </button>
        
        <button
          className="btn"
          onClick={() => handleShowDialog('danger')}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ⚠️ Warning Notification
        </button>
      </div>

      <EnhancedConfirmationDialog
        isOpen={showDialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...getDialogProps()}
      />
    </div>
  );
}