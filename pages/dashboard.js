import { useEffect, useState } from 'react';
import Head from 'next/head';
import Router from 'next/router';
import AnalogClock from '../components/AnalogClock';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import TodoList from '../components/TodoList';
import AccountButton from '../components/AccountButton';
import { useLeaderboardData } from '../lib/useLeaderboardPersistence';

export default function UniversalClassroom() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingMe, setLoadingMe] = useState(true);
  const [opBusy, setOpBusy] = useState(false);
  const [theme, setTheme] = useState('light');

  // Fetch current user (uses auth cookie set by /api/login)
  async function fetchMe() {
    try {
      setLoadingMe(true);
      const res = await fetch('/api/me');
      const data = await res.json();
      if (!data.user) {
        Router.push('/');
        return null;
      }
      setMe(data.user);
      return data.user;
    } catch (err) {
      console.error('fetchMe error', err);
      Router.push('/');
      return null;
    } finally {
      setLoadingMe(false);
    }
  }

  async function fetchUsers() {
    try {
      // Use the universal classroom users endpoint to get only joined members
      const res = await fetch('/api/classrooms/universal/users');
      const j = await res.json();
      setUsers(j.users || []);
    } catch (err) {
      console.error('fetchUsers error', err);
    }
  }

  // Detect browser timezone and persist it only if server does not already have a timezone.
  // This prevents overwriting an explicit server-side/default timezone (e.g., Asia/Kolkata).
  async function detectAndSaveTimezone(serverTz) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      // If server already has a timezone value, prefer it (do not overwrite).
      if (serverTz) {
        // ensure local state uses server value
        setMe(prev => (prev ? { ...prev, timezone: serverTz } : prev));
        return;
      }
      // Persist timezone (only when server had none)
      const res = await fetch('/api/set-timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: tz })
      });
      if (res.ok) {
        setMe(prev => (prev ? { ...prev, timezone: tz } : prev));
      }
    } catch (e) {
      // ignore network errors
      console.warn('detectAndSaveTimezone failed', e);
    }
  }

  // Send heartbeat to track user activity
  async function sendHeartbeat() {
    try {
      await fetch('/api/heartbeat', { method: 'POST' });
    } catch (error) {
      // Silently fail - heartbeat is not critical
      console.log('Heartbeat failed:', error);
    }
  }

  // Use the leaderboard persistence hook for better state management
  const { forceRefresh: refreshLeaderboard } = useLeaderboardData(
    fetchUsers,
    {
      interval: 8000,
      sendHeartbeat,
      onError: (error) => {
        console.error('Leaderboard persistence error:', error);
      }
    }
  );

  useEffect(() => {
    (async () => {
      const user = await fetchMe();
      await fetchUsers();
      if (user) {
        // pass server timezone (might be null) so detectAndSaveTimezone will only persist when needed
        await detectAndSaveTimezone(user.timezone || null);

        // Send initial heartbeat
        await sendHeartbeat();
      }
    })();

    // Initialize theme from localStorage
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    setTheme(stored || 'light');
    applyTheme(stored || 'light');

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
          }
        });
      }
    }

    // The leaderboard persistence is now handled by the useLeaderboardData hook
    // No need for manual interval management here

    return () => {
      // Cleanup is handled by the hook
    };
  }, []);

  // Called when user presses Confirm during the 1-minute window
  async function handleConfirm() {
    try {
      setOpBusy(true);
      const res = await fetch('/api/confirm', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || 'Could not confirm yet');
      } else {
        // refresh me and leaderboard to reflect points/streak update
        await fetchMe();
        refreshLeaderboard();
      }
    } catch (err) {
      console.error('confirm error', err);
      alert('Network error while confirming');
    } finally {
      setOpBusy(false);
    }
  }

  function applyTheme(t) {
    if (typeof document === 'undefined') return;

    // Remove all theme classes
    const themeClasses = ['dark', 'dark-blue', 'pink', 'yellow', 'green'];
    themeClasses.forEach(theme => {
      document.documentElement.classList.remove(theme);
    });

    // Add the selected theme class (except for light which is default)
    if (t !== 'light') {
      document.documentElement.classList.add(t);
    }
  }

  const themes = [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'dark-blue', name: 'Ocean', icon: '🌊' },
    { id: 'pink', name: 'Rose', icon: '🌸' },
    { id: 'yellow', name: 'Sunny', icon: '🌻' },
    { id: 'green', name: 'Nature', icon: '🌿' }
  ];



  function setSpecificTheme(themeId) {
    setTheme(themeId);
    localStorage.setItem('theme', themeId);
    applyTheme(themeId);
  }



  if (loadingMe || !me) return null;

  // Handle user updates from AccountButton
  const handleUserUpdate = (updatedUser) => {
    setMe(updatedUser);
  };

  // Use server timezone if present, otherwise default to Asia/Kolkata (India)
  const timeZone = me.timezone || 'Asia/Kolkata';

  return (
    <>
      <Head>
        <title>Universal Classroom - Study Together</title>
        <meta name="description" content="Join the Universal Classroom - A global study space where students connect and learn together" />
      </Head>
      <AccountButton user={me} onUserUpdate={handleUserUpdate} />
      <div className="dashboard-container">
        {/* Left Panel - Todo List */}
        <aside className="left-panel" role="complementary" aria-label="Todo List Panel">
          <section className="todo-panel card" aria-labelledby="todo-title" role="region">
            <TodoList
              userId={me?.id}
              classroomId="universal"
              className="universal-todo-list"
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
              <Timer lastConfirm={me.lastConfirm} createdAt={me.createdAt} onConfirm={handleConfirm} />

              <div className="user-info">
                Signed in as <strong>{me.name}</strong> — Points: <strong>{me.points}</strong> • Streak: <strong>{me.streak}</strong>
              </div>

              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <div className="notification-banner">
<<<<<<< HEAD
                  <strong>⚠️ Enable notifications & microphone</strong> to get alerts when confirmation window opens!
                  <button onClick={async () => {
                    // Request notification permission
                    await Notification.requestPermission();
                    
                    // Also request microphone permission for convenience
                    try {
                      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                        console.log('Microphone permission granted');
                      }
                    } catch (error) {
                      console.log('Microphone permission denied or not available:', error);
                      // Don't show error to user - microphone is optional
                    }
                  }}>
