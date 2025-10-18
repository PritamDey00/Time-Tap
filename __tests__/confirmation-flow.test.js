/**
 * Integration tests for the full timer confirmation flow
 * Tests the complete user journey from timer display to successful confirmation
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Timer from '../components/Timer';

// Mock the confirmation API
const mockConfirmResponse = {
  user: {
    id: 'test-user',
    name: 'Test User',
    points: 1,
    streak: 1,
    lastConfirm: new Date().toISOString()
  },
  pointsAwarded: 1
};

describe('Timer Confirmation Flow Integration', () => {
  let originalDateNow;
  let mockOnConfirm;

  beforeEach(() => {
    originalDateNow = Date.now;
    mockOnConfirm = jest.fn();
    fetch.mockClear();
  });

  afterEach(() => {
    Date.now = originalDateNow;
    jest.clearAllTimers();
  });

  describe('Timer display and countdown', () => {
    test('displays correct countdown when outside confirmation window', async () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:25:00.000Z').getTime(); // 25 minutes after
      Date.now = jest.fn(() => mockNow);

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Next confirmation in: 05:00')).toBeInTheDocument();
      expect(screen.queryByText('Confirmation window open — 60s')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    });

    test('shows confirmation button when in window', async () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime(); // 30.5 minutes after
      Date.now = jest.fn(() => mockNow);

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Next confirmation in: 00:00')).toBeInTheDocument();
      expect(screen.getByText('Confirmation window open — 60s')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    test('uses createdAt when lastConfirm is not provided', async () => {
      const createdAt = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:25:00.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      render(
        <Timer
          userId="test-user"
          lastConfirm={null}
          createdAt={createdAt}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Next confirmation in: 05:00')).toBeInTheDocument();
    });
  });

  describe('Successful confirmation flow', () => {
    test('successfully confirms and calls onConfirm callback', async () => {
      const user = userEvent.setup();
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfirmResponse
      });

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'test-user',
            clientTs: mockNow
          })
        });
      });

      expect(mockOnConfirm).toHaveBeenCalledWith(mockConfirmResponse);
    });

    test('disables button during confirmation request', async () => {
      const user = userEvent.setup();
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      // Mock a delayed response
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => mockConfirmResponse
          }), 100)
        )
      );

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      expect(confirmButton).toBeDisabled();

      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });

    test('handles confirmation without userId', async () => {
      const user = userEvent.setup();
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfirmResponse
      });

      render(
        <Timer
          userId={null}
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: undefined,
            clientTs: mockNow
          })
        });
      });
    });
  });

  describe('Timer state updates', () => {
    test('updates timer display as time progresses', async () => {
      jest.useFakeTimers();
      
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      let mockNow = new Date('2023-01-01T12:25:00.000Z').getTime(); // 25 minutes after
      Date.now = jest.fn(() => mockNow);

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Next confirmation in: 05:00')).toBeInTheDocument();

      // Advance time by 2 minutes
      mockNow = new Date('2023-01-01T12:27:00.000Z').getTime();
      
      act(() => {
        jest.advanceTimersByTime(400); // Timer updates every 400ms
      });

      expect(screen.getByText('Next confirmation in: 03:00')).toBeInTheDocument();

      jest.useRealTimers();
    });

    test('transitions from countdown to confirmation window', async () => {
      jest.useFakeTimers();
      
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      let mockNow = new Date('2023-01-01T12:29:59.000Z').getTime(); // 1 second before window
      Date.now = jest.fn(() => mockNow);

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Next confirmation in: 00:01')).toBeInTheDocument();
      expect(screen.queryByText('Confirmation window open — 60s')).not.toBeInTheDocument();

      // Advance time to enter window
      mockNow = new Date('2023-01-01T12:30:00.000Z').getTime();
      
      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(screen.getByText('Next confirmation in: 00:00')).toBeInTheDocument();
      expect(screen.getByText('Confirmation window open — 60s')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Error handling during confirmation', () => {
    test('shows alert for API error response', async () => {
      const user = userEvent.setup();
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      // Mock window.alert
      window.alert = jest.fn();

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Too early' })
      });

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Too early');
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    test('shows generic alert for network error', async () => {
      const user = userEvent.setup();
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      window.alert = jest.fn();

      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <Timer
          userId="test-user"
          lastConfirm={lastConfirm}
          createdAt="2023-01-01T11:00:00.000Z"
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Confirm failed');
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });
});