import { useState, useEffect } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * Global Confirmation Dialog Manager
 * Provides a way to show confirmation dialogs from anywhere in the app
 */
export default function ConfirmationDialogManager() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    showCancel: true,
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    // Register global function to show dialog
    if (typeof window !== 'undefined') {
      window.showConfirmationDialog = (options) => {
        setDialogState({
          isOpen: true,
          title: options.title || 'Confirm',
          message: options.message || '',
          type: options.type || 'default',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          showCancel: options.showCancel !== false,
          onConfirm: options.onConfirm || (() => {}),
          onCancel: options.onCancel || (() => {})
        });
      };

      window.hideConfirmationDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showConfirmationDialog;
        delete window.hideConfirmationDialog;
      }
    };
  }, []);

  const handleConfirm = () => {
    dialogState.onConfirm();
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    dialogState.onCancel();
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmationDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      type={dialogState.type}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.showCancel ? dialogState.cancelText : undefined}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      playNotificationSound={false}
    />
  );
}
