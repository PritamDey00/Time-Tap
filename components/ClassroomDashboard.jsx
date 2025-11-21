import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import AnalogClock from './AnalogClock';
import Timer from './Timer';
import Leaderboard from './Leaderboard';
import TodoList from './TodoList';
import { 
  optimizedThemeSwitch, 
  getCurrentTheme, 
  initializeTheme, 
  addThemeTransitionStyles,
  preloadThemeAssets,
  themePerformanceMonitor
} from '../lib/themeOptimizer';
import { useLeaderboardData } from '../lib/useLeaderboardPersistence';

export default function ClassroomDashboard({ classroomId, user, isAnonymous = false }) {
  const [classroom, setClassroom] = useState(null);
  const [users, setUsers] = useState([]);
  const [displayUsers, setDisplayUsers] = useState([]); // For smooth transitions
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const router = useRouter();

  // Fetch classroom details
  async function fetchClassroom() {
    if (!classroomId) return;
    
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
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

  // Fetch classroom members for leaderboard with smooth transition
  async function fetchClassroomUsers() {
    if (!classroomId) return;
    
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/users`);
      const data = await res.json();
      if (res.ok) {
        const newUsers = data.users || [];
        
        // Only update if data actually changed to prevent unnecessary re-renders
        setUsers(prevUsers => {
          // Check if data is different
          if (JSON.stringify(prevUsers) === JSON.stringify(newUsers)) {
            return prevUsers; // No change, keep previous state
          }
          return newUsers;
        });
      } else {
        console.error('Failed to fetch classroom users:', data.error);
      }
    } catch (err) {
      console.error('fetchClassroomUsers error', err);
    }
  }

  // Smooth transition effect when users data changes
  useEffect(() => {
    if (users.length > 0) {
      // Always update displayUsers when we have data
      // This ensures users never disappear
      setDisplayUsers(users);
    }
    // IMPORTANT: Never set displayUsers to empty array
    // This prevents the "disappearing" effect during refresh
  }, [users]);

  // Send heartbeat to track user activity
  async function sendHeartbeat() {
    try {
      await fetch('/api/heartbeat', { method: 'POST' });
    } catch (error) {
      console.log('Heartbeat failed:', error);
    }
  }

  // Use the leaderboard persistence hook for better state management
  const { forceRefresh: refreshClassroomLeaderboard } = useLeaderboardData(
    fetchClassroomUsers,
    {
      interval: 8000,
      sendHeartbeat,
      onError: (error) => {
        console.error('Classroom leaderboard persistence error:', error);
      }
    }
  );

  // Handle confirmation (same as dashboard)
  async function handleConfirm() {
    try {
      const res = await fetch('/api/confirm', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not confirm yet');
      } else {
        // Refresh users to reflect points/streak update
        refreshClassroomLeaderboard();
      }
    } catch (err) {
      console.error('confirm error', err);
      alert('Network error while confirming');
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
      await fetchClassroom();
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

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [classroomId]);

  // Fetch users when classroom is loaded
  useEffect(() => {
    if (classroom && classroomId) {
      fetchClassroomUsers();
      // The leaderboard persistence is now handled by the useLeaderboardData hook
    }
  }, [classroom, classroomId]);

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

  if (!classroom || !user) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Classroom not found</h2>
          <p>The classroom you're looking for doesn't exist or you don't have access to it.</p>
          <button className="btn" onClick={() => router.push('/classrooms')}>
            Back to Classrooms
          </button>
        </div>
        <style jsx>{`
          .error-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
            padding: 24px;
          }
          .error-content {
            text-align: center;
            color: var(--primary);
            max-width: 400px;
          }
          .error-content h2 {
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 700;
          }
          .error-content p {
            margin: 0 0 24px 0;
            color: var(--muted);
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  // Use server timezone if present, otherwise default to Asia/Kolkata
  const timeZone = user.timezone || 'Asia/Kolkata';

  return (
    <div className="classroom-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="classroom-info">
            <div className="classroom-avatar">
              {classroom.avatar || '🏫'}
            </div>
            <div className="classroom-details">
              <h1 className="classroom-name">{classroom.name}</h1>
              <p className="classroom-description">
                {classroom.description || 'Welcome to the classroom'}
              </p>
              <div className="classroom-stats">
                <span className="stat">
                  <span className="stat-icon">👥</span>
                  {classroom.members?.length || 0} members
                </span>
                {classroom.isUniversal && (
                  <span className="stat universal">
                    <span className="stat-icon">🌍</span>
                    Universal
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn secondary"
              onClick={() => router.push('/classrooms')}
            >
              <span className="btn-icon">🏫</span>
              All Classrooms
            </button>
            
            <button 
              className="btn secondary"
              onClick={() => router.push('/dashboard')}
            >
              <span className="btn-icon">🌍</span>
              Universal Classroom
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

      {/* Main Dashboard Content */}
      <div className="dashboard-container">
        {/* Left Panel - Todo List */}
        <aside className="left-panel" role="complementary" aria-label="Todo List Panel">
          <section className="todo-panel card" aria-labelledby="todo-title" role="region">
            <TodoList 
              userId={user.id} 
              classroomId={classroomId}
              className="classroom-todo-list"
            />
          </section>
        </aside>

        {/* Center Panel - Clock and Timer */}
        <main className="center-panel card" aria-live="polite" role="main" aria-label="Clock and Timer Section">
          <div className="main-content">
            <div className="clock-wrap" aria-hidden={false}>
              <AnalogClock timeZone={timeZone} />
            </div>

            <div className="timer-section">
              <Timer 
                userId={user.id}
                lastConfirm={user.lastConfirm} 
                createdAt={user.createdAt} 
                onConfirm={handleConfirm} 
              />

              <div className="user-info">
                Signed in as <strong>{user.name}</strong> — Points: <strong>{user.points}</strong> • Streak: <strong>{user.streak}</strong>
                {isAnonymous && (
                  <div className="anonymous-badge">
                    <span className="badge-icon">👤</span>
                    Anonymous Mode
                  </div>
                )}
              </div>

              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <div className="notification-banner">
                  <strong>⚠️ Enable notifications</strong> to get alerts when confirmation window opens!
                  <button onClick={() => Notification.requestPermission()}>
                    Enable
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel - Leaderboard */}
        <aside className="right-panel" role="complementary" aria-label="Leaderboard Panel">
          <section className="leaderboard-panel card modern-sidebar leaderboard-persistent" aria-labelledby="leaderboard-title" role="region">
            <div className="leaderboard-header">
              <h4 id="leaderboard-title" className="leaderboard-title">
                🏆 Classroom Leaderboard
              </h4>
              <div className="status-legend">
                <div className="status-dot online" title="Online" />
                <div className="status-dot away" title="Away" />
                <div className="status-dot offline" title="Offline" />
              </div>
            </div>
            <div className="leaderboard-container">
              <Leaderboard 
                key="classroom-leaderboard" 
                users={displayUsers} 
                me={user} 
                maxHeight="100%" 
              />
            </div>
          </section>
        </aside>
      </div>

      <style jsx>{`
        .classroom-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
          padding: 24px;
        }

        /* Header */
        .dashboard-header {
          max-width: 1200px;
          margin: 0 auto 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
        }

        .classroom-info {
          display: flex;
          gap: 16px;
          align-items: center;
          flex: 1;
          min-width: 300px;
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
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--muted);
          font-weight: 500;
          padding: 4px 8px;
          background: var(--card-secondary);
          border-radius: 8px;
          border: 1px solid var(--glass-border);
        }

        .stat.universal {
          background: linear-gradient(135deg, var(--theme-accent)20, var(--theme-primary)20);
          border-color: var(--theme-accent)30;
          color: var(--theme-accent);
        }

        .stat-icon {
          font-size: 16px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .theme-selector {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--glass);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
        }

        .theme-btn {
          padding: 8px 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--primary);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .theme-btn.active {
          background: var(--theme-primary);
          color: white;
        }

        .theme-btn:hover:not(.active) {
          background: var(--card-secondary);
        }

        /* Main Dashboard Layout */
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 350px 1fr 450px;
          gap: 32px;
          align-items: start;
        }

        /* Left Panel - Todo List */
        .left-panel {
          grid-column: 1;
          display: flex;
          flex-direction: column;
        }

        /* Center Panel - Clock Section */
        .center-panel {
          grid-column: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          min-height: 600px;
        }

        .main-content {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .clock-wrap {
          width: 360px;
          max-width: 86vw;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid var(--glass-border);
          box-shadow: var(--soft-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clock-wrap::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, var(--theme-primary)20, var(--theme-secondary)20, var(--theme-accent)20, var(--theme-primary)20);
          animation: rotate 20s linear infinite;
          z-index: -1;
        }

        .clock-wrap::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: var(--glass);
          backdrop-filter: blur(20px);
          z-index: -1;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .clock-wrap:hover {
          transform: scale(1.02);
          box-shadow: var(--soft-shadow), 0 0 40px var(--theme-primary)30, inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .timer-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
        }

        .user-info {
          margin-top: 12px;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
          padding: 0 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .anonymous-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: linear-gradient(135deg, var(--theme-accent)20, var(--theme-primary)20);
          border: 1px solid var(--theme-accent)30;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--theme-accent);
        }

        .badge-icon {
          font-size: 14px;
        }

        /* Right Panel - Leaderboard */
        .right-panel {
          grid-column: 3;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 400px;
        }

        /* Todo Panel */
        .todo-panel {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          padding: 16px;
          min-height: 400px;
        }

        /* Leaderboard Panel */
        .leaderboard-panel {
          min-width: 400px;
          max-height: 600px;
          overflow: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        /* Leaderboard container for proper alignment */
        .leaderboard-container {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Ensure no double scrollbars */
        .side-panel :global(.leaderboard-unified-scroll) {
          height: 100%;
          max-height: none;
        }

        /* Fix alignment issues */
        .left-panel section,
        .right-panel section {
          display: flex;
          flex-direction: column;
        }

        .todo-panel,
        .leaderboard-panel {
          display: flex;
          flex-direction: column;
        }

        /* Ensure consistent spacing and alignment */
        .left-panel > section,
        .right-panel > section,
        .center-panel {
          border-radius: 16px;
          box-shadow: var(--soft-shadow);
          backdrop-filter: blur(15px);
          border: 1px solid var(--glass-border);
        }

        /* Remove any margin/padding inconsistencies */
        .left-panel > section > *,
        .right-panel > section > * {
          margin: 0;
        }

        /* Ensure proper content alignment */
        .leaderboard-panel .leaderboard-container {
          margin: 0;
          padding: 0;
        }

        /* Perfect alignment for leaderboard content */
        .leaderboard-panel :global(.leaderboard-content) {
          padding: 0;
          margin: 0;
        }

        /* Ensure scroll container takes full available space */
        .leaderboard-container :global(.leaderboard-unified-scroll) {
          flex: 1;
          min-height: 0;
        }

        .leaderboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 4px 0 16px;
        }

        .leaderboard-title {
          margin: 0;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          fontSize: 18px;
          font-weight: 700;
        }

        .status-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: var(--card-secondary);
          border-radius: 8px;
          border: 1px solid var(--glass-border);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.online {
          background-color: var(--success-color, #10b981);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        .status-dot.away {
          background-color: var(--warning-color, #f59e0b);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
        }

        .status-dot.offline {
          background-color: var(--muted);
          box-shadow: 0 0 8px var(--muted)50;
        }

        /* Responsive Design - Desktop Large */
        @media (min-width: 1200px) {
          .dashboard-container {
            grid-template-columns: 350px 1fr 450px;
            gap: 40px;
            max-width: 1400px;
          }

          .right-panel {
            width: 450px;
          }

          .left-panel {
            width: 350px;
          }

          .clock-wrap {
            width: 420px;
          }

          .center-panel {
            padding: 40px;
          }

          .todo-panel {
            padding: 20px;
            min-height: 450px;
          }

          .leaderboard-panel {
            padding: 20px;
            max-height: 650px;
            overflow: hidden;
          }
        }

        /* Responsive Design - Tablet */
        @media (min-width: 769px) and (max-width: 1199px) {
          .dashboard-container {
            grid-template-columns: 300px 1fr 400px;
            gap: 28px;
            padding: 0 20px;
          }

          .right-panel {
            width: 400px;
            min-width: 350px;
          }

          .left-panel {
            width: 300px;
          }

          .todo-panel {
            padding: 18px;
            min-height: 380px;
          }

          .leaderboard-panel {
            min-width: 350px;
            padding: 18px;
            max-height: 500px;
            overflow: hidden;
          }

          .center-panel {
            padding: 32px;
          }

          .clock-wrap {
            width: 380px;
          }
        }

        /* Responsive Design - Small Tablet */
        @media (min-width: 601px) and (max-width: 768px) {
          .dashboard-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .center-panel {
            order: 1;
            width: 100%;
            padding: 28px;
          }

          .left-panel {
            order: 2;
            width: 100%;
          }

          .right-panel {
            order: 3;
            width: 100%;
          }

          .todo-panel {
            max-height: 300px;
            padding: 16px;
          }

          .leaderboard-panel {
            max-height: 380px;
            overflow: hidden;
            padding: 16px;
          }

          .clock-wrap {
            width: 360px;
            max-width: 90vw;
          }
        }

        /* Responsive Design - Mobile */
        @media (max-width: 600px) {
          .dashboard-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
          }

          .center-panel {
            order: 1;
            width: 100%;
            padding: 20px;
          }

          .right-panel {
            order: 2;
            width: 100%;
          }

          .left-panel {
            order: 3;
            width: 100%;
          }

          .leaderboard-panel {
            max-height: 320px;
            padding: 16px;
            overflow: hidden;
          }

          .todo-panel {
            width: 100%;
            padding: 16px;
            min-height: 250px;
          }

          .clock-wrap {
            width: 320px;
            max-width: 90vw;
          }
        }

        @media (max-width: 768px) {
          .classroom-dashboard {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .classroom-info {
            flex-direction: column;
            text-align: center;
            min-width: auto;
          }

          .classroom-name {
            font-size: 24px;
          }

          .classroom-avatar {
            width: 56px;
            height: 56px;
            font-size: 24px;
            align-self: center;
          }

          .header-actions {
            justify-content: center;
            flex-wrap: wrap;
          }

          .dashboard-container {
            padding: 0;
            gap: 16px;
          }

          .center-panel {
            padding: 20px;
          }

          .clock-wrap {
            width: 300px;
            max-width: 90vw;
          }

          .todo-panel {
            padding: 16px;
            min-height: 280px;
          }

          .leaderboard-panel {
            padding: 16px;
            max-height: 300px;
            overflow: hidden;
          }

          /* Enhanced touch targets */
          .header-actions .btn {
            min-height: 44px;
            padding: 12px 16px;
            font-size: 14px;
          }

          .theme-btn {
            min-width: 44px;
            min-height: 44px;
            padding: 10px;
          }
        }

        @media (max-width: 480px) {
          .classroom-dashboard {
            padding: 12px;
          }

          .classroom-name {
            font-size: 20px;
          }

          .classroom-description {
            font-size: 14px;
          }

          .classroom-stats {
            justify-content: center;
            flex-wrap: wrap;
          }

          .header-actions {
            flex-direction: column;
            gap: 8px;
          }

          .header-actions > * {
            width: 100%;
          }

          .theme-selector {
            justify-content: center;
            padding: 6px;
          }

          .theme-btn {
            min-width: 40px;
            min-height: 40px;
            padding: 8px;
            font-size: 12px;
          }

          .clock-wrap {
            width: 280px;
            padding: 20px;
          }

          .user-info {
            font-size: 12px;
            padding: 0 12px;
          }

          .anonymous-badge {
            font-size: 11px;
            padding: 3px 6px;
          }

          .center-panel {
            padding: 16px;
          }

          .todo-panel {
            padding: 12px;
            min-height: 200px;
          }

          .leaderboard-panel {
            padding: 12px;
            max-height: 250px;
            overflow: hidden;
          }

          .leaderboard-title {
            font-size: 16px;
          }
        }

        /* Touch-specific optimizations */
        @media (hover: none) and (pointer: coarse) {
          .clock-wrap:hover {
            transform: none;
          }

          .classroom-card:hover {
            transform: none;
          }

          .theme-btn:hover {
            background: var(--card-secondary);
          }

          .theme-btn:active {
            transform: scale(0.95);
          }

          .btn:hover {
            transform: none;
          }

          .btn:active {
            transform: scale(0.95);
          }
        }

        /* Mobile landscape optimization */
        @media (max-width: 768px) and (orientation: landscape) {
          .dashboard-container {
            display: grid;
            grid-template-columns: 280px 1fr 300px;
            gap: 16px;
          }

          .left-panel {
            grid-column: 1;
          }

          .center-panel {
            grid-column: 2;
            padding: 16px;
          }

          .right-panel {
            grid-column: 3;
          }

          .todo-panel {
            padding: 12px;
            min-height: 200px;
          }

          .leaderboard-panel {
            max-height: 200px;
            overflow: hidden;
            padding: 12px;
          }

          .clock-wrap {
            width: 260px;
          }

          .classroom-dashboard {
            padding: 8px;
          }
        }

        /* Touch-friendly mobile enhancements */
        @media (max-width: 768px) {
          .left-panel,
          .right-panel {
            padding: 0 8px;
          }

          .leaderboard-panel,
          .todo-panel {
            border-radius: 16px;
            padding: 20px;
          }

          /* Ensure touch targets are at least 44px */
          .header-actions .btn, .theme-btn {
            min-height: 44px;
            min-width: 44px;
          }

          /* Improve scroll area for touch */
          .leaderboard-unified-scroll {
            padding: 4px;
          }
        }
      `}</style>
    </div>
  );
}