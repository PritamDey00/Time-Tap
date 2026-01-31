import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import AccountButton from '../components/AccountButton';
import { 
  optimizedThemeSwitch, 
  getCurrentTheme, 
  initializeTheme, 
  addThemeTransitionStyles,
  preloadThemeAssets,
  themePerformanceMonitor
} from '../lib/themeOptimizer';

// Lazy load the ClassroomList component
const ClassroomList = lazy(() => import('../components/ClassroomList'));

export default function ClassroomsPage() {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const router = useRouter();

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

  // Fetch all classrooms
  async function fetchClassrooms() {
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      if (res.ok) {
        setClassrooms(data.classrooms || []);
      } else {
        console.error('Failed to fetch classrooms:', data.error);
      }
    } catch (err) {
      console.error('fetchClassrooms error', err);
    }
  }

  // Handle classroom creation
  async function handleCreateClassroom(classroomData) {
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classroomData)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create classroom');
      }
      
      // Refresh classrooms list
      await fetchClassrooms();
      
      // Optionally redirect to the new classroom
      // router.push(`/classroom/${data.classroom.id}`);
    } catch (error) {
      console.error('Create classroom error:', error);
      alert(error.message || 'Failed to create classroom');
      throw error;
    }
  }

  // Handle joining a classroom
  async function handleJoinClassroom(classroomId, password = null) {
    try {
      const payload = password ? { password } : {};
      const res = await fetch(`/api/classrooms/${classroomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join classroom');
      }
      
      // Refresh classrooms list to update membership status
      await fetchClassrooms();
      
      // Optionally redirect to the classroom
      // router.push(`/classroom/${classroomId}`);
    } catch (error) {
      console.error('Join classroom error:', error);
      alert(error.message || 'Failed to join classroom');
      throw error;
    }
  }

  function setSpecificTheme(themeId) {
    themePerformanceMonitor.startMeasure();
    
    optimizedThemeSwitch(themeId, (appliedTheme) => {
      setTheme(appliedTheme);
      themePerformanceMonitor.endMeasure();
    });
  }

  const themes = [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'dark-blue', name: 'Ocean', icon: '🌊' },
    { id: 'pink', name: 'Rose', icon: '🌸' },
    { id: 'yellow', name: 'Sunny', icon: '🌻' },
    { id: 'green', name: 'Nature', icon: '🌿' }
  ];

  useEffect(() => {
    async function init() {
      setLoading(true);
      const currentUser = await fetchUser();
      if (currentUser) {
        await fetchClassrooms();
      }
      setLoading(false);
    }

    init();

    // Initialize theme optimization
    addThemeTransitionStyles();
    
    // Initialize theme from localStorage
    const storedTheme = getCurrentTheme('light');
    setTheme(storedTheme);
    initializeTheme(storedTheme);
    
    // Preload theme assets for better performance
    preloadThemeAssets(themes);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner-large"></div>
          <p>Loading classrooms...</p>
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

  if (!user) return null;

  // Find universal classroom
  const universalClassroom = classrooms.find(c => c.isUniversal);
  const regularClassrooms = classrooms.filter(c => !c.isUniversal);

  return (
    <>
      <AccountButton user={user} onUserUpdate={handleUserUpdate} />
      <div className="classrooms-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">
              <span className="title-icon">🏫</span>
              Classrooms
            </h1>
            <p className="page-subtitle">
              Join existing classrooms or create your own study space
            </p>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn secondary"
              onClick={() => router.push('/account')}
            >
              <span className="btn-icon">👤</span>
              Account
            </button>
            
            {/* Theme Selector */}
            <div className="theme-selector">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSpecificTheme(t.id)}
                  className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                  title={t.name}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-content">
        {/* Universal Classroom Section */}
        {universalClassroom && (
          <section className="universal-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">🌍</span>
                Universal Classroom
              </h2>
              <p className="section-description">
                Open to all students - join the global study community
              </p>
            </div>
            
            <div className="universal-classroom-card">
              <div className="classroom-info">
                <div className="classroom-avatar universal">
                  {universalClassroom.avatar || '🌍'}
                </div>
                <div className="classroom-details">
                  <h3 className="classroom-name">{universalClassroom.name}</h3>
                  <p className="classroom-description">
                    {universalClassroom.description || 'Welcome to the universal study space where all students can connect and learn together.'}
                  </p>
                  <div className="classroom-stats">
                    <span className="stat">
                      <span className="stat-icon">👥</span>
                      {universalClassroom.members?.length || 0} members
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                className={`btn large ${universalClassroom.members?.includes(user.id) ? 'secondary' : ''}`}
                onClick={() => {
                  if (universalClassroom.members?.includes(user.id)) {
                    router.push('/dashboard');
                  } else {
                    handleJoinClassroom(universalClassroom.id);
                  }
                }}
              >
                {universalClassroom.members?.includes(user.id) ? (
                  <>
                    <span className="btn-icon">🚪</span>
                    Enter
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚪</span>
                    Join Universal Classroom
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Regular Classrooms Section */}
        <section className="classrooms-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">🏫</span>
              All Classrooms
            </h2>
            <p className="section-description">
              Browse and join classrooms created by students and teachers
            </p>
          </div>
          
          <Suspense fallback={
            <div className="classroom-list-loading">
              <div className="loading-spinner-large"></div>
              <p>Loading classrooms...</p>
            </div>
          }>
            <ClassroomList
              user={user}
              classrooms={regularClassrooms}
              onJoin={handleJoinClassroom}
              onCreate={handleCreateClassroom}
            />
          </Suspense>
        </section>
      </main>

      <style jsx>{`
        .classrooms-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
          padding: 24px;
        }

        .page-header {
          max-width: 1200px;
          margin: 0 auto 40px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
        }

        .header-info {
          flex: 1;
          min-width: 300px;
        }

        .page-title {
          margin: 0 0 8px 0;
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          font-size: 32px;
        }

        .page-subtitle {
          margin: 0;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.5;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .theme-selector {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--glass);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .theme-btn {
          padding: 8px 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--primary);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .theme-btn.active {
          background: var(--theme-primary);
          color: white;
          box-shadow: 0 2px 8px var(--theme-primary)40;
        }

        .theme-btn:hover:not(.active) {
          background: var(--card-secondary);
          transform: translateY(-1px);
        }

        .theme-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .page-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .universal-section {
          margin-bottom: 48px;
        }

        .section-header {
          margin-bottom: 24px;
        }

        .section-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 20px;
        }

        .section-description {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
        }

        .universal-classroom-card {
          background: var(--glass);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 2px solid var(--glass-border);
          border-radius: 24px;
          padding: 32px;
          box-shadow: var(--soft-shadow), 0 0 60px var(--theme-primary)15;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 32px;
        }

        .universal-classroom-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary), var(--theme-accent));
        }

        .classroom-info {
          display: flex;
          gap: 20px;
          align-items: center;
          flex: 1;
        }

        .classroom-avatar {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 8px 25px var(--theme-primary)40;
        }

        .classroom-avatar.universal {
          background: linear-gradient(135deg, var(--theme-accent), var(--theme-primary));
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 8px 25px var(--theme-primary)40;
          }
          50% {
            box-shadow: 0 12px 35px var(--theme-primary)60;
          }
        }

        .classroom-details {
          flex: 1;
        }

        .classroom-name {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
        }

        .classroom-description {
          margin: 0 0 12px 0;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.5;
        }

        .classroom-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--muted);
          font-weight: 500;
        }

        .stat-icon {
          font-size: 16px;
        }

        .btn.large {
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          min-width: 200px;
          white-space: nowrap;
        }

        .classrooms-section {
          margin-bottom: 48px;
        }

        .classroom-list-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: var(--muted);
          gap: 16px;
        }

        .classroom-list-loading .loading-spinner-large {
          width: 32px;
          height: 32px;
          border: 3px solid var(--glass-border);
          border-top: 3px solid var(--theme-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Enhanced Responsive Design */
        @media (min-width: 1200px) {
          .classrooms-page {
            padding: 32px;
          }

          .page-content {
            max-width: 1400px;
          }

          .universal-classroom-card {
            padding: 40px;
            gap: 40px;
          }

          .classroom-avatar {
            width: 80px;
            height: 80px;
            font-size: 32px;
          }

          .classroom-name {
            font-size: 28px;
          }

          .btn.large {
            padding: 20px 40px;
            font-size: 18px;
            min-width: 240px;
          }
        }

        @media (min-width: 768px) and (max-width: 1199px) {
          .classrooms-page {
            padding: 24px;
          }

          .header-content {
            gap: 24px;
          }

          .universal-classroom-card {
            padding: 32px;
            gap: 32px;
          }

          .classroom-avatar {
            width: 72px;
            height: 72px;
            font-size: 30px;
          }

          .btn.large {
            padding: 18px 36px;
            font-size: 17px;
            min-width: 220px;
          }
        }

        @media (max-width: 767px) {
          .classrooms-page {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
          }

          .header-info {
            min-width: auto;
            text-align: center;
          }

          .page-title {
            font-size: 28px;
            justify-content: center;
          }

          .title-icon {
            font-size: 24px;
          }

          .header-actions {
            justify-content: center;
            flex-direction: column;
            gap: 12px;
          }

          .header-actions .btn {
            width: 100%;
            min-height: 48px;
            padding: 14px 20px;
            font-size: 16px;
            justify-content: center;
          }

          .universal-classroom-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 24px;
            padding: 24px;
          }

          .classroom-info {
            flex-direction: column;
            text-align: center;
            gap: 16px;
            width: 100%;
          }

          .classroom-details {
            text-align: center;
          }

          .classroom-stats {
            justify-content: center;
          }

          .btn.large {
            width: 100%;
            min-height: 52px;
            font-size: 16px;
            padding: 16px 24px;
          }
        }

        @media (max-width: 480px) {
          .classrooms-page {
            padding: 12px;
          }

          .page-title {
            font-size: 24px;
            flex-direction: column;
            gap: 8px;
          }

          .title-icon {
            font-size: 20px;
          }

          .page-subtitle {
            font-size: 14px;
          }

          .header-actions {
            gap: 8px;
          }

          .header-actions .btn {
            font-size: 14px;
            padding: 12px 16px;
            min-height: 44px;
          }

          .classroom-avatar {
            width: 56px;
            height: 56px;
            font-size: 24px;
          }

          .classroom-name {
            font-size: 20px;
          }

          .classroom-description {
            font-size: 14px;
          }

          .universal-classroom-card {
            padding: 20px;
            border-radius: 20px;
            gap: 20px;
          }

          .section-title {
            font-size: 20px;
          }

          .section-description {
            font-size: 13px;
          }

          .btn.large {
            font-size: 15px;
            padding: 14px 20px;
            min-height: 48px;
          }
        }

        /* Touch-specific optimizations */
        @media (hover: none) and (pointer: coarse) {
          .universal-classroom-card:hover {
            transform: none;
          }

          .btn:hover {
            transform: none;
          }

          .btn:active {
            transform: scale(0.95);
          }

          .theme-btn:hover {
            background: var(--card-secondary);
          }

          .theme-btn:active {
            transform: scale(0.9);
          }
        }

        /* Landscape orientation optimizations */
        @media (max-width: 768px) and (orientation: landscape) {
          .universal-classroom-card {
            flex-direction: row;
            align-items: center;
            gap: 20px;
          }

          .classroom-info {
            flex-direction: row;
            text-align: left;
          }

          .classroom-details {
            text-align: left;
          }

          .classroom-stats {
            justify-content: flex-start;
          }

          .btn.large {
            width: auto;
            min-width: 180px;
          }
        }
      `}</style>
    </div>
    </>
  );
}