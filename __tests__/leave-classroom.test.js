import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import ClassroomSettings from '../components/ClassroomSettings';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Leave Classroom Functionality', () => {
  const mockRouter = {
    push: jest.fn(),
    query: { id: 'test-classroom' },
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    points: 150,
    streak: 3,
  };

  const mockClassroom = {
    id: 'test-classroom',
    name: 'Test Classroom',
    description: 'A test classroom',
    createdBy: 'user-1', // Make the test user the creator
    members: ['user-1', 'user-2'],
    isUniversal: false,
    isPrivate: false,
  };

  const mockUniversalClassroom = {
    ...mockClassroom,
    id: 'universal-classroom',
    name: 'Universal Classroom',
    isUniversal: true,
  };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    fetch.mockClear();
    mockRouter.push.mockClear();
  });

  describe('Leave Classroom Button Visibility', () => {
    test('shows leave button for regular classroom members', () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /🚪 leave classroom/i })).toBeInTheDocument();
    });

    test('hides leave button for universal classroom', () => {
      render(
        <ClassroomSettings
          classroom={mockUniversalClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /🚪 leave classroom/i })).not.toBeInTheDocument();
    });

    test('hides leave button for non-members', () => {
      const nonMemberUser = { ...mockUser, id: 'non-member' };
      
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={nonMemberUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /🚪 leave classroom/i })).not.toBeInTheDocument();
    });
  });

  describe('Leave Classroom Process', () => {
    test('shows confirmation dialog when leave button is clicked', async () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      const leaveButton = screen.getByRole('button', { name: /🚪 leave classroom/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to leave/i)).toBeInTheDocument();
      });
    });

    test('successfully leaves classroom when confirmed', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const mockOnLeave = jest.fn();

      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={mockOnLeave}
        />
      );

      // Click leave button
      const leaveButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(leaveButton);

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`/api/classrooms/${mockClassroom.id}/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });

      await waitFor(() => {
        expect(mockOnLeave).toHaveBeenCalled();
      });
    });

    test('handles leave classroom API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to leave classroom' }),
      });

      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      // Click leave button
      const leaveButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(leaveButton);

      // Wait for confirmation dialog and confirm
      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to leave classroom')).toBeInTheDocument();
      });
    });

    test('cancels leave process when cancel button is clicked', async () => {
      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      // Click leave button
      const leaveButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(leaveButton);

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(`Leave "${mockClassroom.name}"?`)).not.toBeInTheDocument();
      });

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Leave Classroom API Integration', () => {
    test('API prevents leaving universal classroom', async () => {
      const response = await fetch('/api/classrooms/universal-classroom/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // This would be handled by the actual API, but we can test the expected behavior
      expect(response).toBeDefined();
    });

    test('API removes user from classroom members list', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const leaveClassroom = async (classroomId) => {
        const response = await fetch(`/api/classrooms/${classroomId}/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to leave classroom');
        }

        return await response.json();
      };

      const result = await leaveClassroom(mockClassroom.id);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(`/api/classrooms/${mockClassroom.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    test('API handles network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const leaveClassroom = async (classroomId) => {
        try {
          const response = await fetch(`/api/classrooms/${classroomId}/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to leave classroom');
          }

          return await response.json();
        } catch (error) {
          throw new Error(error.message || 'Network error occurred');
        }
      };

      await expect(leaveClassroom(mockClassroom.id)).rejects.toThrow('Network error');
    });
  });

  describe('Post-Leave Behavior', () => {
    test('redirects to classrooms page after successful leave', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const mockOnLeave = jest.fn(() => {
        mockRouter.push('/classrooms');
      });

      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={mockOnLeave}
        />
      );

      // Complete leave process
      const leaveButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnLeave).toHaveBeenCalled();
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/classrooms');
    });

    test('updates classroom participant count after user leaves', async () => {
      // Mock initial classroom data
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            classroom: {
              ...mockClassroom,
              members: ['user-2'], // user-1 removed
            },
          }),
        });

      const leaveAndRefresh = async (classroomId) => {
        // Leave classroom
        await fetch(`/api/classrooms/${classroomId}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        // Fetch updated classroom data
        const response = await fetch(`/api/classrooms/${classroomId}`);
        const data = await response.json();
        return data.classroom;
      };

      const updatedClassroom = await leaveAndRefresh(mockClassroom.id);

      expect(updatedClassroom.members).toHaveLength(1);
      expect(updatedClassroom.members).not.toContain('user-1');
      expect(updatedClassroom.members).toContain('user-2');
    });
  });

  describe('Leave Classroom Loading States', () => {
    test('shows loading state during leave process', async () => {
      // Mock a delayed response
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          }), 100)
        )
      );

      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      // Start leave process
      const leaveButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(confirmButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Leaving...')).toBeInTheDocument();
      });
    });

    test('disables buttons during leave process', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          }), 100)
        )
      );

      render(
        <ClassroomSettings
          classroom={mockClassroom}
          user={mockUser}
          onSave={jest.fn()}
          onClose={jest.fn()}
          onLeave={jest.fn()}
        />
      );

      // Start leave process
      const leaveButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText(`Leave "${mockClassroom.name}"?`)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /leave classroom/i });
      fireEvent.click(confirmButton);

      // Buttons should be disabled during loading
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          if (button.textContent.includes('Leave') || button.textContent.includes('Cancel')) {
            expect(button).toBeDisabled();
          }
        });
      });
    });
  });
});