/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from '../components/TodoList';

// Mock CustomScrollbar component
jest.mock('../components/CustomScrollbar', () => {
  return function MockCustomScrollbar({ children, className }) {
    return <div className={className}>{children}</div>;
  };
});

describe('TodoList Component', () => {
  const defaultProps = {
    userId: 'user-123',
    classroomId: 'classroom-456'
  };

  const mockTodos = [
    {
      id: 'todo-1',
      userId: 'user-123',
      classroomId: 'classroom-456',
      text: 'Complete assignment',
      completed: false,
      priority: 'high',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'todo-2',
      userId: 'user-123',
      classroomId: 'classroom-456',
      text: 'Review notes',
      completed: true,
      priority: 'medium',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    test('displays loading spinner when loading todos', async () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TodoList {...defaultProps} />);

      expect(screen.getByText('Loading todos...')).toBeInTheDocument();
      expect(screen.getByRole('generic', { name: /loading-spinner/i })).toBeInTheDocument();
    });

    test('loads todos on mount', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/todos?userId=user-123&classroomId=classroom-456');
      });
    });

    test('reloads todos when userId or classroomId changes', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const { rerender } = render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Change classroomId
      rerender(<TodoList userId="user-123" classroomId="classroom-789" />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenLastCalledWith('/api/todos?userId=user-123&classroomId=classroom-789');
      });
    });
  });

  describe('Todo Display', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });
    });

    test('displays todos after loading', async () => {
      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
        expect(screen.getByText('Review notes')).toBeInTheDocument();
      });
    });

    test('shows progress counter', async () => {
      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1/2 completed')).toBeInTheDocument();
      });
    });

    test('displays empty state when no todos', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
      });
    });

    test('shows completed todos with strikethrough', async () => {
      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        const completedTodo = screen.getByText('Review notes').closest('.todo-item');
        expect(completedTodo).toHaveClass('completed');
      });
    });
  });

  describe('Adding Todos', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
    });

    test('adds new todo successfully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
        .mockResolvedValueOnce({ // Add todo
          ok: true,
          json: async () => ({
            id: 'todo-new',
            userId: 'user-123',
            classroomId: 'classroom-456',
            text: 'New todo',
            completed: false,
            priority: 'medium'
          })
        });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: /➕/i });

      await user.type(input, 'New todo');
      await user.click(addButton);

      expect(fetch).toHaveBeenCalledWith('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          classroomId: 'classroom-456',
          text: 'New todo'
        })
      });

      await waitFor(() => {
        expect(screen.getByText('New todo')).toBeInTheDocument();
      });
    });

    test('shows optimistic update while adding todo', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: /➕/i });

      await user.type(input, 'Optimistic todo');
      await user.click(addButton);

      // Should show optimistic todo immediately
      expect(screen.getByText('Optimistic todo')).toBeInTheDocument();
      const optimisticTodo = screen.getByText('Optimistic todo').closest('.todo-item');
      expect(optimisticTodo).toHaveClass('optimistic');
    });

    test('prevents adding empty todos', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /➕/i });
      expect(addButton).toBeDisabled();

      const input = screen.getByPlaceholderText('Add a new todo...');
      await user.type(input, '   '); // Only whitespace

      expect(addButton).toBeDisabled();
    });

    test('handles add todo failure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
        .mockResolvedValueOnce({ ok: false }); // Add fails

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: /➕/i });

      await user.type(input, 'Failed todo');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add todo. Please try again.')).toBeInTheDocument();
      });

      // Should restore input text for retry
      expect(input.value).toBe('Failed todo');
    });
  });

  describe('Toggling Todos', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });
    });

    test('toggles todo completion successfully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({ // Toggle response
        ok: true,
        json: async () => ({
          ...mockTodos[0],
          completed: true,
          updatedAt: '2023-01-03T00:00:00.000Z'
        })
      });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      expect(fetch).toHaveBeenCalledWith('/api/todos/todo-1/toggle', {
        method: 'PATCH'
      });

      await waitFor(() => {
        const todoItem = screen.getByText('Complete assignment').closest('.todo-item');
        expect(todoItem).toHaveClass('completed');
      });
    });

    test('shows optimistic update when toggling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      // Should show optimistic update immediately
      const todoItem = screen.getByText('Complete assignment').closest('.todo-item');
      expect(todoItem).toHaveClass('completed');
    });

    test('reverts optimistic update on toggle failure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({ ok: false }); // Toggle fails

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText('Failed to update todo. Please try again.')).toBeInTheDocument();
      });

      // Should revert to original state
      const todoItem = screen.getByText('Complete assignment').closest('.todo-item');
      expect(todoItem).not.toHaveClass('completed');
    });
  });

  describe('Editing Todos', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });
    });

    test('enters edit mode when edit button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit todo' });
      await user.click(editButton);

      expect(screen.getByDisplayValue('Complete assignment')).toBeInTheDocument();
    });

    test('saves edit successfully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({ // Update response
        ok: true,
        json: async () => ({
          ...mockTodos[0],
          text: 'Updated assignment',
          updatedAt: '2023-01-03T00:00:00.000Z'
        })
      });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit todo' });
      await user.click(editButton);

      const input = screen.getByDisplayValue('Complete assignment');
      await user.clear(input);
      await user.type(input, 'Updated assignment');

      const saveButton = screen.getByRole('button', { name: '✅' });
      await user.click(saveButton);

      expect(fetch).toHaveBeenCalledWith('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Updated assignment' })
      });

      await waitFor(() => {
        expect(screen.getByText('Updated assignment')).toBeInTheDocument();
      });
    });

    test('cancels edit when cancel button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit todo' });
      await user.click(editButton);

      const input = screen.getByDisplayValue('Complete assignment');
      await user.clear(input);
      await user.type(input, 'Changed text');

      const cancelButton = screen.getByRole('button', { name: '❌' });
      await user.click(cancelButton);

      // Should revert to original text
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Changed text')).not.toBeInTheDocument();
    });

    test('saves edit on Enter key', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTodos[0], text: 'Enter saved' })
      });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit todo' });
      await user.click(editButton);

      const input = screen.getByDisplayValue('Complete assignment');
      await user.clear(input);
      await user.type(input, 'Enter saved');
      await user.keyboard('{Enter}');

      expect(fetch).toHaveBeenCalledWith('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Enter saved' })
      });
    });

    test('cancels edit on Escape key', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit todo' });
      await user.click(editButton);

      const input = screen.getByDisplayValue('Complete assignment');
      await user.clear(input);
      await user.type(input, 'Escape cancelled');
      await user.keyboard('{Escape}');

      // Should revert to original text
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Escape cancelled')).not.toBeInTheDocument();
    });
  });

  describe('Deleting Todos', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });
    });

    test('deletes todo successfully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({ ok: true }); // Delete response

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete todo' });
      await user.click(deleteButton);

      expect(fetch).toHaveBeenCalledWith('/api/todos/todo-1', {
        method: 'DELETE'
      });

      await waitFor(() => {
        expect(screen.queryByText('Complete assignment')).not.toBeInTheDocument();
      });
    });

    test('shows optimistic update when deleting', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete todo' });
      await user.click(deleteButton);

      // Should remove todo immediately
      expect(screen.queryByText('Complete assignment')).not.toBeInTheDocument();
    });

    test('reverts optimistic update on delete failure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch.mockResolvedValueOnce({ ok: false }); // Delete fails

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete assignment')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete todo' });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete todo. Please try again.')).toBeInTheDocument();
      });

      // Should restore the todo
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error when loading todos fails', async () => {
      fetch.mockResolvedValueOnce({ ok: false });

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
      });
    });

    test('displays error when network request fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
      });
    });
  });

  describe('Optimistic Updates', () => {
    test('prevents actions on optimistic todos', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
      });

      // Add optimistic todo
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByRole('button', { name: /➕/i });

      await user.type(input, 'Optimistic todo');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Optimistic todo')).toBeInTheDocument();
      });

      // Try to interact with optimistic todo
      const todoItem = screen.getByText('Optimistic todo').closest('.todo-item');
      const checkbox = todoItem.querySelector('.todo-checkbox');
      const editButton = todoItem.querySelector('.todo-edit-btn');
      const deleteButton = todoItem.querySelector('.todo-delete-btn');

      expect(checkbox).toBeDisabled();
      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });
    });

    test('has proper ARIA labels', async () => {
      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as complete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit todo' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete todo' })).toBeInTheDocument();
      });
    });

    test('updates ARIA labels based on completion status', async () => {
      render(<TodoList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as complete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Mark as incomplete' })).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('applies custom className', () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<TodoList {...defaultProps} className="custom-class" />);

      const todoList = document.querySelector('.todo-list');
      expect(todoList).toHaveClass('custom-class');
    });
  });
});