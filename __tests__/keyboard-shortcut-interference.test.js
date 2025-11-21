/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import ClassroomPage from '../pages/classroom/[id]';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock components
jest.mock('../components/ClassroomDashboard', () => {
  return function MockClassroomDashboard() {
    return (
      <div data-testid="classroom-dashboard">
        <div className="todo-form">
          <input 
            className="todo-input" 
            placeholder="Add a new todo..."
            data-testid="todo-input"
          />
        </div>
      </div>
    );
  };
});

jest.mock('../components/ClassroomSettings', () => {
  return function MockClassroomSettings({ onClose }) {
    return (
      <div data-testid="classroom-settings">
        <button onClick={onClose}>Close Settings</button>
      </div>
    );
  };
});

jest.mock('../components/AccountButton', () => {
  return function MockAccountButton() {
    return <div data-testid="account-button">Account</div>;
  };
});

describe('Keyboard Shortcut Interference Fix', () => {
  const mockPush = jest.fn();
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    isAnonymous: false
  };
  const mockClassroom = {
    id: 'classroom1',
    name: 'Test Classroom',
    createdBy: 'user1',
    isUniversal: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      query: { id: 'classroom1' },
      push: mockPush,
    });

    // Mock successful API responses
    fetch.mockImplementation((url) => {
      if (url === '/api/me') {
        return Promise.resolve({
          json: () => Promise.resolve({ user: mockUser }),
        });
      }
      if (url === '/api/classrooms/classroom1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ classroom: mockClassroom }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  test('should prevent settings from opening when S is pressed in form input', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Create and focus a form input element
    const formInput = document.createElement('input');
    formInput.className = 'form-input';
    formInput.setAttribute('data-testid', 'form-input');
    document.body.appendChild(formInput);
    formInput.focus();

    // Press 'S' key while focused on form input
    fireEvent.keyDown(document, { key: 'S', target: formInput });

    // Settings should not open
    expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();

    // Cleanup
    document.body.removeChild(formInput);
  });

  test('should prevent settings from opening when S is pressed in todo input', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Focus on todo input
    const todoInput = screen.getByTestId('todo-input');
    fireEvent.focus(todoInput);

    // Press 'S' key while focused on todo input
    fireEvent.keyDown(document, { key: 'S', target: todoInput });

    // Settings should not open
    expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();
  });

  test('should allow settings to open when S is pressed outside input contexts', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Press 'S' key on document (not in input)
    fireEvent.keyDown(document, { key: 'S' });

    // Settings should open
    await waitFor(() => {
      expect(screen.getByTestId('classroom-settings')).toBeInTheDocument();
    });
  });

  test('should prevent settings from opening when activeElement is an input', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Create and focus a dynamic input element
    const dynamicInput = document.createElement('input');
    dynamicInput.className = 'form-input';
    document.body.appendChild(dynamicInput);
    dynamicInput.focus();

    // Press 'S' key while dynamic input has focus
    fireEvent.keyDown(document, { key: 'S' });

    // Settings should not open
    expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();

    // Cleanup
    document.body.removeChild(dynamicInput);
  });

  test('should allow Escape key to close settings even when typing', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Open settings first
    fireEvent.keyDown(document, { key: 'S' });
    
    await waitFor(() => {
      expect(screen.getByTestId('classroom-settings')).toBeInTheDocument();
    });

    // Focus on todo input
    const todoInput = screen.getByTestId('todo-input');
    fireEvent.focus(todoInput);

    // Press Escape while in input - should still close settings
    fireEvent.keyDown(document, { key: 'Escape', target: todoInput });

    // Settings should close
    await waitFor(() => {
      expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();
    });
  });

  test('should handle contentEditable elements properly', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Create a contentEditable element
    const editableDiv = document.createElement('div');
    editableDiv.contentEditable = 'true';
    document.body.appendChild(editableDiv);
    editableDiv.focus();

    // Press 'S' key while contentEditable has focus
    fireEvent.keyDown(document, { key: 'S', target: editableDiv });

    // Settings should not open
    expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();

    // Cleanup
    document.body.removeChild(editableDiv);
  });

  test('should handle elements inside form contexts', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Create an element inside a form
    const form = document.createElement('form');
    const button = document.createElement('button');
    form.appendChild(button);
    document.body.appendChild(form);
    button.focus();

    // Press 'S' key while element inside form has focus
    fireEvent.keyDown(document, { key: 'S', target: button });

    // Settings should not open
    expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();

    // Cleanup
    document.body.removeChild(form);
  });

  test('should work with both lowercase and uppercase S', async () => {
    render(<ClassroomPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('classroom-dashboard')).toBeInTheDocument();
    });

    // Test lowercase 's'
    fireEvent.keyDown(document, { key: 's' });
    
    await waitFor(() => {
      expect(screen.getByTestId('classroom-settings')).toBeInTheDocument();
    });

    // Close settings
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByTestId('classroom-settings')).not.toBeInTheDocument();
    });

    // Test uppercase 'S'
    fireEvent.keyDown(document, { key: 'S' });
    
    await waitFor(() => {
      expect(screen.getByTestId('classroom-settings')).toBeInTheDocument();
    });
  });
});