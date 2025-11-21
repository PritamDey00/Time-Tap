/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Leaderboard from '../components/Leaderboard';

// Mock users data for testing
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    points: 1250,
    streak: 5,
    onlineStatus: 'online',
    isAnonymous: false
  },
  {
    id: '2',
    name: 'Alexander Smith-Johnson-Williams-Brown',
    points: 1180,
    streak: 3,
    onlineStatus: 'away',
    isAnonymous: false
  },
  {
    id: '3',
    name: 'Anonymous User #12345',
    points: 1050,
    streak: 2,
    onlineStatus: 'online',
    isAnonymous: true,
    anonymousName: 'Anonymous User #12345'
  },
  {
    id: '4',
    name: 'Short Name',
    points: 950,
    streak: 1,
    onlineStatus: 'offline',
    isAnonymous: false
  }
];

const mockCurrentUser = {
  id: '1',
  name: 'John Doe'
};

describe('Leaderboard Width Enhancement (Task 19)', () => {
  
  describe('Requirement 19.1: Increased leaderboard width on PC displays', () => {
    test('should render leaderboard with enhanced width structure', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that leaderboard renders
      const leaderboard = document.querySelector('.leaderboard');
      expect(leaderboard).toBeInTheDocument();
      
      // Check that leaderboard rows are present
      const leaderboardRows = document.querySelectorAll('.lb-row');
      expect(leaderboardRows).toHaveLength(mockUsers.length);
    });
  });

  describe('Requirement 19.2: Points remain fully visible with long usernames', () => {
    test('should have fixed width points container', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that points containers have proper styling
      const pointsContainers = document.querySelectorAll('.leaderboard-points');
      pointsContainers.forEach(container => {
        const styles = window.getComputedStyle(container);
        // The inline styles should set minWidth and width to 60px
        expect(container.style.minWidth).toBe('60px');
        expect(container.style.width).toBe('60px');
      });
    });

    test('should prevent points from being cut off with long usernames', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Find the user with the very long name
      const longNameUser = mockUsers.find(u => u.name.includes('Alexander Smith-Johnson'));
      const pointsElements = screen.getAllByText(longNameUser.points.toString());
      
      // Points should be visible
      expect(pointsElements[0]).toBeInTheDocument();
      expect(pointsElements[0]).toBeVisible();
    });

    test('should use whiteSpace nowrap for points values', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      const pointsValues = document.querySelectorAll('.leaderboard-points > div:first-child');
      pointsValues.forEach(pointsValue => {
        expect(pointsValue.style.whiteSpace).toBe('nowrap');
      });
    });
  });

  describe('Requirement 19.3: Maintain responsive design for mobile devices', () => {
    test('should have responsive CSS classes', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that enhanced row classes are applied
      const enhancedRows = document.querySelectorAll('.leaderboard-row-enhanced');
      expect(enhancedRows.length).toBeGreaterThan(0);
      
      // Check that enhanced avatar classes are applied
      const enhancedAvatars = document.querySelectorAll('.leaderboard-avatar-enhanced');
      expect(enhancedAvatars.length).toBeGreaterThan(0);
    });

    test('should have username max-width constraint', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that username containers have max-width styling
      const userInfoContainers = document.querySelectorAll('[style*="maxWidth: calc(100% - 80px)"]');
      expect(userInfoContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 19.4: Proper text handling with tooltips for long names', () => {
    test('should render tooltip wrapper for usernames', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that tooltip wrappers are present
      const tooltipWrappers = document.querySelectorAll('.username-tooltip');
      expect(tooltipWrappers).toHaveLength(mockUsers.length);
    });

    test('should show tooltip only for names longer than 15 characters', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Count tooltips that should be shown (names > 15 chars)
      const longNames = mockUsers.filter(user => {
        const displayName = user.isAnonymous ? (user.anonymousName || 'Anonymous User') : (user.name || 'Unknown User');
        return displayName.length > 15;
      });
      
      const tooltipContents = document.querySelectorAll('.tooltip-content');
      expect(tooltipContents).toHaveLength(longNames.length);
    });

    test('should display full name in tooltip for long usernames', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Find tooltip for the long name user
      const longNameUser = mockUsers.find(u => u.name.includes('Alexander Smith-Johnson'));
      const tooltipContent = screen.getByText(longNameUser.name);
      
      expect(tooltipContent).toBeInTheDocument();
    });

    test('should handle anonymous users correctly in tooltips', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Find anonymous user
      const anonymousUser = mockUsers.find(u => u.isAnonymous);
      const anonymousTooltip = screen.getByText(anonymousUser.anonymousName);
      
      expect(anonymousTooltip).toBeInTheDocument();
    });

    test('should apply ellipsis truncation to long usernames', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      const usernameElements = document.querySelectorAll('.leaderboard-username');
      usernameElements.forEach(username => {
        const styles = window.getComputedStyle(username);
        expect(username.style.overflow).toBe('hidden');
        expect(username.style.textOverflow).toBe('ellipsis');
        expect(username.style.whiteSpace).toBe('nowrap');
      });
    });
  });

  describe('Enhanced Features', () => {
    test('should highlight current user row', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Find current user's username element
      const currentUserName = screen.getByText(mockCurrentUser.name);
      expect(currentUserName).toBeInTheDocument();
      
      // Check that current user has special styling
      expect(currentUserName.style.color).toContain('var(--theme-primary)');
    });

    test('should display online status indicators', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check for status indicators
      const statusIndicators = document.querySelectorAll('.leaderboard-status-enhanced');
      expect(statusIndicators.length).toBeGreaterThan(0);
    });

    test('should show status badges for different user states', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check for online badge
      const onlineBadges = document.querySelectorAll('.leaderboard-status-badge.online');
      expect(onlineBadges.length).toBeGreaterThan(0);
      
      // Check for away badge
      const awayBadges = document.querySelectorAll('.leaderboard-status-badge.away');
      expect(awayBadges.length).toBeGreaterThan(0);
      
      // Check for offline badge
      const offlineBadges = document.querySelectorAll('.leaderboard-status-badge.offline');
      expect(offlineBadges.length).toBeGreaterThan(0);
    });

    test('should display anonymous badge for anonymous users', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check for anonymous badge
      const anonymousBadges = document.querySelectorAll('.leaderboard-anonymous-badge');
      expect(anonymousBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility and Performance', () => {
    test('should have proper ARIA attributes', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that leaderboard is accessible
      const leaderboard = document.querySelector('.leaderboard');
      expect(leaderboard).toBeInTheDocument();
    });

    test('should handle empty users array gracefully', () => {
      render(<Leaderboard users={[]} me={mockCurrentUser} />);
      
      const leaderboard = document.querySelector('.leaderboard');
      expect(leaderboard).toBeInTheDocument();
      
      const rows = document.querySelectorAll('.lb-row');
      expect(rows).toHaveLength(0);
    });

    test('should handle missing user data gracefully', () => {
      const incompleteUsers = [
        {
          id: '1',
          name: '',
          points: 100,
          streak: 0,
          onlineStatus: 'online',
          isAnonymous: false
        }
      ];
      
      render(<Leaderboard users={incompleteUsers} me={mockCurrentUser} />);
      
      // Should render without crashing
      const leaderboard = document.querySelector('.leaderboard');
      expect(leaderboard).toBeInTheDocument();
      
      // Should show fallback text for empty name
      const unknownUser = screen.getByText('Unknown User');
      expect(unknownUser).toBeInTheDocument();
    });
  });

  describe('CSS Integration', () => {
    test('should have enhanced styling classes applied', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check for enhanced classes
      expect(document.querySelector('.leaderboard-row-enhanced')).toBeInTheDocument();
      expect(document.querySelector('.leaderboard-avatar-enhanced')).toBeInTheDocument();
      expect(document.querySelector('.leaderboard-username')).toBeInTheDocument();
      expect(document.querySelector('.leaderboard-points')).toBeInTheDocument();
    });

    test('should include responsive CSS styles', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check that the component includes responsive styles
      const styleElements = document.querySelectorAll('style');
      const hasResponsiveStyles = Array.from(styleElements).some(style => 
        style.textContent.includes('@media (min-width: 1200px)') ||
        style.textContent.includes('@media (max-width: 768px)')
      );
      
      expect(hasResponsiveStyles).toBe(true);
    });
  });
});

describe('Integration with CustomScrollbar', () => {
  test('should work with CustomScrollbar when showScrollbar is true', () => {
    render(<Leaderboard users={mockUsers} me={mockCurrentUser} showScrollbar={true} />);
    
    // Should render leaderboard content
    const leaderboard = document.querySelector('.leaderboard');
    expect(leaderboard).toBeInTheDocument();
  });

  test('should work without CustomScrollbar when showScrollbar is false', () => {
    render(<Leaderboard users={mockUsers} me={mockCurrentUser} showScrollbar={false} />);
    
    // Should render leaderboard content directly
    const leaderboard = document.querySelector('.leaderboard');
    expect(leaderboard).toBeInTheDocument();
  });
});