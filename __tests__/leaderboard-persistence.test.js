import { renderHook, act } from '@testing-library/react';
import { useLeaderboardPersistence, useLeaderboardData } from '../lib/useLeaderboardPersistence';

// Mock window and document objects
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    hidden: false,
  },
  writable: true,
});

// Mock timers
jest.useFakeTimers();

describe('Leaderboard Persistence', () => {
  let mockFetchFunction;
  let mockSendHeartbeat;

  beforeEach(() => {
    mockFetchFunction = jest.fn().mockResolvedValue();
    mockSendHeartbeat = jest.fn().mockResolvedValue();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useLeaderboardPersistence', () => {
    test('sets up periodic refresh interval', () => {
      const { result } = renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction, {
          interval: 5000,
          sendHeartbeat: mockSendHeartbeat,
        })
      );

      // Fast-forward time to trigger interval
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockFetchFunction).toHaveBeenCalled();
      expect(mockSendHeartbeat).toHaveBeenCalled();
    });

    test('adds window focus and visibility event listeners', () => {
      renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction, {
          refreshOnFocus: true,
          refreshOnVisibilityChange: true,
        })
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    test('removes event listeners on cleanup', () => {
      const { unmount } = renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction)
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    test('provides pause and resume functionality', () => {
      const { result } = renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction, { interval: 1000 })
      );

      // Pause the hook
      act(() => {
        result.current.pause();
      });

      // Fast-forward time - should not call fetch function when paused
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockFetchFunction).not.toHaveBeenCalled();

      // Resume the hook
      act(() => {
        result.current.resume();
      });

      // Should call fetch function immediately on resume
      expect(mockFetchFunction).toHaveBeenCalled();
    });

    test('provides force refresh functionality', () => {
      const { result } = renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction)
      );

      act(() => {
        result.current.forceRefresh();
      });

      expect(mockFetchFunction).toHaveBeenCalled();
    });
  });

  describe('useLeaderboardData', () => {
    test('handles fetch errors with retry logic', async () => {
      const mockError = new Error('Network error');
      mockFetchFunction.mockRejectedValueOnce(mockError);
      mockFetchFunction.mockResolvedValueOnce(); // Second call succeeds

      const { result } = renderHook(() =>
        useLeaderboardData(mockFetchFunction, {
          interval: 1000,
          maxRetries: 2,
          retryDelay: 100,
        })
      );

      // Trigger initial fetch
      act(() => {
        result.current.forceRefresh();
      });

      // Fast-forward to trigger retry
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should have called fetch function twice (initial + retry)
      expect(mockFetchFunction).toHaveBeenCalledTimes(2);
    });

    test('calls error handler after max retries', async () => {
      const mockError = new Error('Persistent network error');
      const mockErrorHandler = jest.fn();
      
      mockFetchFunction.mockRejectedValue(mockError);

      renderHook(() =>
        useLeaderboardData(mockFetchFunction, {
          interval: 1000,
          maxRetries: 2,
          retryDelay: 100,
          onError: mockErrorHandler,
        })
      );

      // Trigger initial fetch and retries
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Fast-forward through all retries
      act(() => {
        jest.advanceTimersByTime(300); // 100ms + 200ms (exponential backoff)
      });

      // Should call error handler after max retries
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Window Focus Integration', () => {
    test('refreshes data when window gains focus', () => {
      let focusHandler;
      
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'focus') {
          focusHandler = handler;
        }
      });

      renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction, {
          refreshOnFocus: true,
        })
      );

      // Simulate window focus event
      act(() => {
        focusHandler();
      });

      expect(mockFetchFunction).toHaveBeenCalled();
    });

    test('refreshes data when page becomes visible', () => {
      let visibilityHandler;
      
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'visibilitychange') {
          visibilityHandler = handler;
        }
      });

      renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction, {
          refreshOnVisibilityChange: true,
        })
      );

      // Simulate page becoming visible
      document.hidden = false;
      act(() => {
        visibilityHandler();
      });

      expect(mockFetchFunction).toHaveBeenCalled();
    });

    test('does not refresh when page is hidden', () => {
      let visibilityHandler;
      
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'visibilitychange') {
          visibilityHandler = handler;
        }
      });

      renderHook(() =>
        useLeaderboardPersistence(mockFetchFunction, {
          refreshOnVisibilityChange: true,
        })
      );

      // Simulate page becoming hidden
      document.hidden = true;
      act(() => {
        visibilityHandler();
      });

      expect(mockFetchFunction).not.toHaveBeenCalled();
    });
  });
});