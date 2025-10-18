import { useEffect, useState } from 'react';
import Router from 'next/router';

export default function Admin() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});
  const [opBusy, setOpBusy] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  const [testMusic, setTestMusic] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPoints, setUserPoints] = useState('');
  const [userStreak, setUserStreak] = useState('');

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

  // Calculate debug information about clock-synchronized timer windows
  function calculateDebugInfo(user) {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    const currentMs = now.getMilliseconds();
    
    // Calculate current time in milliseconds within the hour
    const currentTimeInHour = (currentMinutes * 60 + currentSeconds) * 1000 + currentMs;
    
    // Define confirmation windows: :00-:01 and :30-:31 (60 seconds each)
    const window1Start = 0; // :00:00
    const window1End = 60 * 1000; // :01:00
    const window2Start = 30 * 60 * 1000; // :30:00
    const window2End = 31 * 60 * 1000; // :31:00
    
    let isInWindow = false;
    let msUntilWindow = 0;
    let currentWindow = '';
    let nextWindow = '';
    let windowEndTime = 0;
    
    if (currentTimeInHour >= window1Start && currentTimeInHour < window1End) {
      // Currently in first window (:00-:01)
      isInWindow = true;
      currentWindow = ':00-:01';
      nextWindow = ':30-:31';
      windowEndTime = now.getTime() + (window1End - currentTimeInHour);
      msUntilWindow = 0;
    } else if (currentTimeInHour >= window2Start && currentTimeInHour < window2End) {
      // Currently in second window (:30-:31)
      isInWindow = true;
      currentWindow = ':30-:31';
      nextWindow = ':00-:01 (next hour)';
      windowEndTime = now.getTime() + (window2End - currentTimeInHour);
      msUntilWindow = 0;
    } else {
      // Not in window, calculate time until next window
      if (currentTimeInHour < window1Start) {
        // Before first window today
        msUntilWindow = window1Start - currentTimeInHour;
        nextWindow = ':00-:01';
      } else if (currentTimeInHour < window2Start) {
        // Between windows, next is :30
        msUntilWindow = window2Start - currentTimeInHour;
        nextWindow = ':30-:31';
      } else {
        // After second window, next is :00 of next hour
        const msUntilNextHour = (60 * 60 * 1000) - currentTimeInHour;
        msUntilWindow = msUntilNextHour;
        nextWindow = ':00-:01 (next hour)';
      }
    }

    return {
      currentTime: now.toISOString(),
      currentClockTime: now.toLocaleTimeString(),
      lastConfirm: user?.lastConfirm || 'Never',
      currentMinutes,
      currentSeconds,
      isInWindow,
      currentWindow: currentWindow || 'None',
      nextWindow,
      msUntilWindow,
      msUntilWindowEnd: isInWindow ? Math.max(0, windowEndTime - now.getTime()) : 0,
      minutesUntilWindow: Math.floor(msUntilWindow / (60 * 1000)),
      secondsUntilWindow: Math.floor((msUntilWindow % (60 * 1000)) / 1000),
      canConfirm: isInWindow,
      systemType: 'Clock-Synchronized (:00 and :30 every hour)'
    };
  }

  // Set lastConfirm to a specific time for testing
  async function setLastConfirmTime(minutesAgo) {
    if (opBusy) return;
    setOpBusy(true);
    
    try {
      const targetTime = new Date(Date.now() - (minutesAgo * 60 * 1000)).toISOString();
      const res = await fetch('/api/admin/set-last-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastConfirm: targetTime })
      });
      
      if (res.ok) {
        await fetchMe();
        alert(`Set lastConfirm to ${minutesAgo} minutes ago`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to set lastConfirm');
      }
    } catch (err) {
      console.error('setLastConfirmTime error', err);
      alert('Network error while setting lastConfirm');
    } finally {
      setOpBusy(false);
    }
  }

  // Reset lastConfirm to trigger immediate confirmation window
  async function resetLastConfirm() {
    if (opBusy) return;
    setOpBusy(true);
    
    try {
      const res = await fetch('/api/admin/reset-last-confirm', {
        method: 'POST'
      });
      
      if (res.ok) {
        await fetchMe();
        alert('Reset lastConfirm - confirmation window should be available now');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset lastConfirm');
      }
    } catch (err) {
      console.error('resetLastConfirm error', err);
      alert('Network error while resetting lastConfirm');
    } finally {
      setOpBusy(false);
    }
  }

  // Test notification system
  async function testNotifications() {
    if (!('Notification' in window)) {
      alert('❌ This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      showTestNotification();
    } else if (Notification.permission === 'denied') {
      alert('❌ Notifications are blocked. Please enable them in browser settings.');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showTestNotification();
      } else {
        alert('❌ Notification permission denied');
      }
    }
  }

  function showTestNotification() {
    try {
      const notification = new Notification('🎯 Admin Test Notification', {
        body: 'This is a test of the enhanced notification system! Click to dismiss.',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        tag: 'admin-test',
        icon: '/favicon.ico'
      });

      notification.onclick = () => {
        notification.close();
        alert('✅ Notification clicked successfully!');
      };

      setTimeout(() => {
        if (notification) {
          notification.close();
        }
      }, 10000);

    } catch (e) {
      alert('❌ Error creating notification: ' + e.message);
    }
  }

  // Test background music
  function testBackgroundMusic() {
    if (testMusic) {
      // Stop music
      testMusic.pause();
      testMusic.currentTime = 0;
      setTestMusic(null);
      return;
    }

    try {
      const audio = new Audio('/music.mp3');
      audio.volume = 0.3;
      audio.loop = true;
      
      audio.play().then(() => {
        setTestMusic(audio);
        alert('🎵 Background music started! Click the button again to stop.');
      }).catch(e => {
        alert('❌ Music autoplay blocked: ' + e.message + '\n💡 Try clicking on the page first, then test music');
      });
    } catch (e) {
      alert('❌ Error with music: ' + e.message);
    }
  }

  // Quick test - set to 29 minutes 50 seconds (10 seconds before window)
  async function quickTest() {
    if (opBusy) return;
    setOpBusy(true);
    
    try {
      const targetTime = new Date(Date.now() - (29 * 60 + 50) * 1000).toISOString();
      const res = await fetch('/api/admin/set-last-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastConfirm: targetTime })
      });
      
      if (res.ok) {
        await fetchMe();
        alert('⚡ Quick Test: Window opens in 10 seconds! Go to dashboard to see notifications.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to set quick test');
      }
    } catch (err) {
      console.error('quickTest error', err);
      alert('Network error during quick test');
    } finally {
      setOpBusy(false);
    }
  }

  // Instant window test
  async function instantWindow() {
    if (opBusy) return;
    setOpBusy(true);
    
    try {
      const targetTime = new Date(Date.now() - (30 * 60 + 30) * 1000).toISOString();
      const res = await fetch('/api/admin/set-last-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastConfirm: targetTime })
      });
      
      if (res.ok) {
        await fetchMe();
        alert('🚀 Instant Window: Confirmation window is NOW OPEN! Go to dashboard immediately.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create instant window');
      }
    } catch (err) {
      console.error('instantWindow error', err);
      alert('Network error during instant window test');
    } finally {
      setOpBusy(false);
    }
  }

  // Test points and streak
  async function testPoints(action, value) {
    if (opBusy) return;
    setOpBusy(true);
    
    try {
      const body = { action };
      if (action === 'add-points' || action === 'set-points') {
        body.points = value;
      } else if (action === 'set-streak') {
        body.streak = value;
      }

      const res = await fetch('/api/admin/test-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        await fetchMe();
        const data = await res.json();
        alert(`✅ ${action.replace('-', ' ')} successful! Points: ${data.user.points}, Streak: ${data.user.streak}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update points/streak');
      }
    } catch (err) {
      console.error('testPoints error', err);
      alert('Network error during points test');
    } finally {
      setOpBusy(false);
    }
  }

  // Simulate different scenarios
  async function simulateScenario(scenario) {
    if (opBusy) return;
    setOpBusy(true);
    
    try {
      const res = await fetch('/api/admin/simulate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      
      if (res.ok) {
        await fetchMe();
        const data = await res.json();
        const messages = {
          'successful-confirm': '✅ Simulated successful confirmation! Points and streak updated.',
          'missed-window': '❌ Simulated missed window! Streak reset to 0.',
          'build-streak': '🔥 Built up streak to 5! Added 10 points.',
          'new-user': '👤 Reset to new user state! All progress cleared.'
        };
        alert(messages[scenario] + ` Points: ${data.user.points}, Streak: ${data.user.streak}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to simulate scenario');
      }
    } catch (err) {
      console.error('simulateScenario error', err);
      alert('Network error during scenario simulation');
    } finally {
      setOpBusy(false);
    }
  }

  // Fetch all users for management
  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('fetchUsers error', err);
    }
  }

  // Delete a user account
  async function deleteUser(userId, userName) {
    if (opBusy) return;
    
    const confirmed = confirm(`⚠️ DELETE USER ACCOUNT\n\nAre you sure you want to permanently delete "${userName}"?\n\nThis action cannot be undone and will:\n• Delete all user data\n• Remove from leaderboard\n• Clear all progress\n\nType "DELETE" to confirm:`);
    
    if (!confirmed) return;
    
    const verification = prompt(`Type "DELETE" to confirm deletion of ${userName}:`);
    if (verification !== 'DELETE') {
      alert('Deletion cancelled - verification failed');
      return;
    }
    
    setOpBusy(true);
    try {
      const res = await fetch('/api/admin/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-user', userId })
      });
      
      if (res.ok) {
        alert(`✅ User "${userName}" deleted successfully`);
        await fetchUsers(); // Refresh user list
      } else {
        const data = await res.json();
        alert(`❌ Failed to delete user: ${data.error}`);
      }
    } catch (err) {
      console.error('Delete user error', err);
      alert('❌ Network error while deleting user');
    } finally {
      setOpBusy(false);
    }
  }

  // Update user points and streak
  async function updateUserPoints(userId, userName) {
    if (opBusy || !userPoints) return;
    
    setOpBusy(true);
    try {
      const res = await fetch('/api/admin/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'set-points', 
          userId, 
          points: parseInt(userPoints),
          streak: userStreak ? parseInt(userStreak) : undefined
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Updated ${userName}: ${data.user.points} points, ${data.user.streak} streak`);
        await fetchUsers(); // Refresh user list
        setUserPoints('');
        setUserStreak('');
        setSelectedUser(null);
      } else {
        const data = await res.json();
        alert(`❌ Failed to update user: ${data.error}`);
      }
    } catch (err) {
      console.error('Update user error', err);
      alert('❌ Network error while updating user');
    } finally {
      setOpBusy(false);
    }
  }

  // Reset user progress
  async function resetUser(userId, userName) {
    if (opBusy) return;
    
    const confirmed = confirm(`Reset all progress for "${userName}"?\n\nThis will set:\n• Points: 0\n• Streak: 0\n• Last confirmation: None\n\nContinue?`);
    if (!confirmed) return;
    
    setOpBusy(true);
    try {
      const res = await fetch('/api/admin/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-user', userId })
      });
      
      if (res.ok) {
        alert(`✅ Reset ${userName} progress successfully`);
        await fetchUsers(); // Refresh user list
      } else {
        const data = await res.json();
        alert(`❌ Failed to reset user: ${data.error}`);
      }
    } catch (err) {
      console.error('Reset user error', err);
      alert('❌ Network error while resetting user');
    } finally {
      setOpBusy(false);
    }
  }

  useEffect(() => {
    fetchMe();
    fetchUsers();
    
    // Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus('not-supported');
    }
  }, []);

  useEffect(() => {
    if (me) {
      const updateDebugInfo = () => {
        setDebugInfo(calculateDebugInfo(me));
      };
      
      updateDebugInfo();
      const interval = setInterval(updateDebugInfo, 1000);
      return () => {
        clearInterval(interval);
        // Cleanup music when component unmounts
        if (testMusic) {
          testMusic.pause();
          testMusic.currentTime = 0;
        }
      };
    }
  }, [me, testMusic]);

  if (loadingMe || !me) {
    return (
      <div className="container">
        <main className="main-panel card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {loadingMe ? 'Loading...' : 'Please log in to access admin panel'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <main className="main-panel card">
        <div style={{ padding: '1rem' }}>
          <h2>Admin Timer Testing Panel</h2>
          <p>User: <strong>{me.name}</strong> | Points: <strong>{me.points}</strong> | Streak: <strong>{me.streak}</strong></p>
          
          <div style={{ marginBottom: '2rem' }}>
            <button 
              className="btn secondary" 
              onClick={() => Router.push('/dashboard')}
              disabled={opBusy}
            >
              Back to Dashboard
            </button>
            <button 
              className="btn secondary" 
              onClick={() => window.open('/test-notifications.html', '_blank')}
              style={{ marginLeft: '8px' }}
            >
              Open Notification Test Page
            </button>
          </div>

          {/* Quick Testing Section */}
          <div className="admin-section admin-clock-section" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '12px', border: '2px solid #4ade80' }}>
            <h3 style={{ color: '#166534', margin: '0 0 1rem 0' }}>⚡ Clock-Synchronized Testing</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                className="btn" 
                onClick={() => {
                  const now = new Date();
                  const nextWindow = now.getMinutes() < 30 ? ':30' : ':00 (next hour)';
                  alert(`⏰ Clock-Synchronized System Active!\n\nNext confirmation window: ${nextWindow}\nWindows open at :00 and :30 of every hour for 60 seconds.`);
                }}
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                ⏰ Check Next Window
              </button>
              <button 
                className="btn" 
                onClick={() => {
                  const now = new Date();
                  const isInWindow = (now.getMinutes() === 0 || now.getMinutes() === 30) && now.getSeconds() < 60;
                  if (isInWindow) {
                    alert('✅ Confirmation window is OPEN NOW! Go to dashboard to confirm.');
                  } else {
                    const nextWindow = now.getMinutes() < 30 ? ':30' : ':00 (next hour)';
                    alert(`⏳ No window currently open.\nNext window: ${nextWindow}`);
                  }
                }}
                style={{ backgroundColor: '#3b82f6', color: 'white' }}
              >
                🔍 Check Current Status
              </button>
            </div>
            <div className="admin-description" style={{ fontSize: '0.85rem', color: '#166534' }}>
              <strong>New System:</strong> Confirmation windows sync to clock at :00 and :30 of every hour (60 seconds each)
            </div>
          </div>

          {/* Notification Testing Section */}
          <div className="admin-section admin-notification-section" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '2px solid #3b82f6' }}>
            <h3 style={{ color: '#1d4ed8', margin: '0 0 1rem 0' }}>🔔 Notification & Audio Testing</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>Notification Status:</strong> 
                <span style={{ 
                  color: notificationStatus === 'granted' ? 'green' : notificationStatus === 'denied' ? 'red' : 'orange',
                  marginLeft: '8px'
                }}>
                  {notificationStatus === 'granted' ? '✅ Enabled' : 
                   notificationStatus === 'denied' ? '❌ Blocked' : 
                   notificationStatus === 'default' ? '⚠️ Not requested' : '❌ Not supported'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                className="btn" 
                onClick={testNotifications}
                style={{ backgroundColor: '#3b82f6', color: 'white' }}
              >
                🔔 Test Notifications
              </button>
              <button 
                className="btn" 
                onClick={testBackgroundMusic}
                style={{ backgroundColor: testMusic ? '#ef4444' : '#8b5cf6', color: 'white' }}
              >
                {testMusic ? '🔇 Stop Music' : '🎵 Test Music'}
              </button>
            </div>
            <div className="admin-description" style={{ fontSize: '0.85rem', color: '#1d4ed8', marginTop: '0.5rem' }}>
              Test notifications and background music independently before testing the full confirmation flow
            </div>
          </div>

          {/* Points & Streak Testing */}
          <div className="admin-section admin-points-section" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fef7ff', borderRadius: '12px', border: '2px solid #a855f7' }}>
            <h3 style={{ color: '#7c3aed', margin: '0 0 1rem 0' }}>🏆 Points & Streak Testing</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                className="btn" 
                onClick={() => testPoints('add-points', 1)}
                disabled={opBusy}
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                +1 Point
              </button>
              <button 
                className="btn" 
                onClick={() => testPoints('add-points', 5)}
                disabled={opBusy}
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                +5 Points
              </button>
              <button 
                className="btn" 
                onClick={() => testPoints('set-streak', 5)}
                disabled={opBusy}
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
              >
                Set Streak to 5
              </button>
              <button 
                className="btn" 
                onClick={() => testPoints('reset-all')}
                disabled={opBusy}
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Reset All
              </button>
            </div>
            <div className="admin-description" style={{ fontSize: '0.85rem', color: '#7c3aed' }}>
              Test points and streak changes to see leaderboard updates
            </div>
          </div>

          {/* Scenario Simulation */}
          <div className="admin-section admin-scenario-section" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '2px solid #22c55e' }}>
            <h3 style={{ color: '#166534', margin: '0 0 1rem 0' }}>🎭 Scenario Simulation</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                className="btn" 
                onClick={() => simulateScenario('successful-confirm')}
                disabled={opBusy}
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                ✅ Successful Confirm
              </button>
              <button 
                className="btn" 
                onClick={() => simulateScenario('missed-window')}
                disabled={opBusy}
                style={{ backgroundColor: '#f97316', color: 'white' }}
              >
                ❌ Missed Window
              </button>
              <button 
                className="btn" 
                onClick={() => simulateScenario('build-streak')}
                disabled={opBusy}
                style={{ backgroundColor: '#8b5cf6', color: 'white' }}
              >
                🔥 Build Streak (5x)
              </button>
              <button 
                className="btn" 
                onClick={() => simulateScenario('new-user')}
                disabled={opBusy}
                style={{ backgroundColor: '#6b7280', color: 'white' }}
              >
                👤 New User State
              </button>
            </div>
            <div className="admin-description" style={{ fontSize: '0.85rem', color: '#166534' }}>
              Simulate different user scenarios to test various app states and behaviors
            </div>
          </div>

          {/* User Management Section */}
          <div className="admin-section admin-user-section" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #ef4444' }}>
            <h3 style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>👥 User Management</h3>
            
            {/* User List */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>All Users ({users.length})</h4>
                <button
                  className="btn"
                  onClick={fetchUsers}
                  disabled={opBusy}
                  style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px',
                    backgroundColor: '#6b7280',
                    color: 'white'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="admin-user-list" style={{ 
                maxHeight: '200px', 
                overflowY: 'auto', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                {users.map(user => (
                  <div key={user.id} className="admin-user-item" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {user.name}
                        {user.onlineStatus === 'online' && (
                          <span style={{
                            fontSize: '8px',
                            padding: '2px 4px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: 600
                          }}>
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {user.points} pts • {user.streak} streak
                      </div>
                    </div>
                    <div className="admin-user-buttons" style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserPoints(user.points.toString());
                          setUserStreak(user.streak.toString());
                        }}
                        disabled={opBusy}
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={() => resetUser(user.id, user.name)}
                        disabled={opBusy}
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 8px',
                          backgroundColor: '#f59e0b',
                          color: 'white'
                        }}
                      >
                        Reset
                      </button>
                      <button
                        className="btn"
                        onClick={() => deleteUser(user.id, user.name)}
                        disabled={opBusy}
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    No users found
                  </div>
                )}
              </div>
            </div>

            {/* Edit User Form */}
            {selectedUser && (
              <div className="admin-edit-form-container" style={{ 
                padding: '1rem', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                  Edit User: {selectedUser.name}
                </h4>
                <div className="admin-edit-form" style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
                  <div className="admin-edit-inputs" style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                        Points
                      </label>
                      <input
                        type="number"
                        value={userPoints}
                        onChange={(e) => setUserPoints(e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          width: '80px',
                          fontSize: '14px'
                        }}
                        min="0"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                        Streak
                      </label>
                      <input
                        type="number"
                        value={userStreak}
                        onChange={(e) => setUserStreak(e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          width: '80px',
                          fontSize: '14px'
                        }}
                        min="0"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn"
                      onClick={() => updateUserPoints(selectedUser.id, selectedUser.name)}
                      disabled={opBusy || !userPoints}
                      style={{ backgroundColor: '#10b981', color: 'white' }}
                    >
                      Update
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setSelectedUser(null);
                        setUserPoints('');
                        setUserStreak('');
                      }}
                      disabled={opBusy}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-description" style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '1rem' }}>
              <strong>⚠️ Warning:</strong> User management actions are permanent and cannot be undone. Use with caution.
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Debug Information</h3>
            <div className="admin-debug-info" style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              padding: '1rem', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              <div><strong>System Type:</strong> {debugInfo.systemType}</div>
              <div><strong>Current Time:</strong> {debugInfo.currentTime}</div>
              <div><strong>Clock Time:</strong> {debugInfo.currentClockTime}</div>
              <div><strong>Current Minutes:</strong> :{debugInfo.currentMinutes?.toString().padStart(2, '0')}:{debugInfo.currentSeconds?.toString().padStart(2, '0')}</div>
              <div><strong>Last Confirm:</strong> {debugInfo.lastConfirm}</div>
              <div><strong>Current Window:</strong> <span style={{ color: debugInfo.isInWindow ? 'green' : 'orange' }}>{debugInfo.currentWindow}</span></div>
              <div><strong>Next Window:</strong> {debugInfo.nextWindow}</div>
              <div><strong>Is In Window:</strong> <span style={{ color: debugInfo.isInWindow ? 'green' : 'red' }}>{debugInfo.isInWindow ? 'YES' : 'NO'}</span></div>
              <div><strong>Can Confirm:</strong> <span style={{ color: debugInfo.canConfirm ? 'green' : 'red' }}>{debugInfo.canConfirm ? 'YES' : 'NO'}</span></div>
              <div><strong>Time Until Next Window:</strong> {debugInfo.minutesUntilWindow}m {debugInfo.secondsUntilWindow}s</div>
              {debugInfo.isInWindow && (
                <div><strong>Window Closes In:</strong> {Math.floor(debugInfo.msUntilWindowEnd / 60000)}m {Math.floor((debugInfo.msUntilWindowEnd % 60000) / 1000)}s</div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>⏰ Clock Information</h3>
            <div className="admin-clock-info" style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                <div><strong>🕐 Confirmation Windows:</strong></div>
                <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  • <strong>:00 - :01</strong> every hour (60 seconds)
                </div>
                <div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                  • <strong>:30 - :31</strong> every hour (60 seconds)
                </div>
                
                <div><strong>🎯 How it works:</strong></div>
                <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  • All users see the same countdown to :00 or :30
                </div>
                <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  • No personal timers - everyone syncs to the clock
                </div>
                <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  • Streak continues if you confirm in consecutive windows
                </div>
                <div style={{ marginLeft: '1rem' }}>
                  • Miss a window? Just wait for the next one!
                </div>
              </div>
            </div>
          </div>

          <div className="admin-workflow" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h4>🎯 Testing the Clock-Synchronized System</h4>
            <ol style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <li><strong>Test Notifications First:</strong> Use "Test Notifications" to ensure browser permissions are working</li>
              <li><strong>Test Music:</strong> Use "Test Music" to verify audio playback works</li>
              <li><strong>Check Current Status:</strong> Use "Check Current Status" to see if a window is currently open</li>
              <li><strong>Wait for Next Window:</strong> Windows open at :00 and :30 of every hour</li>
              <li><strong>Go to Dashboard:</strong> Switch to dashboard to see the countdown and experience notifications</li>
              <li><strong>Test Points & Streaks:</strong> Use the points testing section to simulate different scenarios</li>
            </ol>
            <div className="admin-tip" style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.85rem' }}>
              <strong>💡 New System:</strong> Everyone sees the same countdown to :00 or :30! No more personal 30-minute timers. Perfect for synchronized study sessions!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}