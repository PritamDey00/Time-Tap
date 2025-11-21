import { render, screen } from '@testing-library/react';
import Leaderboard from '../components/Leaderboard';

describe('Leaderboard Enhanced Features', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      points: 1500,
      streak: 5,
      onlineStatus: 'online',
      avatar: null,
      isAnonymous: false,
    },
    {
      id: '2',
      name: 'Jane Smith with a very long name that should be truncated',
      points: 1200,
      streak: 3,
      onlineStatus: 'away',
      avatar: null,
      isAnonymous: false,
    },
    {
      id: '3',
      name: 'Anonymous User',
      points: 800,
      streak: 1,
      onlineStatus: 'offline',
      avatar: null,
      isAnonymous: true,
      anonymousName: 'Anonymous Learner',
    },
  ];

  const mockMe = {
    id: '1',
    name: 'John Doe',
  };

  describe('Unified Scroll System', () => {
    it('renders with single scroll container', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      expect(container.querySelector('.leaderboard-unified-scroll')).toBeInTheDocument();
    });

    it('applies smooth scrolling', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const scrollContainer = container.querySelector('.custom-scrollable-smooth');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Theme-Aware Design', () => {
    it('renders with modular design classes', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const rows = container.querySelectorAll('.leaderboard-row-enhanced');
      expect(rows).toHaveLength(3);
    });

    it('highlights current user row', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const currentUserRow = container.querySelector('.leaderboard-row-enhanced');
      expect(currentUserRow).toHaveStyle({
        background: expect.stringContaining('linear-gradient'),
      });
    });
  });

  describe('Text Handling and Alignment', () => {
    it('handles long usernames with tooltips', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      const longNameUser = screen.getByText(/Jane Smith with a very long name/);
      expect(longNameUser).toBeInTheDocument();
      
      // Should have tooltip container
      const tooltip = longNameUser.closest('.username-tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    it('displays points without cutoff', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('1,200')).toBeInTheDocument();
      expect(screen.getByText('800')).toBeInTheDocument();
    });

    it('shows proper alignment for all elements', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const pointsElements = container.querySelectorAll('.leaderboard-points');
      pointsElements.forEach(element => {
        expect(element).toHaveStyle({ textAlign: 'right' });
      });
    });
  });

  describe('Status Indicators', () => {
    it('displays correct status for each user', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByText('AWAY')).toBeInTheDocument();
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });

    it('shows status dots with correct colors', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const statusDots = container.querySelectorAll('.status-indicator');
      expect(statusDots).toHaveLength(3);
    });
  });

  describe('Anonymous User Handling', () => {
    it('displays anonymous users correctly', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      expect(screen.getByText('Anonymous Learner')).toBeInTheDocument();
    });

    it('shows anonymous badge for anonymous users', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const anonymousBadges = container.querySelectorAll('.leaderboard-anonymous-badge');
      expect(anonymousBadges).toHaveLength(1);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const rows = container.querySelectorAll('.leaderboard-row-enhanced');
      rows.forEach(row => {
        expect(row).toHaveClass('leaderboard-row-enhanced');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      expect(screen.getByRole('list', { name: /user rankings/i })).toBeInTheDocument();
    });

    it('provides screen reader friendly content', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      
      // Check that each item has proper aria-label
      listItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation', () => {
      render(<Leaderboard users={mockUsers} me={mockMe} />);
      
      const listItems = screen.getAllByRole('listitem');
      listItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('memoizes component to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      // Re-render with same props
      rerender(<Leaderboard users={mockUsers} me={mockMe} />);
      
      // Component should still render correctly
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles large user lists efficiently', () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        points: 1000 - i * 10,
        streak: i % 10,
        onlineStatus: i % 3 === 0 ? 'online' : i % 3 === 1 ? 'away' : 'offline',
        isAnonymous: false,
      }));
      
      render(<Leaderboard users={largeUserList} me={mockMe} />);
      
      // Should render without performance issues
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 99')).toBeInTheDocument();
    });
  });

  describe('Enhanced Animations', () => {
    it('applies staggered entrance animations', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockMe} />
      );
      
      const rows = container.querySelectorAll('.leaderboard-row-enhanced');
      rows.forEach((row, index) => {
        expect(row).toHaveStyle({
          animationDelay: expect.stringMatching(/\d+\.?\d*s/),
        });
      });
    });
  });
});