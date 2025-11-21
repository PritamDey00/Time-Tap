import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Apply stored theme
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored) {
      applyTheme(stored);
    }
  }, []);

  function applyTheme(theme) {
    if (typeof document === 'undefined') return;
    
    // Remove all theme classes
    const themeClasses = ['dark', 'dark-blue', 'pink', 'yellow', 'green'];
    themeClasses.forEach(t => {
      document.documentElement.classList.remove(t);
    });
    
    // Add the selected theme class (except for light which is default)
    if (theme !== 'light') {
      document.documentElement.classList.add(theme);
    }
    
    // Store theme preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setIsLoading(true);
    
    const url = isRegister ? '/api/register' : '/api/login';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    const data = await res.json();
    
    if (!res.ok) {
      setMsg(data.error || 'Error');
      setIsLoading(false);
      return;
    }
    
    // Check if user is admin (username is "admin") and redirect accordingly
    if (data.user && data.user.name === 'admin') {
      router.push('/admin');
    } else {
      // After register we just navigate to classrooms; login sets cookie server-side
      router.push('/classrooms');
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister);
    setMsg('');
  }

  return (
    <div className="login-container">
      {/* Animated background elements */}
      <div className="login-bg-elements">
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
        <div className="floating-element element-4"></div>
      </div>

      {/* Main login card */}
      <div className={`login-card ${mounted ? 'mounted' : ''}`}>
        {/* Header with animated icon */}
        <div className="login-header">
          <div className="login-icon">
            <div className="icon-circle">
              <span className="icon-emoji">🎓</span>
            </div>
          </div>
          <h1 className="login-title">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="login-subtitle">
            {isRegister 
              ? 'Join the minimalist study community' 
              : 'Continue your learning journey'
            }
          </p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={submit}>
          <div className="input-group">
            <div className="input-wrapper">
              <input 
                className="modern-input" 
                placeholder="Your name" 
                value={name} 
                onChange={e=>setName(e.target.value)}
                required
              />
              <span className="input-icon">👤</span>
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <input 
                className="modern-input" 
                placeholder="Password" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                required
              />
              <span className="input-icon">🔒</span>
            </div>
          </div>

          {/* Error message */}
          {msg && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {msg}
            </div>
          )}

          {/* Submit button */}
          <button 
            className={`login-btn ${isLoading ? 'loading' : ''}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <span className="btn-icon">
                  {isRegister ? '✨' : '🚀'}
                </span>
                {isRegister ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>

          {/* Toggle mode */}
          <div className="mode-toggle">
            <span className="toggle-text">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button 
              type="button" 
              className="toggle-btn" 
              onClick={toggleMode}
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Theme selector */}
        <div className="theme-selector-login">
          <div className="theme-label">Choose your theme:</div>
          <div className="theme-options">
            <button className="theme-btn light" onClick={() => applyTheme('light')} title="Light">☀️</button>
            <button className="theme-btn dark" onClick={() => applyTheme('dark')} title="Dark">🌙</button>
            <button className="theme-btn dark-blue" onClick={() => applyTheme('dark-blue')} title="Dark Blue">🌊</button>
            <button className="theme-btn pink" onClick={() => applyTheme('pink')} title="Pink">🌸</button>
            <button className="theme-btn yellow" onClick={() => applyTheme('yellow')} title="Yellow">☀️</button>
            <button className="theme-btn green" onClick={() => applyTheme('green')} title="Green">🌿</button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <div className="footer-icon">💡</div>
          <p>This is a prototype — use a unique name per student</p>
        </div>
      </div>
    </div>
  );
}