=======
                  <strong>⚠️ Enable notifications</strong> to get alerts when confirmation window opens!
                  <button onClick={() => Notification.requestPermission()}>
>>>>>>> 88664ac2122aa3ef7983f7311236ee3cda1abd14
                    Enable
                  </button>
                </div>
              )}

              <div className="btn-group">
                <button className="btn secondary" onClick={() => Router.push('/classrooms')} disabled={opBusy}>
                  🏫 Classrooms
                </button>

                <button className="btn secondary" onClick={() => Router.push('/account')} disabled={opBusy}>
                  👤 Account
                </button>

                {/* Theme Selector */}
                <div className="theme-selector">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSpecificTheme(t.id)}
                      disabled={opBusy}
                      className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                      title={t.name}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Leaderboard */}
        <aside className="right-panel" role="complementary" aria-label="Leaderboard Panel">
          <section className="leaderboard-panel card modern-sidebar leaderboard-persistent" aria-labelledby="leaderboard-title" role="region">
            <div className="leaderboard-header">
              <h4 id="leaderboard-title" className="leaderboard-title">
                🏆 Universal Leaderboard
              </h4>
              <div className="status-legend">
                <div className="status-dot online" title="Online" />
                <div className="status-dot away" title="Away" />
                <div className="status-dot offline" title="Offline" />
              </div>
            </div>
            <div className="leaderboard-container">
              <Leaderboard users={users} me={me} maxHeight="100%" />
            </div>
          </section>
        </aside>
      </div>

      <style jsx>{`
      .dashboard-container {
        max-width: 1400px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 350px 1fr 450px;
        gap: 32px;
        align-items: start;
        padding: 24px;
        min-height: 100vh;
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
        width: 400px;
        max-width: 90vw;
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
        margin-top: 24px;
        gap: 16px;
      }

      .user-info {
        color: var(--muted);
        font-size: 14px;
        text-align: center;
        padding: 0 8px;
      }

      .notification-banner {
        padding: 12px 16px;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 12px;
        font-size: 13px;
        text-align: center;
        max-width: 400px;
        color: var(--warning-color, #d97706);
      }

      .notification-banner button {
        margin-left: 8px;
        padding: 4px 12px;
        font-size: 12px;
        background: var(--warning-color, #d97706);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .notification-banner button:hover {
        background: var(--warning-color-dark, #b45309);
      }

      .btn-group {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
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

      .theme-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

      .leaderboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 0 16px 0;
        flex-shrink: 0;
      }

      .leaderboard-title {
        margin: 0;
        background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 18px;
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

      /* Responsive Design - Desktop Large */
      @media (min-width: 1200px) {
        .dashboard-container {
          grid-template-columns: 350px 1fr 450px;
          gap: 40px;
          padding: 32px;
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

        .leaderboard-title {
          font-size: 20px;
        }
      }

      /* Responsive Design - Tablet */
      @media (min-width: 769px) and (max-width: 1199px) {
        .dashboard-container {
          grid-template-columns: 300px 1fr 400px;
          gap: 28px;
          padding: 24px 20px;
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

        .leaderboard-title {
          font-size: 18px;
        }
      }

      /* Responsive Design - Small Tablet */
      @media (min-width: 601px) and (max-width: 768px) {
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
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
          padding: 16px;
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

        .leaderboard-title {
          font-size: 16px;
        }
      }

      /* Responsive Design - Small Mobile */
      @media (max-width: 480px) {
        .dashboard-container {
          padding: 12px;
          gap: 16px;
        }

        .center-panel {
          padding: 16px;
        }

        .clock-wrap {
          width: 280px;
          max-width: 95vw;
          padding: 20px;
        }

        .leaderboard-panel {
          padding: 14px;
          max-height: 280px;
          overflow: hidden;
        }

        .todo-panel {
          padding: 14px;
          min-height: 200px;
        }

        .btn-group {
          flex-direction: column;
          gap: 8px;
        }

        .btn-group > * {
          width: 100%;
          max-width: 280px;
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

        .user-info {
          font-size: 12px;
          padding: 0 8px;
        }

        .leaderboard-title {
          font-size: 14px;
        }
      }

      @media (max-width: 320px) {
        .dashboard-container {
          padding: 8px;
        }

        .center-panel {
          padding: 16px;
        }

        .clock-wrap {
          width: 280px;
          padding: 20px;
        }

        .user-info {
          font-size: 12px;
          padding: 0 12px;
        }

        .leaderboard-panel {
          padding: 12px;
          max-height: 250px;
          overflow: hidden;
        }

        .todo-panel {
          padding: 12px;
          min-height: 180px;
        }

        .leaderboard-title {
          font-size: 14px;
        }

        .theme-btn {
          min-width: 40px;
          min-height: 40px;
          padding: 8px;
          font-size: 12px;
        }
      }

      /* Theme-specific card styling */
      :global(.dark) .card {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(71, 85, 105, 0.4);
        backdrop-filter: blur(20px);
      }

      :global(.dark-blue) .card {
        background: rgba(30, 58, 138, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
        backdrop-filter: blur(20px);
      }

      :global(.pink) .card {
        background: rgba(252, 231, 243, 0.9);
        border-color: rgba(236, 72, 153, 0.25);
        backdrop-filter: blur(15px);
      }

      :global(.yellow) .card {
        background: rgba(254, 243, 199, 0.9);
        border-color: rgba(245, 158, 11, 0.25);
        backdrop-filter: blur(15px);
      }

      :global(.green) .card {
        background: rgba(220, 252, 231, 0.9);
        border-color: rgba(34, 197, 94, 0.25);
        backdrop-filter: blur(15px);
      }

      /* Theme-specific clock styling */
      :global(.dark) .clock-wrap {
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(71, 85, 105, 0.5);
      }

      :global(.dark-blue) .clock-wrap {
        background: rgba(30, 58, 138, 0.3);
        border-color: rgba(59, 130, 246, 0.4);
      }

      :global(.pink) .clock-wrap {
        background: rgba(252, 231, 243, 0.8);
        border-color: rgba(236, 72, 153, 0.3);
      }

      :global(.yellow) .clock-wrap {
        background: rgba(254, 243, 199, 0.8);
        border-color: rgba(245, 158, 11, 0.3);
      }

      :global(.green) .clock-wrap {
        background: rgba(220, 252, 231, 0.8);
        border-color: rgba(34, 197, 94, 0.3);
      }

      /* Touch-specific optimizations */
      @media (hover: none) and (pointer: coarse) {
        .clock-wrap:hover {
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
          padding: 8px;
          min-height: 100vh;
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
        .btn, .theme-btn {
          min-height: 44px;
          min-width: 44px;
        }

        /* Improve scroll area for touch */
        .leaderboard-unified-scroll {
          padding: 4px;
        }
      }
    `}</style>
    </>
  );
}