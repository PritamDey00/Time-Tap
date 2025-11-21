import '../styles/globals.css';
import '../styles/classroom-responsive.css';
import '../styles/classroom-themes.css';
import { useEffect } from 'react';
import ConfirmationDialogManager from '../components/ConfirmationDialogManager';

function applyTheme(t) {
  if (typeof document === 'undefined') return;
  
  // Remove all theme classes first
  const themes = ['dark', 'dark-blue', 'pink', 'yellow', 'green'];
  themes.forEach(theme => {
    document.documentElement.classList.remove(theme);
  });
  
  // Apply the selected theme
  if (t && t !== 'light') {
    document.documentElement.classList.add(t);
  }
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light';
    applyTheme(stored);
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <ConfirmationDialogManager />
    </>
  );
}