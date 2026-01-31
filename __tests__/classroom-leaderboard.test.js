import { render, screen, waitFor } from '@testing-library/react';
import Leaderboard from '../components/Leaderboard';

// Mock fetch globally
global.fetch = jest.fn();

describe('Classroom Leaderboard', () => {
  const mockCurrentUser = {
    id: 'user-1',
    name: 'Current User',
    points: 150,
    streak: 3,
  };

  const mockClassroomUsers = [
    {
      id: 'user-1',
      name: 'Current User',
      points: 150,
      streak: 3,
      onlineStatus: 'online',
      isAnonymous: false,
      avatar: null,
    },
    {
      id: 'user-2',
      name: 'Anonymous User 123',
      points: 200,
      streak: 5,
      onlineStatus: 'away',
      isAnonymous: true,
      anonymousName: 'Anonymous User 123',
      avatar: null,
    },
    {
      id: 'user-3',
      name: 'Regular User',
      points: 100,
      streak: 2,
      onlineStatus: 'offline',
      isAnonymous: false,
      avatar: 'https://example.com/avatar.jpg',
    },
  ];

  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders classroom leaderboard with mixed anonymous and regular users', () => {
    render(<Leaderboard users={mockClassroomUsers} me={mockCurrentUser} />);

    // Should show all users
    expect(screen.getByText('Current User')).toBeInTheDocument();
    expect(screen.getByText('Anonymous User 123')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();

    // Should show points for all users
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('highlights current user row', () => {
    render(<Leaderboard users={mockClassroomUsers} me={mockCurrentUser} />);

    const currentUserRow = screen.getByText('Current User').closest('.lb-row');
    expect(currentUserRow).toHaveStyle({
      background: 'linear-gradient(90deg, rgb(255 255 255 / 19%), rgb(255 255 255 / 19%))',
    });
  });

  test('shows anonymous indicator for anonymous users', () => {
    render(<Leaderboard users={mockClassroomUsers} me={mockCurrentUser} />);

    // Anonymous user should have anonymous badge
    const anonymousUserRow = screen.getByText('Anonymous User 123').closest('.lb-row');
    expect(anonymousUserRow.querySelector('[title="Anonymous user"]')).toBeInTheDocument();
  });

  test('shows online status indicators', () => {
    render(<Leaderboard users={mockClassroomUsers} me={mockCurrentUser} />);

    // Should show different status indicators
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('AWAY')).toBeInTheDocument();
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });

  test('displays offline users with reduced opacity', () => {
    render(<Leaderboard users={mockClassroomUsers} me={mockCurrentUser} />);

    // Find offline user row
    const offlineUserRow = screen.getByText('Regular User').closest('.lb-row');
    expect(offlineUserRow).toHaveStyle({ opacity: '0.7' });

    // Find online user row
    const onlineUserRow = screen.getByText('Current User').closest('.lb-row');
    expect(onlineUserRow).toHaveStyle({ opacity: '1' });
  });

  test('retains offline users who have joined the classroom', () => {
    const usersWithOfflineRetention = [
      ...mockClassroomUsers,
      {
        id: 'user-4',
        name: 'Offline Retained User',
        points: 50,
        streak: 1,
        onlineStatus: 'offline',
        isAnonymous: false,
        avatar: null,
        hasJoinedClassroom: true, // This user should be retained even if offline
      },
    ];

    render(<Leaderboard users={usersWithOfflineRetention} me={mockCurrentUser} />);

    // Should show the offline retained user
    expect(screen.getByText('Offline Retained User')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  test('handles empty user list', () => {
    render(<Leaderboard users={[]} me={mockCurrentUser} />);

    // Should render without errors
    const leaderboard = document.querySelector('.leaderboard');
    expect(leaderboard).toBeInTheDocument();
    expect(leaderboard.children).toHaveLength(0);
  });

  test('handles anonymous user avatars correctly', () => {
    const anonymousUsers = [
      {
        id: 'user-1',
        name: 'Anonymous User 456',
        points: 100,
        streak: 1,
        onlineStatus: 'online',
        isAnonymous: true,
        anonymousName: 'Anonymous User 456',
        avatar: null,
      },
    ];

    render(<Leaderboard users={anonymousUsers} me={mockCurrentUser} />);

    // Anonymous user should show generic avatar icon
    const avatarDiv = screen.getByText('👤');
    expect(avatarDiv).toBeInTheDocument();
  });

  test('handles regular user avatars correctly', () => {
    const regularUsers = [
      {
        id: 'user-1',
        name: 'Test User',
        points: 100,
        streak: 1,
        onlineStatus: 'online',
        isAnonymous: false,
        avatar: 'https://example.com/avatar.jpg',
      },
    ];

    render(<Leaderboard users={regularUsers} me={mockCurrentUser} />);

    // Regular user should show avatar image
    const avatarImg = screen.getByAltText('Test User avatar');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('shows initials for users without avatars', () => {
    const usersWithoutAvatars = [
      {
        id: 'user-1',
        name: 'John Doe',
        points: 100,
        streak: 1,
        onlineStatus: 'online',
        isAnonymous: false,
        avatar: null,
      },
    ];

    render(<Leaderboard users={usersWithoutAvatars} me={mockCurrentUser} />);

    // Should show user initials
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});