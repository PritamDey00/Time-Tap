import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ClassroomList({ user, classrooms = [], onJoin, onCreate }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    password: '',
    hasPassword: false
  });
  const [isCreating, setIsCreating] = useState(false);

  // Filter classrooms based on search term
  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setIsCreating(true);
    try {
      const classroomData = {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        password: createForm.hasPassword ? createForm.password : null
      };
      
      await onCreate(classroomData);
      
      // Reset form and close modal
      setCreateForm({
        name: '',
        description: '',
        password: '',
        hasPassword: false
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create classroom:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinClassroom = async (classroom) => {
    if (classroom.hasPassword && !classroom.members?.includes(user.id)) {
      const password = prompt(`Enter password for "${classroom.name}":`);
      if (!password) return;
      
      try {
        await onJoin(classroom.id, password);
      } catch (error) {
        alert('Incorrect password or failed to join classroom');
      }
    } else {
      await onJoin(classroom.id);
    }
  };

  return (
    <div className="classroom-list-container">
      {/* Search and Create Header */}
      <div className="classroom-header">
        <div className="search-container">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Search classrooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-input search-input"
            />
            <span className="input-icon">🔍</span>
          </div>
        </div>
        
        <button 
          className="btn create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="btn-icon">➕</span>
          Create Classroom
        </button>
      </div>

      {/* Classrooms Grid */}
      <div className="classrooms-grid">
        {filteredClassrooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <h3>No classrooms found</h3>
            <p>
              {searchTerm 
                ? `No classrooms match "${searchTerm}"`
                : "Be the first to create a classroom!"
              }
            </p>
          </div>
        ) : (
          filteredClassrooms.map((classroom) => (
            <div key={classroom.id} className="classroom-card">
              <div className="classroom-header-info">
                <div className="classroom-avatar">
                  {classroom.avatar || '🏫'}
                </div>
                <div className="classroom-info">
                  <h3 className="classroom-name">{classroom.name}</h3>
                  <p className="classroom-description">
                    {classroom.description || 'No description provided'}
                  </p>
                </div>
              </div>
              
              <div className="classroom-meta">
                <div className="classroom-stats">
                  <span className="stat">
                    <span className="stat-icon">👥</span>
                    {classroom.members?.length || 0} members
                  </span>
                  {classroom.hasPassword && (
                    <span className="stat protected">
                      <span className="stat-icon">🔒</span>
                      Protected
                    </span>
                  )}
                </div>
                
                <div className="classroom-actions">
                  {classroom.members?.includes(user.id) ? (
                    <button
                      className="btn primary"
                      onClick={() => router.push(`/classroom/${classroom.id}`)}
                    >
                      <span className="btn-icon">🚪</span>
                      Enter
                    </button>
                  ) : (
                    <button
                      className="btn"
                      onClick={() => handleJoinClassroom(classroom)}
                    >
                      <span className="btn-icon">🚪</span>
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Classroom</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="create-form">
              <div className="form-group">
                <label htmlFor="classroom-name">Classroom Name *</label>
                <input
                  id="classroom-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter classroom name"
                  className="modern-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="classroom-description">Description</label>
                <textarea
                  id="classroom-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your classroom (optional)"
                  className="modern-input textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={createForm.hasPassword}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      hasPassword: e.target.checked,
                      password: e.target.checked ? prev.password : ''
                    }))}
                  />
                  <span className="checkmark"></span>
                  Password protect this classroom
                </label>
              </div>
              
              {createForm.hasPassword && (
                <div className="form-group">
                  <label htmlFor="classroom-password">Password</label>
                  <input
                    id="classroom-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    className="modern-input"
                    required={createForm.hasPassword}
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn"
                  disabled={isCreating || !createForm.name.trim()}
                >
                  {isCreating ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">✨</span>
                      Create Classroom
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .classroom-list-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .classroom-header {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .search-container {
          flex: 1;
          min-width: 280px;
        }

        .search-input {
          padding-left: 50px !important;
        }

        .create-btn {
          white-space: nowrap;
          min-width: 160px;
        }

        .classrooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .classroom-card {
          background: var(--glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid var(--glass-border);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: var(--soft-shadow);
        }

        .classroom-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--theme-primary), var(--theme-secondary), transparent);
          opacity: 0.5;
        }

        .classroom-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--soft-shadow), 0 0 40px var(--theme-primary)20;
          border-color: var(--theme-primary)30;
        }

        .classroom-header-info {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .classroom-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          box-shadow: 0 4px 15px var(--theme-primary)30;
        }

        .classroom-info {
          flex: 1;
          min-width: 0;
        }

        .classroom-name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .classroom-description {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .classroom-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .classroom-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .classroom-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
        }

        .stat.protected {
          color: var(--theme-primary);
        }

        .stat-icon {
          font-size: 14px;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: var(--primary);
          font-size: 20px;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        /* Modal Styles */
        .modal-overlay {
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

        .modal-content {
          background: var(--glass);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 2px solid var(--glass-border);
          border-radius: 24px;
          padding: 32px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--soft-shadow), 0 0 60px var(--theme-primary)20;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--muted);
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: var(--card-secondary);
          color: var(--primary);
        }

        .create-form {
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

        .textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .checkbox-container {
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 500 !important;
        }

        .checkbox-container input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--theme-primary);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .classroom-list-container {
            padding: 20px;
          }

          .classrooms-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .classroom-list-container {
            padding: 16px;
          }

          .classroom-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .search-container {
            min-width: auto;
          }

          .create-btn {
            min-width: auto;
            padding: 12px 16px;
            font-size: 14px;
          }

          .classrooms-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .classroom-card {
            padding: 20px;
          }

          .classroom-meta {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .classroom-actions {
            justify-content: center;
          }

          .classroom-stats {
            justify-content: center;
          }

          .modal-content {
            padding: 24px;
            margin: 16px;
            max-width: calc(100vw - 32px);
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }

          /* Enhanced touch targets for mobile */
          .classroom-card {
            min-height: 120px;
            cursor: pointer;
          }

          .classroom-card .btn {
            min-height: 44px;
            padding: 12px 20px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .classroom-list-container {
            padding: 12px;
          }

          .classroom-header-info {
            gap: 12px;
          }

          .classroom-avatar {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .classroom-name {
            font-size: 16px;
          }

          .classroom-description {
            font-size: 13px;
          }

          .create-btn {
            padding: 10px 14px;
            font-size: 13px;
          }

          .search-input {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 12px 16px 12px 45px !important;
          }

          .modal-content {
            padding: 20px;
            margin: 12px;
            max-width: calc(100vw - 24px);
            border-radius: 20px;
          }

          .modern-input {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 12px 16px;
          }

          .form-actions .btn {
            padding: 12px 16px;
            font-size: 16px;
          }
        }

        /* Touch-specific optimizations */
        @media (hover: none) and (pointer: coarse) {
          .classroom-card {
            transform: none;
            transition: background-color 0.2s ease;
          }

          .classroom-card:hover {
            transform: none;
            background: var(--card-secondary);
          }

          .classroom-card:active {
            background: var(--glass);
            transform: scale(0.98);
          }

          .btn:hover {
            transform: none;
          }

          .btn:active {
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}