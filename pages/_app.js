import '../styles/globals.css';
import { useEffect } from 'react';

function applyTheme(t) {
  if (typeof document === 'undefined') return;
  if (t === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light';
    applyTheme(stored);
  }, []);

  return <Component {...pageProps} />;
}