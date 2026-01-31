import { render, screen } from '@testing-library/react';
import CustomScrollbar from '../components/CustomScrollbar';
import Leaderboard from '../components/Leaderboard';

// Mock data for testing
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    points: 150,
    streak: 5,
    onlineStatus: 'online',
    avatar: null,
    isAnonymous: false
  },
  {
    id: '2',
    name: 'Jane Smith',
    points: 120,
    streak: 3,
    onlineStatus: 'away',
    avatar: null,
    isAnonymous: false
  },
  {
    id: '3',
    name: 'Anonymous User',
    points: 90,
    streak: 2,
    onlineStatus: 'offline',
    avatar: null,
    isAnonymous: true,
    anonymousName: 'Ghost User'
  }
];

const mockCurrentUser = {
  id: '1',
  name: 'John Doe'
};

describe('Theme-aware Scrollbar and Leaderboard', () => {
  describe('CustomScrollbar Component', () => {
    test('renders children correctly', () => {
      render(
        <CustomScrollbar>
          <div data-testid="scrollbar-content">Test Content</div>
        </CustomScrollbar>
      );
      
      expect(screen.getByTestId('scrollbar-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <CustomScrollbar className="test-class">
          <div>Content</div>
        </CustomScrollbar>
      );
      
      const scrollbarElement = container.firstChild;
      expect(scrollbarElement).toHaveClass('custom-scrollable');
      expect(scrollbarElement).toHaveClass('test-class');
    });

    test('applies maxHeight style', () => {
      const { container } = render(
        <CustomScrollbar maxHeight={300}>
          <div>Content</div>
        </CustomScrollbar>
      );
      
      const scrollbarElement = container.firstChild;
      expect(scrollbarElement).toHaveStyle('max-height: 300px');
    });

    test('applies variant classes correctly', () => {
      const { container: thinContainer } = render(
        <CustomScrollbar variant="thin">
          <div>Thin Content</div>
        </CustomScrollbar>
      );
      
      const { container: leaderboardContainer } = render(
        <CustomScrollbar variant="leaderboard">
          <div>Leaderboard Content</div>
        </CustomScrollbar>
      );
      
      expect(thinContainer.firstChild).toHaveClass('custom-scrollable-thin');
      expect(leaderboardContainer.firstChild).toHaveClass('leaderboard-container');
    });

    test('handles direction prop correctly', () => {
      const { container: horizontalContainer } = render(
        <CustomScrollbar direction="horizontal">
          <div>Horizontal Content</div>
        </CustomScrollbar>
      );
      
      const { container: bothContainer } = render(
        <CustomScrollbar direction="both">
          <div>Both Direction Content</div>
        </CustomScrollbar>
      );
      
      expect(horizontalContainer.firstChild).toHaveClass('custom-scrollable-horizontal');
      expect(horizontalContainer.firstChild).toHaveStyle('overflow-x: auto; overflow-y: hidden');
      
      expect(bothContainer.firstChild).toHaveClass('custom-scrollable-both');
      expect(bothContainer.firstChild).toHaveStyle('overflow: auto');
    });

    test('applies autoHide class when enabled', () => {
      const { container } = render(
        <CustomScrollbar autoHide={true}>
          <div>Auto-hide Content</div>
        </CustomScrollbar>
      );
      
      expect(container.firstChild).toHaveClass('custom-scrollable-autohide');
    });
  });

  describe('Enhanced Leaderboard Component', () => {
    test('renders user list correctly', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Ghost User')).toBeInTheDocument();
    });

    test('displays user points correctly', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    test('shows status badges correctly', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByText('AWAY')).toBeInTheDocument();
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });

    test('displays anonymous indicator for anonymous users', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      // Check for anonymous badge (👤 emoji)
      const anonymousBadges = screen.getAllByText('👤');
      expect(anonymousBadges.length).toBeGreaterThan(0);
    });

    test('shows streak information', () => {
      render(<Leaderboard users={mockUsers} me={mockCurrentUser} />);
      
      expect(screen.getByText('5 streak')).toBeInTheDocument();
      expect(screen.getByText('3 streak')).toBeInTheDocument();
      expect(screen.getByText('2 streak')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <Leaderboard 
          users={mockUsers} 
          me={mockCurrentUser} 
          className="test-leaderboard"
        />
      );
      
      expect(container.querySelector('.test-leaderboard')).toBeInTheDocument();
    });

    test('can disable scrollbar', () => {
      const { container } = render(
        <Leaderboard 
          users={mockUsers} 
          me={mockCurrentUser} 
          showScrollbar={false}
        />
      );
      
      // When showScrollbar is false, it should not wrap in CustomScrollbar
      expect(container.querySelector('.leaderboard-container')).not.toBeInTheDocument();
      expect(container.querySelector('.leaderboard')).toBeInTheDocument();
    });

    test('uses CustomScrollbar by default', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockCurrentUser} />
      );
      
      // Should wrap in CustomScrollbar by default
      expect(container.querySelector('.leaderboard-container')).toBeInTheDocument();
    });

    test('applies enhanced styling classes', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockCurrentUser} />
      );
      
      const leaderboardRows = container.querySelectorAll('.leaderboard-row-enhanced');
      expect(leaderboardRows.length).toBe(mockUsers.length);
      
      const avatars = container.querySelectorAll('.leaderboard-avatar-enhanced');
      expect(avatars.length).toBe(mockUsers.length);
    });

    test('handles empty user list', () => {
      const { container } = render(
        <Leaderboard users={[]} me={mockCurrentUser} />
      );
      
      const leaderboard = container.querySelector('.leaderboard');
      expect(leaderboard).toBeInTheDocument();
      expect(leaderboard.children.length).toBe(0);
    });

    test('handles missing me prop', () => {
      render(<Leaderboard users={mockUsers} />);
      
      // Should still render without errors
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('Leaderboard with CustomScrollbar integration', () => {
      const { container } = render(
        <Leaderboard 
          users={mockUsers} 
          me={mockCurrentUser}
          maxHeight="400px"
          className="integrated-test"
        />
      );
      
      const scrollbarContainer = container.querySelector('.leaderboard-container');
      expect(scrollbarContainer).toBeInTheDocument();
      expect(scrollbarContainer).toHaveClass('integrated-test');
      expect(scrollbarContainer).toHaveStyle('max-height: 400px');
      
      const leaderboard = container.querySelector('.leaderboard');
      expect(leaderboard).toBeInTheDocument();
    });

    test('Theme-aware styling classes are applied', () => {
      const { container } = render(
        <Leaderboard users={mockUsers} me={mockCurrentUser} />
      );
      
      // Check for enhanced styling classes
      expect(container.querySelector('.leaderboard-row-enhanced')).toBeInTheDocument();
      expect(container.querySelector('.leaderboard-avatar-enhanced')).toBeInTheDocument();
      expect(container.querySelector('.leaderboard-status-enhanced')).toBeInTheDocument();
    });
  });
});