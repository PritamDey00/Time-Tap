// Theme optimization utilities for smooth transitions and performance

let isTransitioning = false;
let transitionTimeout = null;

/**
 * Optimized theme switching with smooth transitions
 * @param {string} themeId - The theme ID to switch to
 * @param {Function} callback - Optional callback after theme is applied
 */
export function optimizedThemeSwitch(themeId, callback) {
  if (typeof document === 'undefined') return;
  
  // Prevent multiple simultaneous transitions
  if (isTransitioning) {
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
    }
  }
  
  isTransitioning = true;
  
  // Add transition class to body for smooth animation
  document.body.classList.add('theme-transitioning');
  
  // Use requestAnimationFrame for smooth visual updates
  requestAnimationFrame(() => {
    // Remove all theme classes
    const themeClasses = ['dark', 'dark-blue', 'pink', 'yellow', 'green'];
    themeClasses.forEach(theme => {
      document.documentElement.classList.remove(theme);
    });
    
    // Add the selected theme class (except for light which is default)
    if (themeId !== 'light') {
      document.documentElement.classList.add(themeId);
    }
    
    // Store theme preference
    try {
      localStorage.setItem('theme', themeId);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
    
    // Remove transition class after animation completes
    transitionTimeout = setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
      isTransitioning = false;
      
      if (callback) {
        callback(themeId);
      }
    }, 300); // Match CSS transition duration
  });
}

/**
 * Preload theme assets to prevent flash during switching
 * @param {Array} themes - Array of theme objects with id and name
 */
export function preloadThemeAssets(themes) {
  if (typeof document === 'undefined') return;
  
  // Create a hidden div to preload CSS custom properties
  const preloadDiv = document.createElement('div');
  preloadDiv.style.position = 'absolute';
  preloadDiv.style.top = '-9999px';
  preloadDiv.style.left = '-9999px';
  preloadDiv.style.width = '1px';
  preloadDiv.style.height = '1px';
  preloadDiv.style.opacity = '0';
  preloadDiv.style.pointerEvents = 'none';
  
  themes.forEach(theme => {
    const themeDiv = document.createElement('div');
    themeDiv.className = theme.id;
    themeDiv.style.background = 'var(--bg-gradient-start)';
    themeDiv.style.color = 'var(--primary)';
    themeDiv.style.borderColor = 'var(--theme-primary)';
    preloadDiv.appendChild(themeDiv);
  });
  
  document.body.appendChild(preloadDiv);
  
  // Remove preload div after a short delay
  setTimeout(() => {
    if (preloadDiv.parentNode) {
      preloadDiv.parentNode.removeChild(preloadDiv);
    }
  }, 1000);
}

/**
 * Get the current theme from localStorage or default
 * @param {string} defaultTheme - Default theme if none is stored
 * @returns {string} Current theme ID
 */
export function getCurrentTheme(defaultTheme = 'light') {
  if (typeof window === 'undefined') return defaultTheme;
  
  try {
    return localStorage.getItem('theme') || defaultTheme;
  } catch (error) {
    console.warn('Failed to get theme preference:', error);
    return defaultTheme;
  }
}

/**
 * Initialize theme on page load with optimization
 * @param {string} themeId - Theme ID to initialize
 */
export function initializeTheme(themeId) {
  if (typeof document === 'undefined') return;
  
  // Apply theme immediately without transition for initial load
  const themeClasses = ['dark', 'dark-blue', 'pink', 'yellow', 'green'];
  themeClasses.forEach(theme => {
    document.documentElement.classList.remove(theme);
  });
  
  if (themeId !== 'light') {
    document.documentElement.classList.add(themeId);
  }
}

/**
 * Add global CSS for theme transitions
 */
export function addThemeTransitionStyles() {
  if (typeof document === 'undefined') return;
  
  // Check if styles already added
  if (document.getElementById('theme-transition-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'theme-transition-styles';
  style.textContent = `
    /* Theme transition optimization */
    .theme-transitioning * {
      transition: 
        background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    /* Prevent layout shifts during theme transitions */
    .theme-transitioning {
      overflow-x: hidden;
    }
    
    /* Optimize specific elements for theme switching */
    .theme-transitioning .card,
    .theme-transitioning .btn,
    .theme-transitioning .glass,
    .theme-transitioning .chat-box,
    .theme-transitioning .classroom-card {
      will-change: background-color, border-color, box-shadow;
    }
    
    /* Reduce motion for users who prefer it */
    @media (prefers-reduced-motion: reduce) {
      .theme-transitioning * {
        transition-duration: 0.1s !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Performance monitoring for theme switches
 */
export class ThemePerformanceMonitor {
  constructor() {
    this.metrics = {
      switchCount: 0,
      averageSwitchTime: 0,
      totalSwitchTime: 0
    };
  }
  
  startMeasure() {
    this.startTime = performance.now();
  }
  
  endMeasure() {
    if (!this.startTime) return;
    
    const duration = performance.now() - this.startTime;
    this.metrics.switchCount++;
    this.metrics.totalSwitchTime += duration;
    this.metrics.averageSwitchTime = this.metrics.totalSwitchTime / this.metrics.switchCount;
    
    // Log performance if it's slow
    if (duration > 100) {
      console.warn(`Slow theme switch detected: ${duration.toFixed(2)}ms`);
    }
    
    this.startTime = null;
    return duration;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  reset() {
    this.metrics = {
      switchCount: 0,
      averageSwitchTime: 0,
      totalSwitchTime: 0
    };
  }
}

// Global performance monitor instance
export const themePerformanceMonitor = new ThemePerformanceMonitor();