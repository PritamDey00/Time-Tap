import { useEffect, useState, useRef } from 'react';
import Router from 'next/router';
import AnalogClock from '../components/AnalogClock';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingMe, setLoadingMe] = useState(true);
  const [opBusy, setOpBusy] = useState(false);
  const [theme, setTheme] = useState('light');
  const refetch = useRef(null);

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
      const res = await fetch('/api/users');
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

    // refresh leaderboard periodically and send heartbeat
    refetch.current = setInterval(() => {
      fetchUsers();
      sendHeartbeat();
    }, 8000);
    
    return () => clearInterval(refetch.current);
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
        await fetchUsers();
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

  function toggleTheme() {
    const currentIndex = themes.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex].id;
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  }

  function setSpecificTheme(themeId) {
    setTheme(themeId);
    localStorage.setItem('theme', themeId);
    applyTheme(themeId);
  }



  if (loadingMe || !me) return null;

  // Use server timezone if present, otherwise default to Asia/Kolkata (India)
  const timeZone = me.timezone || 'Asia/Kolkata';

  return (
    <div className="container">
      <main className="main-panel card" aria-live="polite">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="clock-wrap" aria-hidden={false}>
            <AnalogClock timeZone={timeZone} />
          </div>

          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Timer lastConfirm={me.lastConfirm} createdAt={me.createdAt} onConfirm={handleConfirm} />

            <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '0 8px' }}>
              Signed in as <strong>{me.name}</strong> — Points: <strong>{me.points}</strong> • Streak: <strong>{me.streak}</strong>
            </div>

            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
              <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '12px', textAlign: 'center', maxWidth: '90vw', margin: '8px auto 0' }}>
                <strong>⚠️ Enable notifications</strong> to get alerts when confirmation window opens!
                <button 
                  onClick={() => Notification.requestPermission()} 
                  style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '11px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Enable
                </button>
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              <button className="btn secondary" onClick={() => Router.push('/account')} disabled={opBusy}>
                👤 Account
              </button>
              
              {/* Theme Selector */}
              <div style={{ 
                display: 'flex', 
                gap: 4, 
                padding: '4px', 
                background: 'var(--glass)', 
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(10px)'
              }}>
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSpecificTheme(t.id)}
                    disabled={opBusy}
                    style={{
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '8px',
                      background: theme === t.id ? 'var(--theme-primary)' : 'transparent',
                      color: theme === t.id ? 'white' : 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
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

      <aside className="side-panel card modern-sidebar" aria-label="Leaderboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 16px' }}>
          <h4 style={{ 
            margin: 0, 
            background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            🏆 Leaderboard
          </h4>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: '4px 8px',
            background: 'var(--card-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
            }} title="Online" />
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#f59e0b',
              boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
            }} title="Away" />
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#6b7280',
              boxShadow: '0 0 8px rgba(107, 114, 128, 0.3)'
            }} title="Offline" />
          </div>
        </div>
        <Leaderboard users={users} me={me} />
      </aside>
    </div>
  );
}