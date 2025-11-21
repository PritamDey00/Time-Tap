import { useEffect, useState } from 'react';
import Router from 'next/router';
import AccountButton from '../components/AccountButton';
import MusicSelector from '../components/MusicSelector';
import NotificationDemo from '../components/NotificationDemo';

export default function Account() {
  const [me, setMe] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [opBusy, setOpBusy] = useState(false);

  // Send heartbeat to track user activity
  async function sendHeartbeat() {
    try {
      await fetch('/api/heartbeat', { method: 'POST' });
    } catch (error) {
      // Silently fail - heartbeat is not critical
      console.log('Heartbeat failed:', error);
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

  useEffect(() => {
    fetchMe();
    sendHeartbeat();
    
    // Apply stored theme
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored) {
      applyTheme(stored);
    }
    
    // Send heartbeat every 30 seconds while on account page
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    return () => clearInterval(heartbeatInterval);
  }, []);

  async function fetchMe() {
    const res = await fetch('/api/me');
    const j = await res.json();
    if (!j.user) {
      Router.push('/');
      return;
    }
    setMe(j.user);
    setAvatarPreview(j.user.avatar || null);
  }



  // Logout (clears auth cookie server-side)
  async function handleLogout() {
    try {
      setOpBusy(true);
      await fetch('/api/logout', { method: 'POST' });
      Router.push('/');
    } catch (err) {
      console.error('logout error', err);
      Router.push('/');
    } finally {
      setOpBusy(false);
    }
  }

  // Delete account flow (requires password confirmation)
  async function handleDeleteAccount() {
    try {
      const sure = confirm('Delete your account? This is irreversible. Type OK to continue.');
      if (!sure) return;
      const password = prompt('Please enter your password to confirm account deletion:');
      if (!password) {
        alert('Deletion cancelled — password required.');
        return;
      }
      setOpBusy(true);
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        alert('Account deleted. You will be redirected to the home page.');
        Router.push('/');
      } else {
        const j = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(j.error || 'Could not delete account');
      }
    } catch (err) {
      console.error('delete account error', err);
      alert('Error deleting account');
    } finally {
      setOpBusy(false);
    }
  }

  async function handleUploadAvatar(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setAvatarPreview(dataUrl);
      setUploading(true);
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: dataUrl })
      });
      setUploading(false);
      if (res.ok) {
        fetchMe();
        alert('Avatar updated');
      } else {
        const j = await res.json().catch(()=>({ error: 'Unknown' }));
        alert(j.error || 'Could not update avatar');
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert('Provide both current and new password.');
      return;
    }
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (res.ok) {
      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      const j = await res.json().catch(()=>({ error: 'Unknown' }));
      alert(j.error || 'Could not change password');
    }
  }



  // Handle user updates from AccountButton
  const handleUserUpdate = (updatedUser) => {
    setMe(updatedUser);
  };

  // Handle music preference updates from MusicSelector
  const handleMusicChange = (updatedUser) => {
    setMe(updatedUser);
  };

  if (!me) return null;

  return (
    <>
      <AccountButton user={me} onUserUpdate={handleUserUpdate} />
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="card modern-card" style={{maxWidth:900,width:'100%',display:'flex',gap:32,padding:32,flexWrap:'wrap',alignItems:'flex-start'}}>
        <div style={{flex:'1 1 280px',minWidth:280}}>
          <h3 style={{marginTop:0,background:'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontSize:'24px',fontWeight:'700'}}>👤 Account</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',gap:16,alignItems:'center',padding:'20px',background:'var(--card-secondary)',borderRadius:'16px',border:'1px solid var(--glass-border)'}}>
              <div style={{width:96,height:96,borderRadius:20,overflow:'hidden',background:'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',boxShadow:'0 8px 25px var(--theme-primary)30'}}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  <div style={{fontWeight:700,color:'white',fontSize:'28px'}}>{me.name.slice(0,2).toUpperCase()}</div>
                )}
                <div style={{position:'absolute',inset:0,borderRadius:20,background:'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',pointerEvents:'none'}} />
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:'20px',marginBottom:'8px'}}>{me.name}</div>
                <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
                  <div style={{padding:'6px 12px',background:'linear-gradient(135deg, var(--theme-primary)20, var(--theme-secondary)20)',borderRadius:'8px',fontSize:'14px',fontWeight:'600',color:'var(--theme-primary)'}}>
                    🏆 {me.points} pts
                  </div>
                  <div style={{padding:'6px 12px',background:'linear-gradient(135deg, var(--theme-accent)20, var(--theme-primary)20)',borderRadius:'8px',fontSize:'14px',fontWeight:'600',color:'var(--theme-accent)'}}>
                    🔥 {me.streak || 0} streak
                  </div>
                </div>
              </div>
            </div>

            <div style={{marginTop:16}}>
              <label className="small" style={{fontWeight:600,color:'var(--primary)',marginBottom:'8px',display:'block'}}>Avatar</label>
              <div className="modern-file-upload">
                <input type="file" accept="image/*" onChange={handleUploadAvatar} />
                <div className="file-upload-button">
                  <span className="upload-icon">📸</span>
                  <span className="upload-text">Choose Avatar Image</span>
                  <span className="upload-icon">📁</span>
                </div>
              </div>
              {uploading && (
                <div className="file-upload-status uploading">
                  <span className="status-icon">⏳</span>
                  <span>Uploading avatar...</span>
                </div>
              )}
            </div>

            <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:8}}>
              <button className="btn" onClick={() => Router.push('/dashboard')} disabled={opBusy}>Back to Universal Classroom</button>
              <button className="btn" onClick={handleLogout} disabled={opBusy}>Logout</button>
              <button className="btn" onClick={handleDeleteAccount} style={{background:'#ef4444'}} disabled={opBusy}>Delete account</button>
            </div>

            {/* Music Selection Section */}
            <MusicSelector user={me} onMusicChange={handleMusicChange} />

            {/* Notification Demo Section */}
            <div style={{ marginTop: '24px' }}>
              <NotificationDemo />
            </div>
          </div>
        </div>

        <div style={{flex:'1 1 400px',minWidth:320}}>
          <h4 style={{marginTop:0,background:'linear-gradient(135deg, var(--theme-secondary), var(--theme-accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontSize:'20px',fontWeight:'700'}}>🔐 Change password</h4>
          <form onSubmit={handleChangePassword} style={{display:'flex',flexDirection:'column',gap:8}}>
            {/* Desktop: Horizontal label-input rows */}
            <div className="password-desktop-row">
              <label>Current password</label>
              <input className="input" type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
            </div>
            
            <div className="password-desktop-row">
              <label>New password</label>
              <input className="input" type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
            </div>
            
            {/* Mobile: Individual input groups (hidden on desktop) */}
            <div className="password-input-group">
              <label className="small">Current password</label>
              <input className="input" type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
            </div>
            <div className="password-input-group">
              <label className="small">New password</label>
              <input className="input" type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
            </div>
            
            <div className="form-actions">
              <div className="checkbox-container">
                <input id="showpass" type="checkbox" checked={showPasswords} onChange={(e)=>setShowPasswords(e.target.checked)} />
                <label htmlFor="showpass" className="small">Show passwords while typing</label>
              </div>
              
              <div className="button-container">
                <button className="btn" type="submit">Change password</button>
              </div>
            </div>
            
            <div className="small" style={{marginTop:6,color:'#6b7280'}}>
              Note: original passwords cannot be shown because they are stored securely as hashes. Use this to set a new password if you forgot it.
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}