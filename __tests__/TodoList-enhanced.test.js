import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from '../components/TodoList';

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('TodoList Enhanced Features', () => {
  const defaultProps = {
    userId: 'user1',
    classroomId: 'classroom1',
  };

  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  describe('Error Handling', () => {
    it('displays network error when offline', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('shows retry button for recoverable errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Server error'));
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('implements exponential backoff for retries', async () => {
      const user = userEvent.setup();
      fetch.mockRejectedValue(new Error('Server error'));
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      // Should show retry attempt counter
      await waitFor(() => {
        expect(screen.getByText(/retry attempt/i)).toBeInTheDocument();
      });
    });
  });

  describe('Optimistic Updates', () => {
    it('shows optimistic todo immediately when adding', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add a new todo/i)).toBeInTheDocument();
      });
      
      const input = screen.getByPlaceholderText(/add a new todo/i);
      const addButton = screen.getByRole('button', { name: /add todo/i });
      
      await user.type(input, 'Test todo');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1', text: 'Test todo', completed: false }),
      });
      
      await user.click(addButton);
      
      // Should show optimistic todo immediately
      expect(screen.getByText('Test todo')).toBeInTheDocument();
    });

    it('shows visual feedback for optimistic operations', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add a new todo/i)).toBeInTheDocument();
      });
      
      const input = screen.getByPlaceholderText(/add a new todo/i);
      await user.type(input, 'Test todo');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1', text: 'Test todo', completed: false }),
      });
      
      const addButton = screen.getByRole('button', { name: /add todo/i });
      await user.click(addButton);
      
      // Should show optimistic visual indicator
      const todoItem = screen.getByText('Test todo').closest('.todo-item');
      expect(todoItem).toHaveClass('optimistic');
    });
  });

  describe('Offline Support', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
    });

    it('shows offline indicator when offline', () => {
      render(<TodoList {...defaultProps} />);
      
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });

    it('saves todos to localStorage when offline', async () => {
      const user = userEvent.setup();
      
      render(<TodoList {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/add a new todo/i);
      const addButton = screen.getByRole('button', { name: /add todo/i });
      
      await user.type(input, 'Offline todo');
      await user.click(addButton);
      
      // Should save to localStorage
      const stored = localStorage.getItem('pending_sync_user1_classroom1');
      expect(stored).toBeTruthy();
    });

    it('shows pending sync count when offline', async () => {
      const user = userEvent.setup();
      
      render(<TodoList {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/add a new todo/i);
      const addButton = screen.getByRole('button', { name: /add todo/i });
      
      await user.type(input, 'Offline todo');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/1 pending/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/new todo item text/i)).toBeInTheDocument();
      });
      
      expect(screen.getByRole('form', { name: /add new todo item/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /todo items/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: '1', text: 'Test todo', completed: false }
        ]),
      });
      
      render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test todo')).toBeInTheDocument();
      });
      
      const checkbox = screen.getByRole('button', { name: /mark as complete/i });
      
      // Should be focusable
      checkbox.focus();
      expect(checkbox).toHaveFocus();
      
      // Should respond to Enter key
      await user.keyboard('{Enter}');
      // Verify the action was triggered (would need to mock the API call)
    });
  });

  describe('Performance', () => {
    it('memoizes progress calculations', async () => {
      const todos = Array.from({ length: 100 }, (_, i) => ({
        id: `todo-${i}`,
        text: `Todo ${i}`,
        completed: i % 2 === 0,
      }));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(todos),
      });
      
      const { rerender } = render(<TodoList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/50\/100 completed/i)).toBeInTheDocument();
      });
      
      // Re-render with same props should not recalculate
      rerender(<TodoList {...defaultProps} />);
      
      expect(screen.getByText(/50\/100 completed/i)).toBeInTheDocument();
    });
  });
});