import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import ClassroomDashboard from '../components/ClassroomDashboard';
import ClassroomSettings from '../components/ClassroomSettings';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.Notification
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: jest.fn(() => Promise.resolve('granted')),
  },
  writable: true,
});

describe('Classroom Components', () => {
  const mockRouter = {
    push: jest.fn(),
    query: { id: 'test-classroom-id' },
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    points: 100,
    streak: 5,
    timezone: 'America/New_York',
  };

  const mockClassroom = {
    id: 'test-classroom-id',
    name: 'Test Classroom',
    description: 'A test classroom',
    avatar: '🏫',
    members: ['user-1', 'user-2'],
    createdBy: 'user-1',
    isUniversal: false,
  };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    fetch.mockClear();
    mockRouter.push.mockClear();
  });

  describe('ClassroomDashboard', () => {
    beforeEach(() => {
      // Mock successful API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ classroom: mockClassroom }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [mockUser] }),
        });
    });

    test('renders loading state initially', () => {
      render(
        <ClassroomDashboard
          classroomId="test-classroom-id"
          user={mockUser}
          isAnonymous={false}
        />
      );

      expect(screen.getByText('Loading classroom...')).toBeInTheDocument();
    });

    test('renders classroom dashboard after loading', async () => {
      render(
        <ClassroomDashboard
          classroomId="test-classroom-id"
          user={mockUser}
          isAnonymous={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading classroom...')).not.toBeInTheDocument();
      });

      // Should show classroom name in header
      expect(screen.getByText('Test Classroom')).toBeInTheDocument();
      
      // Should show user info
      expect(screen.getByText(/Signed in as.*Test User/)).toBeInTheDocument();
      expect(screen.getByText(/Points:.*100/)).toBeInTheDocument();
      expect(screen.getByText(/Streak:.*5/)).toBeInTheDocument();
    });

    test('shows anonymous badge when in anonymous mode', async () => {
      render(
        <ClassroomDashboard
          classroomId="test-classroom-id"
          user={mockUser}
          isAnonymous={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading classroom...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Anonymous Mode')).toBeInTheDocument();
    });

    test('navigates to classrooms page when classroom not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Classroom not found' }),
      });

      render(
        <ClassroomDashboard
          classroomId="invalid-id"
          user={mockUser}
          isAnonymous={false}
        />
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/classrooms');
      });
    });
  });

  describe('ClassroomSettings', () => {
    const mockOnSave = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
      mockOnSave.mockClear();
      mockOnClose.mockClear();
    });

    test('renders settings form for classroom creator', () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Classroom Settings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Classroom')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test classroom')).toBeInTheDocument();
    });

    test('shows access denied for non-creator', () => {
      const nonCreatorUser = { ...mockUser, id: 'different-user' };
      
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={nonCreatorUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You don't have permission/)).toBeInTheDocument();
    });

    test('closes modal when close button is clicked', () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /✕/ });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('validates required fields', async () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // Clear the name field
      const nameInput = screen.getByDisplayValue('Test Classroom');
      fireEvent.change(nameInput, { target: { value: '' } });

      // Try to submit
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Classroom name is required')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('validates password confirmation', async () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // Enable password protection
      const passwordToggle = screen.getByLabelText(/Add password protection/);
      fireEvent.click(passwordToggle);

      // Enter mismatched passwords
      const passwordInput = screen.getByPlaceholderText(/New password/);
      const confirmInput = screen.getByPlaceholderText(/Confirm new password/);
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different' } });

      // Try to submit
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('submits form with valid data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          classroom: { ...mockClassroom, name: 'Updated Classroom' }
        }),
      });

      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // Update the name
      const nameInput = screen.getByDisplayValue('Test Classroom');
      fireEvent.change(nameInput, { target: { value: 'Updated Classroom' } });

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`/api/classrooms/${mockClassroom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Updated Classroom',
            description: 'A test classroom',
            avatar: '🏫',
          }),
        });
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          ...mockClassroom,
          name: 'Updated Classroom',
        });
      });
    });

    test('selects emoji avatar', () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // Click on a different emoji
      const emojiButton = screen.getByRole('button', { name: '📚' });
      fireEvent.click(emojiButton);

      // Check that the avatar input was updated
      const avatarInput = screen.getByDisplayValue('📚');
      expect(avatarInput).toBeInTheDocument();
    });
  });
});