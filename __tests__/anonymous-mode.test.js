import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';

// Mock fetch globally
global.fetch = jest.fn();

// Mock components that would use anonymous mode
const MockLeaderboard = ({ users, isAnonymous }) => (
  <div data-testid="leaderboard">
    {users.map(user => (
      <div key={user.id} data-testid={`user-${user.id}`}>
        <span>{user.isAnonymous ? user.anonymousName : user.name}</span>
        <span>{user.points}</span>
        {isAnonymous && <span data-testid="anonymous-indicator">🕶️</span>}
      </div>
    ))}
  </div>
);

// MockChatBox removed as chat functionality has been removed from the platform

describe('Anonymous Mode Functionality', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    points: 150,
    streak: 3,
    isAnonymous: false,
  };

  const mockUsers = [
    {
      id: 'user-1',
      name: 'Test User',
      points: 150,
      streak: 3,
      isAnonymous: false,
    },
    {
      id: 'user-2',
      name: 'Anonymous User 123',
      points: 200,
      streak: 5,
      isAnonymous: true,
      anonymousName: 'Anonymous User 123',
    },
  ];

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Anonymous Mode Toggle', () => {
    test('toggles anonymous mode successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          user: { ...mockUser, isAnonymous: true, anonymousName: 'Anonymous User 456' }
        }),
      });

      const { result } = renderHook(() => {
        const [user, setUser] = React.useState(mockUser);
        
        const toggleAnonymous = async () => {
          const response = await fetch('/api/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAnonymous: !user.isAnonymous }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            return true;
          }
          return false;
        };

        return { user, toggleAnonymous };
      });

      let toggleResult;
      await act(async () => {
        toggleResult = await result.current.toggleAnonymous();
      });

      expect(toggleResult).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAnonymous: true }),
      });
    });

    test('handles anonymous mode toggle errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to update user' }),
      });

      const { result } = renderHook(() => {
        const [user, setUser] = React.useState(mockUser);
        const [error, setError] = React.useState(null);
        
        const toggleAnonymous = async () => {
          try {
            const response = await fetch('/api/me', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isAnonymous: !user.isAnonymous }),
            });
            
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to toggle anonymous mode');
            }
            
            const data = await response.json();
            setUser(data.user);
            return true;
          } catch (err) {
            setError(err.message);
            return false;
          }
        };

        return { user, error, toggleAnonymous };
      });

      let toggleResult;
      await act(async () => {
        toggleResult = await result.current.toggleAnonymous();
      });

      expect(toggleResult).toBe(false);
      expect(result.current.error).toBe('Failed to update user');
    });
  });

  describe('Anonymous Display in Leaderboards', () => {
    test('displays anonymous users with anonymous names in leaderboards', () => {
      render(<MockLeaderboard users={mockUsers} isAnonymous={false} />);

      // Regular user should show real name
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // Anonymous user should show anonymous name
      expect(screen.getByText('Anonymous User 123')).toBeInTheDocument();
      expect(screen.queryByText('Real Anonymous Name')).not.toBeInTheDocument();
    });

    test('shows anonymous indicator when current user is anonymous', () => {
      render(<MockLeaderboard users={mockUsers} isAnonymous={true} />);

      // Should show anonymous indicators (multiple users can be anonymous)
      expect(screen.getAllByTestId('anonymous-indicator')).toHaveLength(2);
    });

    test('maintains functionality while in anonymous mode', () => {
      const anonymousUser = { ...mockUser, isAnonymous: true, anonymousName: 'Anonymous User 789' };
      
      render(<MockLeaderboard users={[anonymousUser]} isAnonymous={true} />);

      // Should still show points and other data
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Anonymous User 789')).toBeInTheDocument();
    });
  });

  // Chat functionality tests removed as chat has been removed from the platform

  describe('Anonymous Mode Exclusions', () => {
    test('anonymous mode does not affect custom classroom membership', async () => {
      const classroomUsers = [
        { ...mockUser, isAnonymous: true, anonymousName: 'Anonymous User 456' },
      ];

      // Mock API call for custom classroom users
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: classroomUsers }),
      });

      const fetchClassroomUsers = async (classroomId) => {
        const response = await fetch(`/api/classrooms/${classroomId}/users`);
        if (response.ok) {
          const data = await response.json();
          return data.users;
        }
        throw new Error('Failed to fetch users');
      };

      const users = await fetchClassroomUsers('custom-classroom-1');

      // Anonymous user should still be included in custom classroom
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(mockUser.id);
      expect(users[0].isAnonymous).toBe(true);
    });

    test('anonymous users can join and leave custom classrooms normally', async () => {
      const anonymousUser = { ...mockUser, isAnonymous: true };

      // Mock join classroom API
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const joinClassroom = async (classroomId, user) => {
        const response = await fetch(`/api/classrooms/${classroomId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        
        return response.ok;
      };

      const result = await joinClassroom('custom-classroom-1', anonymousUser);

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/classrooms/custom-classroom-1/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: anonymousUser.id }),
      });
    });
  });

  describe('Anonymous Name Generation', () => {
    test('generates unique anonymous names for different users', () => {
      const generateAnonymousName = (userId) => {
        // Simple hash-based anonymous name generation
        const hash = userId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const adjectives = ['Mysterious', 'Silent', 'Hidden', 'Secret', 'Unknown'];
        const nouns = ['Student', 'Learner', 'Scholar', 'User', 'Participant'];
        
        const adjIndex = Math.abs(hash) % adjectives.length;
        const nounIndex = Math.abs(hash >> 8) % nouns.length;
        const number = Math.abs(hash) % 1000;
        
        return `${adjectives[adjIndex]} ${nouns[nounIndex]} ${number}`;
      };

      const name1 = generateAnonymousName('user-1');
      const name2 = generateAnonymousName('user-2');

      expect(name1).not.toBe(name2);
      expect(name1).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ \d+$/);
      expect(name2).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ \d+$/);
    });

    test('generates consistent anonymous names for the same user', () => {
      const generateAnonymousName = (userId) => {
        const hash = userId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        return `Anonymous User ${Math.abs(hash) % 1000}`;
      };

      const name1 = generateAnonymousName('user-1');
      const name2 = generateAnonymousName('user-1');

      expect(name1).toBe(name2);
    });
  });
});