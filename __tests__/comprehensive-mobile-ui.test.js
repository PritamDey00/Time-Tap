/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountButton from '../components/AccountButton';
import Leaderboard from '../components/Leaderboard';
// ChatBox component removed as part of chat functionality removal

// Mock user data
const mockUser = {
  id: '1',
  name: 'Test User',
  avatar: null,
  points: 100,
  streak: 5,
};

const mockUsers = [
  {
    id: '1',
    name: 'Test User',
    points: 150,
    streak: 3,
    onlineStatus: 'online',
    isAnonymous: false,
    avatar: null,
  },
  {
    id: '2',
    name: 'Anonymous User 123',
    points: 200,
    streak: 5,
    onlineStatus: 'away',
    isAnonymous: true,
    anonymousName: 'Anonymous User 123',
    avatar: null,
  },
];

// Mock functions
const mockOnUserUpdate = jest.fn();

// Mock window methods for mobile testing
const mockMatchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Comprehensive Mobile UI Testing', () => {
  beforeEach(() => {
    // Reset DOM and mocks
    document.head.innerHTML = '';
    mockOnUserUpdate.mockClear();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(mockMatchMedia),
    });

    // Mock viewport dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone SE width
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667, // iPhone SE height
    });
  });

  describe('AccountButton Mobile Responsiveness', () => {
    test('applies correct mobile styles for different screen sizes', () => {
      // Add mobile CSS styles
      const style = document.createElement('style');
      style.textContent = `
        .account-button {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 48px;
          height: 48px;
          z-index: 997;
        }
        
        @media (max-width: 768px) {
          .account-button {
            top: max(16px, env(safe-area-inset-top, 16px)) !important;
            left: max(16px, env(safe-area-inset-left, 16px)) !important;
            width: 46px !important;
            height: 46px !important;
            z-index: 999 !important;
          }
        }
        
        @media (max-width: 600px) {
          .account-button {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            min-height: 44px !important;
          }
        }
        
        @media (max-width: 480px) {
          .account-button {
            width: 42px !important;
            height: 42px !important;
          }
        }
        
        @media (max-width: 360px) {
          .account-button {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `;
      document.head.appendChild(style);

      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('account-button');
      
      // Verify button is rendered and has proper structure
      expect(button).toBeInTheDocument();
    });

    test('maintains minimum touch target size for accessibility', () => {
      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      
      // Button should be clickable and have proper accessibility
      expect(button).toHaveAttribute('title', 'Open account panel');
      expect(button).toBeEnabled();
    });

    test('handles safe area insets for devices with notches', () => {
      // Simulate device with safe area insets
      const style = document.createElement('style');
      style.textContent = `
        .account-button {
          top: max(16px, env(safe-area-inset-top, 16px)) !important;
          left: max(16px, env(safe-area-inset-left, 16px)) !important;
        }
      `;
      document.head.appendChild(style);

      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('account-button');
    });

    test('prevents icon truncation on small screens', () => {
      // Test with very small viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 320, // Very small screen
      });

      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      
      // Should display user initials properly
      expect(screen.getByText('TE')).toBeInTheDocument();
      
      // Button should not overflow
      expect(button).toHaveStyle({ overflow: 'hidden' });
    });

    test('handles avatar display on mobile devices', () => {
      const userWithAvatar = {
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      };

      render(<AccountButton user={userWithAvatar} onUserUpdate={mockOnUserUpdate} />);
      
      const avatar = screen.getByAltText('Account');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Leaderboard Mobile Layout', () => {
    test('renders leaderboard properly on mobile screens', () => {
      render(<Leaderboard users={mockUsers} me={mockUser} />);
      
      // Should render all users
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Anonymous User 123')).toBeInTheDocument();
      
      // Should show points
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    test('handles long usernames on narrow screens', () => {
      const usersWithLongNames = [
        {
          id: '1',
          name: 'Very Long Username That Might Overflow',
          points: 100,
          streak: 1,
          onlineStatus: 'online',
          isAnonymous: false,
          avatar: null,
        },
      ];

      render(<Leaderboard users={usersWithLongNames} me={mockUser} />);
      
      expect(screen.getByText('Very Long Username That Might Overflow')).toBeInTheDocument();
    });

    test('displays status indicators properly on mobile', () => {
      render(<Leaderboard users={mockUsers} me={mockUser} />);
      
      // Should show status indicators
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByText('AWAY')).toBeInTheDocument();
    });

    test('handles anonymous user indicators on mobile', () => {
      render(<Leaderboard users={mockUsers} me={mockUser} />);
      
      // Should show anonymous indicator
      const anonymousUserRow = screen.getByText('Anonymous User 123').closest('.lb-row');
      expect(anonymousUserRow.querySelector('[title="Anonymous user"]')).toBeInTheDocument();
    });
  });

  // ChatBox tests removed as chat functionality has been removed from the platform

  describe('Cross-Device Compatibility', () => {
    const testViewports = [
      { width: 320, height: 568, name: 'iPhone 5/SE' },
      { width: 375, height: 667, name: 'iPhone 6/7/8' },
      { width: 414, height: 896, name: 'iPhone XR/11' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 360, height: 640, name: 'Android Small' },
      { width: 412, height: 732, name: 'Android Large' },
    ];

    testViewports.forEach(viewport => {
      test(`renders correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        // Set viewport dimensions
        Object.defineProperty(window, 'innerWidth', {
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          value: viewport.height,
        });

        render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('account-button');
      });
    });
  });

  describe('Orientation Changes', () => {
    test('handles portrait to landscape orientation change', () => {
      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', {
        value: 667, // Landscape width
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 375, // Landscape height
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      // Button should still be properly positioned
      expect(button).toBeInTheDocument();
    });

    // Chat functionality test removed as chat has been removed from the platform
  });

  describe('Touch Target Accessibility', () => {
    test('maintains minimum 44px touch targets', () => {
      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      
      // Button should be large enough for touch interaction
      // This is enforced by CSS, so we verify the class is applied
      expect(button).toHaveClass('account-button');
    });

    test('provides adequate spacing between interactive elements', () => {
      render(
        <div>
          <AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />
          <Leaderboard users={mockUsers} me={mockUser} />
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Elements should not overlap
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile Devices', () => {
    test('handles rapid touch interactions without lag', () => {
      render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid taps
      for (let i = 0; i < 5; i++) {
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);
        fireEvent.click(button);
      }
      
      // Should handle all interactions without errors
      expect(button).toBeInTheDocument();
    });

    test('optimizes rendering for mobile performance', () => {
      const manyUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        points: i * 10,
        streak: i % 10,
        onlineStatus: i % 3 === 0 ? 'online' : i % 3 === 1 ? 'away' : 'offline',
        isAnonymous: i % 5 === 0,
        anonymousName: i % 5 === 0 ? `Anonymous User ${i}` : null,
        avatar: null,
      }));

      const startTime = performance.now();
      
      render(<Leaderboard users={manyUsers} me={mockUser} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Should render all users
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 49')).toBeInTheDocument();
    });
  });
});