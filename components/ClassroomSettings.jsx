import { useState, useEffect } from 'react';
import ConfirmButton from './ConfirmButton';

export default function ClassroomSettings({ classroom, onSave, onClose, onLeave, user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Initialize form data when classroom prop changes
  useEffect(() => {
    if (classroom) {
      setFormData({
        name: classroom.name || '',
        description: classroom.description || '',
        avatar: classroom.avatar || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [classroom]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Classroom name is required');
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError('Classroom name must be at least 2 characters long');
      return false;
    }

    if (formData.name.trim().length > 50) {
      setError('Classroom name must be less than 50 characters');
      return false;
    }

    if (formData.description.length > 200) {
      setError('Description must be less than 200 characters');
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password && formData.password.length < 4) {
      setError('Password must be at least 4 characters long');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        avatar: formData.avatar.trim()
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/classrooms/${classroom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update classroom');
      }

      setSuccess('Classroom settings updated successfully!');
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      // Call onSave callback with updated classroom data
      if (onSave) {
        onSave(data.classroom);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (err) {
      console.error('Error updating classroom:', err);
      setError(err.message || 'Failed to update classroom settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar emoji selection
  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({
      ...prev,
      avatar: emoji
    }));
  };

  // Common emoji options for classrooms
  const emojiOptions = [
    '🏫', '📚', '🎓', '✏️', '📝', '🔬', '🧮', '🌟',
    '💡', '🎯', '🚀', '⭐', '🏆', '📖', '🎨', '🎵',
    '🌍', '🔥', '💎', '🌈', '⚡', '🎪', '🎭', '🎨'
  ];

  // Handle leave classroom
  const handleLeaveClassroom = async () => {
    setLeaveLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/classrooms/${classroom.id}/leave`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave classroom');
      }

      // Success - redirect to classrooms page
      window.location.href = '/classrooms';
      
    } catch (err) {
      console.error('Error leaving classroom:', err);
      setError(err.message || 'Failed to leave classroom');
      setLeaveLoading(false);
    }
  };

  // Check if user can edit this classroom
  const canEdit = user && classroom && (
    classroom.createdBy === user.id || 
    classroom.isUniversal // Allow editing universal classroom for now
  );

  // Check if user can leave this classroom
  const canLeave = user && classroom && (
    classroom.members?.includes(user.id) && 
    !classroom.isUniversal // Cannot leave universal classroom
  );

  if (!canEdit) {
    return (
      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-header">
            <h3>Classroom Settings</h3>
            <button className="close-btn" onClick={onClose}>
              <span className="close-icon">✕</span>
            </button>
          </div>
          
          <div className="no-permission">
            <div className="no-permission-icon">🔒</div>
            <h4>Access Denied</h4>
            <p>You don't have permission to edit this classroom's settings.</p>
            <p>Only the classroom creator can modify these settings.</p>
          </div>
        </div>

        <style jsx>{`
          .settings-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .settings-card {
            background: var(--glass);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border: 2px solid var(--glass-border);
            border-radius: 20px;
            padding: 24px;
            width: 100%;
            max-width: 400px;
            box-shadow: var(--soft-shadow), 0 0 60px var(--theme-primary)15;
            position: relative;
          }

          .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--glass-border);
          }

          .settings-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .close-btn {
            background: none;
            border: none;
            color: var(--muted);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .close-btn:hover {
            background: var(--card-secondary);
            color: var(--primary);
          }

          .close-icon {
            font-size: 16px;
            font-weight: bold;
          }

          .no-permission {
            text-align: center;
            padding: 20px;
          }

          .no-permission-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.7;
          }

          .no-permission h4 {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--primary);
          }

          .no-permission p {
            margin: 0 0 8px 0;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="settings-header">
          <h3>Classroom Settings</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="close-icon">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Classroom Name */}
          <div className="form-group">
            <label htmlFor="name">Classroom Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter classroom name"
              className="form-input"
              required
              maxLength={50}
              disabled={loading}
            />
            <div className="char-count">
              {formData.name.length}/50
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your classroom (optional)"
              className="form-textarea"
              rows={3}
              maxLength={200}
              disabled={loading}
            />
            <div className="char-count">
              {formData.description.length}/200
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="form-group">
            <label>Classroom Avatar</label>
            <div className="avatar-section">
              <div className="current-avatar">
                <div className="avatar-preview">
                  {formData.avatar || '🏫'}
                </div>
                <input
                  type="text"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="Enter emoji or text"
                  className="avatar-input"
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              
              <div className="emoji-grid">
                {emojiOptions.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`emoji-btn ${formData.avatar === emoji ? 'selected' : ''}`}
                    onClick={() => handleEmojiSelect(emoji)}
                    disabled={loading}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="form-group">
            <label>Password Protection</label>
            <div className="password-section">
              <div className="password-toggle">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="showPassword">
                  {classroom.password ? 'Change password' : 'Add password protection'}
                </label>
              </div>

              {showPassword && (
                <div className="password-inputs">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="New password (min 4 characters)"
                    className="form-input"
                    minLength={4}
                    disabled={loading}
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="message error">
              <span className="message-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="message success">
              <span className="message-icon">✅</span>
              {success}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="btn-icon">💾</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Leave Classroom Section */}
        {canLeave && (
          <div className="leave-section">
            <div className="leave-header">
              <h4>Leave Classroom</h4>
              <p>Once you leave, you'll need to rejoin to participate again.</p>
            </div>
            
            <ConfirmButton
              type="danger"
              confirmTitle={`Leave "${classroom.name}"?`}
              confirmMessage="Are you sure you want to leave this classroom? You'll need to rejoin to participate again."
              confirmText="Leave Classroom"
              cancelText="Cancel"
              onClick={handleLeaveClassroom}
              disabled={leaveLoading}
              style={{
                width: '100%',
                minWidth: 'auto'
              }}
            >
              {leaveLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Leaving...
                </>
              ) : (
                <>
                  <span className="btn-icon">🚪</span>
                  Leave Classroom
                </>
              )}
            </ConfirmButton>
          </div>
        )}


      </div>

      <style jsx>{`
        .settings-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .settings-card {
          background: var(--glass);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 2px solid var(--glass-border);
          border-radius: 20px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--soft-shadow), 0 0 60px var(--theme-primary)15;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--glass-border);
        }

        .settings-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: var(--card-secondary);
          color: var(--primary);
        }

        .close-icon {
          font-size: 16px;
          font-weight: bold;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: var(--primary);
          font-size: 14px;
        }

        .form-input,
        .form-textarea {
          padding: 12px 16px;
          border: 2px solid var(--glass-border);
          border-radius: 12px;
          background: var(--glass);
          backdrop-filter: blur(10px);
          color: var(--primary);
          font-size: 14px;
          transition: all 0.3s ease;
          outline: none;
          font-family: inherit;
        }

        .form-input:focus,
        .form-textarea:focus {
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px var(--theme-primary)20;
          background: var(--card);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: var(--muted);
        }

        .form-input:disabled,
        .form-textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .char-count {
          font-size: 12px;
          color: var(--muted);
          text-align: right;
        }

        /* Avatar Section */
        .avatar-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .current-avatar {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-preview {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
          box-shadow: 0 4px 15px var(--theme-primary)30;
        }

        .avatar-input {
          flex: 1;
          text-align: center;
          font-size: 16px;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
          padding: 12px;
          background: var(--card-secondary);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .emoji-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-btn:hover {
          background: var(--glass);
          transform: scale(1.1);
        }

        .emoji-btn.selected {
          background: var(--theme-primary);
          transform: scale(1.1);
          box-shadow: 0 4px 15px var(--theme-primary)40;
        }

        .emoji-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Password Section */
        .password-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .password-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .password-toggle input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--theme-primary);
        }

        .password-toggle label {
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          margin: 0;
        }

        .password-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: var(--card-secondary);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        /* Messages */
        .message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .message.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--error-color, #dc2626);
        }

        .message.success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.05));
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: var(--success-color, #16a34a);
        }

        .message-icon {
          font-size: 16px;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .btn {
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 120px;
        }

        .btn.primary {
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          color: white;
          box-shadow: 0 4px 15px var(--theme-primary)30;
        }

        .btn.primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn.primary:hover::before {
          left: 100%;
        }

        .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--theme-primary)40;
        }

        .btn.secondary {
          background: var(--glass);
          color: var(--primary);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn.secondary:hover {
          background: var(--card-secondary);
          border-color: var(--theme-primary)50;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        .btn-icon {
          font-size: 16px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Leave Classroom Section */
        .leave-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .leave-header h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--error-color, #dc2626);
        }

        .leave-header p {
          margin: 0;
          font-size: 14px;
          color: var(--muted);
          line-height: 1.5;
        }

        .btn.danger {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }

        .btn.danger::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn.danger:hover::before {
          left: 100%;
        }

        .btn.danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }



        /* Responsive Design */
        @media (max-width: 768px) {
          .settings-container {
            padding: 12px;
          }

          .settings-card {
            max-width: none;
            width: 100%;
            padding: 20px;
          }

          .emoji-grid {
            grid-template-columns: repeat(6, 1fr);
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

        }

        @media (max-width: 480px) {
          .settings-card {
            padding: 16px;
          }

          .current-avatar {
            flex-direction: column;
            text-align: center;
          }

          .emoji-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .emoji-btn {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}