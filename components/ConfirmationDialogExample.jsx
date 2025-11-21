import { useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import ConfirmButton from './ConfirmButton';

export default function ConfirmationDialogExample() {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('default');
  const [result, setResult] = useState('');

  const handleShowDialog = (type) => {
    setDialogType(type);
    setShowDialog(true);
    setResult('');
  };

  const handleConfirm = () => {
    setShowDialog(false);
    setResult(`Confirmed ${dialogType} action!`);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setResult(`Cancelled ${dialogType} action.`);
  };

  const handleConfirmButtonAction = (type) => {
    setResult(`ConfirmButton ${type} action executed!`);
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      background: 'var(--card)',
      borderRadius: '20px',
      border: '2px solid var(--glass-border)',
      boxShadow: 'var(--soft-shadow)'
    }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Confirmation Dialog System Demo
      </h2>

      {/* Manual Dialog Examples */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Manual Dialog Examples</h3>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => handleShowDialog('default')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Default Dialog
          </button>
          <button
            onClick={() => handleShowDialog('success')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Success Dialog
          </button>
          <button
            onClick={() => handleShowDialog('danger')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Danger Dialog
          </button>
        </div>
      </div>

      {/* ConfirmButton Examples */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>ConfirmButton Examples</h3>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <ConfirmButton
            type="default"
            confirmTitle="Confirm Action"
            confirmMessage="Are you sure you want to proceed with this action?"
            onClick={() => handleConfirmButtonAction('default')}
          >
            Default Confirm Button
          </ConfirmButton>

          <ConfirmButton
            type="success"
            confirmTitle="Save Changes"
            confirmMessage="This will save all your changes. Continue?"
            confirmText="Save"
            onClick={() => handleConfirmButtonAction('save')}
          >
            Save Changes
          </ConfirmButton>

          <ConfirmButton
            type="danger"
            confirmTitle="Delete Item"
            confirmMessage="This action cannot be undone. Are you sure you want to delete this item?"
            confirmText="Delete"
            onClick={() => handleConfirmButtonAction('delete')}
          >
            Delete Item
          </ConfirmButton>

          <ConfirmButton
            onClick={() => handleConfirmButtonAction('no-confirm')}
          >
            No Confirmation Needed
          </ConfirmButton>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'var(--card-secondary)',
          border: '1px solid var(--glass-border)',
          color: 'var(--primary)',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          Result: {result}
        </div>
      )}

      {/* Manual Dialog */}
      <ConfirmationDialog
        isOpen={showDialog}
        title={
          dialogType === 'default' ? 'Confirm Action' :
          dialogType === 'success' ? 'Success Action' :
          'Dangerous Action'
        }
        message={
          dialogType === 'default' ? 'Are you sure you want to proceed with this action?' :
          dialogType === 'success' ? 'This will complete the operation successfully.' :
          'This action is potentially dangerous and cannot be undone.'
        }
        confirmText={
          dialogType === 'default' ? 'Confirm' :
          dialogType === 'success' ? 'Complete' :
          'Delete'
        }
        type={dialogType}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}