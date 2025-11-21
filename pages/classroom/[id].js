import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClassroomDashboard from '../../components/ClassroomDashboard';
import ClassroomSettings from '../../components/ClassroomSettings';
import AccountButton from '../../components/AccountButton';

export default function ClassroomPage() {
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  // Fetch current user
  async function fetchUser() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (!data.user) {
        router.push('/');
        return null;
      }
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('fetchUser error', err);
      router.push('/');
      return null;
    }
  }

  // Fetch classroom details
  async function fetchClassroom() {
    if (!id) return;
    
    try {
      const res = await fetch(`/api/classrooms/${id}`);
      const data = await res.json();
      if (res.ok) {
        setClassroom(data.classroom);
      } else {
        console.error('Failed to fetch classroom:', data.error);
        router.push('/classrooms');
      }
    } catch (err) {
      console.error('fetchClassroom error', err);
      router.push('/classrooms');
    }
  }

  // Handle settings save
  const handleSettingsSave = (updatedClassroom) => {
    setClassroom(updatedClassroom);
  };

  // Handle when user leaves classroom (redirect will be handled by ClassroomSettings)
  const handleLeaveClassroom = () => {
    // This will be called if needed, but ClassroomSettings handles the redirect
    router.push('/classrooms');
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      const currentUser = await fetchUser();
      if (currentUser && id) {
        await fetchClassroom();
      }
      setLoading(false);
    }

    init();
  }, [id]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Comprehensive check for text input contexts
      const isTypingInInput = () => {
        const target = e.target;
        const tagName = target.tagName?.toLowerCase();
        
        // Check for standard input elements
        if (tagName === 'input' || tagName === 'textarea') {
          return true;
        }
        
        // Check for contentEditable elements
        if (target.contentEditable === 'true' || target.isContentEditable) {
          return true;
        }
        
        // Check if target is inside a form or input container
        if (target.closest) {
          const isInFormContext = target.closest('form, .input-container, .todo-form, .form-group, .search-container');
          if (isInFormContext) {
            return true;
          }
        }
        
        // Check for elements with input-related classes
        const inputClasses = [
          'todo-input', 'todo-edit-input', 'form-input', 
          'form-textarea', 'search-input', 'modern-input', 'avatar-input'
        ];
        if (inputClasses.some(className => target.classList?.contains(className))) {
          return true;
        }
        
        // Check if any input element currently has focus
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName?.toLowerCase() === 'input' ||
          activeElement.tagName?.toLowerCase() === 'textarea' ||
          activeElement.contentEditable === 'true' ||
          activeElement.isContentEditable
        )) {
          return true;
        }
        
        // Check for role-based input elements
        if (target.getAttribute) {
          const inputRoles = ['textbox', 'searchbox', 'combobox'];
          if (inputRoles.includes(target.getAttribute('role'))) {
            return true;
          }
        }
        
        return false;
      };
      
      // Only handle shortcuts when not in a text input context
      if (!isTypingInInput()) {
        // Press 'S' to open settings (if user has permission)
        if (e.key === 's' || e.key === 'S') {
          if (user && classroom && (classroom.createdBy === user.id || classroom.isUniversal)) {
            e.preventDefault(); // Prevent any default behavior
            setShowSettings(true);
          }
        }
      }
      
      // Press 'Escape' to close settings (works even when typing)
      if (e.key === 'Escape') {
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [user, classroom]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner-large"></div>
          <p>Loading classroom...</p>
        </div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
          }
          .loading-content {
            text-align: center;
            color: var(--primary);
          }
          .loading-spinner-large {
            width: 48px;
            height: 48px;
            border: 4px solid var(--glass-border);
            border-top: 4px solid var(--theme-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Handle user updates from AccountButton
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (!user || !classroom) {
    return null;
  }

  // Check if user is anonymous (this would come from user settings in a real implementation)
  const isAnonymous = user.isAnonymous || false;

  return (
    <>
      <AccountButton user={user} onUserUpdate={handleUserUpdate} />
      <div className="classroom-page">
      <ClassroomDashboard 
        classroomId={id}
        user={user}
        isAnonymous={isAnonymous}
      />

      {/* Settings Button - Floating Action Button */}
      {user && classroom && (classroom.createdBy === user.id || classroom.isUniversal) && (
        <button 
          className="settings-fab"
          onClick={() => setShowSettings(true)}
          title="Classroom Settings (Press S)"
        >
          <span className="fab-icon">⚙️</span>
        </button>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <ClassroomSettings
          classroom={classroom}
          user={user}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          onLeave={handleLeaveClassroom}
        />
      )}

      <style jsx>{`
        .classroom-page {
          position: relative;
          min-height: 100vh;
        }

        .settings-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px var(--theme-primary)40;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
        }

        .settings-fab:hover {
          transform: translateY(-4px) scale(1.1);
          box-shadow: 0 12px 35px var(--theme-primary)50;
        }

        .settings-fab:active {
          transform: translateY(-2px) scale(1.05);
        }

        .fab-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .settings-fab {
            bottom: 20px;
            right: 20px;
          }
        }

        @media (max-width: 768px) {
          .settings-fab {
            bottom: 16px;
            right: 16px;
            width: 52px;
            height: 52px;
            /* Enhanced touch target */
            min-width: 44px;
            min-height: 44px;
          }

          .fab-icon {
            font-size: 22px;
          }
        }

        @media (max-width: 480px) {
          .settings-fab {
            bottom: 12px;
            right: 12px;
            width: 48px;
            height: 48px;
          }

          .fab-icon {
            font-size: 20px;
          }
        }

        /* Touch-specific optimizations */
        @media (hover: none) and (pointer: coarse) {
          .settings-fab:hover {
            transform: none;
          }

          .settings-fab:active {
            transform: scale(0.9);
          }
        }

        /* Landscape orientation - move FAB to avoid keyboard */
        @media (max-width: 768px) and (orientation: landscape) {
          .settings-fab {
            bottom: 8px;
            right: 8px;
            width: 44px;
            height: 44px;
          }

          .fab-icon {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
    </>
  );
}