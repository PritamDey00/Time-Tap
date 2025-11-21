import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage leaderboard visibility persistence across window focus changes
 * Ensures leaderboard data remains fresh and visible when switching between windows/tabs
 */
export function useLeaderboardPersistence(fetchFunction, options = {}) {
  const {
    interval = 8000,
    refreshOnFocus = true,
    refreshOnVisibilityChange = true,
    sendHeartbeat = null
  } = options;

  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);

  const refreshData = useCallback(async () => {
    if (isActiveRef.current && fetchFunction) {
      try {
        await fetchFunction();
        if (sendHeartbeat) {
          await sendHeartbeat();
        }
      } catch (error) {
        console.error('Error refreshing leaderboard data:', error);
      }
    }
  }, [fetchFunction, sendHeartbeat]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(refreshData, interval);
  }, [refreshData, interval]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start the periodic refresh
    startInterval();

    const handleVisibilityChange = () => {
      if (refreshOnVisibilityChange) {
        if (document.hidden) {
          // Page is hidden, but keep interval running to maintain data freshness
          // This ensures when user comes back, data is already up to date
        } else {
          // Page became visible, refresh immediately
          refreshData();
        }
      }
    };

    const handleWindowFocus = () => {
      if (refreshOnFocus) {
        // Window gained focus, refresh data immediately
        refreshData();
        // Ensure interval is still running
        if (!intervalRef.current) {
          startInterval();
        }
      }
    };

    const handleWindowBlur = () => {
      // Window lost focus, but keep interval running
      // This maintains leaderboard persistence across window switches
    };

    // Add event listeners for visibility and focus changes
    if (typeof document !== 'undefined' && refreshOnVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    if (typeof window !== 'undefined' && refreshOnFocus) {
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('blur', handleWindowBlur);
    }

    return () => {
      stopInterval();
      
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
      }
    };
  }, [refreshData, startInterval, stopInterval, refreshOnFocus, refreshOnVisibilityChange]);

  // Provide methods to control the hook
  const pause = useCallback(() => {
    isActiveRef.current = false;
    stopInterval();
  }, [stopInterval]);

  const resume = useCallback(() => {
    isActiveRef.current = true;
    startInterval();
    refreshData();
  }, [startInterval, refreshData]);

  const forceRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return {
    pause,
    resume,
    forceRefresh,
    isActive: isActiveRef.current
  };
}

/**
 * Enhanced hook specifically for leaderboard data with built-in error handling
 * and retry logic for better reliability
 */
export function useLeaderboardData(fetchFunction, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError = null,
    ...persistenceOptions
  } = options;

  const retryCountRef = useRef(0);

  const wrappedFetchFunction = useCallback(async () => {
    try {
      await fetchFunction();
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        
        // Exponential backoff retry
        const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);
        
        setTimeout(() => {
          wrappedFetchFunction();
        }, delay);
      } else {
        // Max retries reached, call error handler if provided
        if (onError) {
          onError(error);
        }
        retryCountRef.current = 0; // Reset for next attempt
      }
    }
  }, [fetchFunction, maxRetries, retryDelay, onError]);

  return useLeaderboardPersistence(wrappedFetchFunction, persistenceOptions);
}