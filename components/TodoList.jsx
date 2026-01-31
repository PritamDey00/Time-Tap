import { useState, useEffect, useCallback, useMemo } from 'react';
import CustomScrollbar from './CustomScrollbar';

export default function TodoList({ userId, classroomId, className = '' }) {
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryAction, setRetryAction] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState([]);

  // Local storage utilities
  const getStorageKey = () => `todos_${userId}_${classroomId}`;
  const getPendingSyncKey = () => `pending_sync_${userId}_${classroomId}`;

  const saveToLocalStorage = (todos) => {
    try {
      // Only save todos that belong to the current user
      const userTodos = todos.filter(todo => 
        todo.userId === userId && todo.classroomId === classroomId
      );
      
      // Add timestamp for session validation
      const dataToSave = {
        todos: userTodos,
        timestamp: Date.now(),
        userId: userId,
        classroomId: classroomId
      };
      
      localStorage.setItem(getStorageKey(), JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save todos to localStorage:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return [];
      
      const parsedData = JSON.parse(stored);
      
      // Handle both old and new data formats
      let todos = [];
      if (Array.isArray(parsedData)) {
        // Old format - just an array of todos
        todos = parsedData;
      } else if (parsedData.todos && Array.isArray(parsedData.todos)) {
        // New format - object with metadata
        // Validate session data
        if (parsedData.userId === userId && parsedData.classroomId === classroomId) {
          todos = parsedData.todos;
        } else {
          // Session mismatch - clear data and return empty
          localStorage.removeItem(getStorageKey());
          return [];
        }
      }
      
      // Validate that cached todos belong to current user
      const validTodos = todos.filter(todo => 
        todo.userId === userId && todo.classroomId === classroomId
      );
      
      // If some todos were invalid, update the cache
      if (validTodos.length !== todos.length) {
        saveToLocalStorage(validTodos);
      }
      
      return validTodos;
    } catch (error) {
      console.warn('Failed to load todos from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(getStorageKey());
      } catch (e) {
        console.warn('Failed to clear corrupted localStorage data:', e);
      }
      return [];
    }
  };

  const savePendingSync = (operations) => {
    try {
      localStorage.setItem(getPendingSyncKey(), JSON.stringify(operations));
    } catch (error) {
      console.warn('Failed to save pending sync operations:', error);
    }
  };

  const loadPendingSync = () => {
    try {
      const stored = localStorage.getItem(getPendingSyncKey());
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load pending sync operations:', error);
      return [];
    }
  };

  const addToPendingSync = (operation) => {
    const pending = [...pendingSync, { ...operation, timestamp: Date.now() }];
    setPendingSync(pending);
    savePendingSync(pending);
  };

  const removePendingSync = (operationId) => {
    const pending = pendingSync.filter(op => op.id !== operationId);
    setPendingSync(pending);
    savePendingSync(pending);
  };

  // Enhanced error handling utilities
  const createError = (type, message, canRetry = true) => ({
    type,
    message,
    canRetry,
    timestamp: Date.now()
  });

  const getRetryDelay = (attempt) => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt), 4000);
  };

  const executeWithRetry = async (operation, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = getRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          setRetryCount(attempt + 1);
        }
      }
    }
    
    throw lastError;
  };

  // Sync pending operations when back online
  const syncPendingOperations = async () => {
    if (!isOnline || pendingSync.length === 0) return;

    const operations = [...pendingSync];
    
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create':
            await fetch('/api/todos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.data)
            });
            break;
          case 'update':
            await fetch(`/api/todos/${operation.todoId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.data)
            });
            break;
          case 'toggle':
            await fetch(`/api/todos/${operation.todoId}/toggle`, {
              method: 'PATCH'
            });
            break;
          case 'delete':
            await fetch(`/api/todos/${operation.todoId}`, {
              method: 'DELETE'
            });
            break;
        }
        
        removePendingSync(operation.id);
      } catch (error) {
        console.warn('Failed to sync operation:', operation, error);
        // Keep the operation in pending sync for next attempt
      }
    }

    // Reload todos after sync to ensure consistency
    if (operations.length > 0) {
      loadTodos();
    }
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error && error.type === 'network') {
        setError(null);
      }
      // Sync pending operations when back online
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError(createError('network', 'You are offline. Changes will be saved when connection is restored.'));
    };

    // Check initial online status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, pendingSync]);

  // Load todos on component mount and when userId/classroomId changes
  useEffect(() => {
    if (userId && classroomId) {
      // Validate user authentication
      if (!userId || typeof userId !== 'string') {
        setError(createError('validation', 'Invalid user authentication. Please log in again.', false));
        setLoading(false);
        return;
      }

      // Load pending sync operations
      setPendingSync(loadPendingSync());
      
      // Try to load from server, fallback to localStorage if offline
      if (navigator.onLine) {
        loadTodos();
      } else {
        const cachedTodos = loadFromLocalStorage();
        setTodos(cachedTodos);
        setLoading(false);
        setError(createError('network', 'You are offline. Showing cached todos.'));
      }
    } else {
      // Clear todos if no valid user/classroom
      setTodos([]);
      setLoading(false);
    }
  }, [userId, classroomId]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (todos.length > 0) {
      saveToLocalStorage(todos);
    }
  }, [todos]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await executeWithRetry(async () => {
        const response = await fetch(`/api/todos?userId=${userId}&classroomId=${classroomId}`);
        
        if (!response.ok) {
          if (response.status >= 500) {
            throw new Error('server');
          } else if (response.status === 404) {
            throw new Error('not_found');
          } else {
            throw new Error('client');
          }
        }
        
        return await response.json();
      });
      
      // Validate that all returned todos belong to the current user
      const validatedTodos = result.filter(todo => 
        todo.userId === userId && todo.classroomId === classroomId
      );
      
      if (validatedTodos.length !== result.length) {
        console.warn('Some todos were filtered out due to user mismatch');
      }
      
      setTodos(validatedTodos);
      saveToLocalStorage(validatedTodos);
      
    } catch (err) {
      console.error('Error loading todos:', err);
      
      if (!navigator.onLine) {
        setError(createError('network', 'No internet connection. Please check your network and try again.'));
      } else if (err.message === 'server') {
        setError(createError('server', 'Server error occurred. Please try again in a moment.'));
      } else if (err.message === 'not_found') {
        setError(createError('not_found', 'Todo list not found. Please refresh the page.', false));
      } else {
        setError(createError('unknown', 'Failed to load todos. Please try again.'));
      }
      
      setRetryAction(() => loadTodos);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim() || isSubmitting) return;

    const todoText = newTodoText.trim();
    setIsSubmitting(true);
    setError(null);

    // Optimistic update - add todo immediately with enhanced feedback
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      userId,
      classroomId,
      text: todoText,
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true,
      optimisticAction: 'creating'
    };

    setTodos(prev => [...prev, optimisticTodo]);
    setNewTodoText('');

    try {
      if (!isOnline) {
        // Offline mode - add to pending sync
        addToPendingSync({
          id: `sync-${Date.now()}`,
          type: 'create',
          data: { userId, classroomId, text: todoText }
        });
        
        // Keep optimistic todo but mark as syncing
        setTodos(prev => prev.map(todo => 
          todo.id === optimisticTodo.id 
            ? { ...todo, isOptimistic: false, needsSync: true }
            : todo
        ));
        return;
      }

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          classroomId,
          text: todoText
        })
      });

      if (response.ok) {
        const newTodo = await response.json();
        // Replace optimistic todo with real todo
        setTodos(prev => prev.map(todo => 
          todo.id === optimisticTodo.id ? { ...newTodo, isOptimistic: false } : todo
        ));
      } else {
        // Remove optimistic todo on failure
        setTodos(prev => prev.filter(todo => todo.id !== optimisticTodo.id));
        
        if (response.status >= 500) {
          setError(createError('server', 'Server error. Your todo will be saved when the server is available.'));
        } else {
          setError(createError('validation', 'Failed to add todo. Please check your input and try again.'));
        }
        
        setNewTodoText(todoText); // Restore text for retry
        setRetryAction(() => () => addTodo({ preventDefault: () => {} }));
      }
    } catch (err) {
      // Remove optimistic todo on failure
      setTodos(prev => prev.filter(todo => todo.id !== optimisticTodo.id));
      
      if (!navigator.onLine) {
        setError(createError('network', 'No internet connection. Your todo will be saved when connection is restored.'));
      } else {
        setError(createError('network', 'Network error. Please check your connection and try again.'));
      }
      
      setNewTodoText(todoText); // Restore text for retry
      setRetryAction(() => () => addTodo({ preventDefault: () => {} }));
      console.error('Error adding todo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTodo = async (todoId) => {
    // Don't allow toggling optimistic todos
    const todo = todos.find(t => t.id === todoId);
    if (todo?.isOptimistic) return;

    setError(null);

    // Announce state change for screen readers
    const newState = !todo.completed;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const announcement = `Task ${newState ? 'completed' : 'marked as incomplete'}: ${todo.text}`;
      // Use a more subtle approach for screen reader announcements
      const ariaLiveRegion = document.createElement('div');
      ariaLiveRegion.setAttribute('aria-live', 'polite');
      ariaLiveRegion.setAttribute('aria-atomic', 'true');
      ariaLiveRegion.style.position = 'absolute';
      ariaLiveRegion.style.left = '-10000px';
      ariaLiveRegion.style.width = '1px';
      ariaLiveRegion.style.height = '1px';
      ariaLiveRegion.style.overflow = 'hidden';
      ariaLiveRegion.textContent = announcement;
      document.body.appendChild(ariaLiveRegion);
      setTimeout(() => document.body.removeChild(ariaLiveRegion), 1000);
    }

    // Optimistic update - toggle immediately with enhanced feedback
    const previousTodos = todos;
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { 
            ...todo, 
            completed: !todo.completed, 
            updatedAt: new Date().toISOString(),
            isOptimistic: true,
            optimisticAction: 'updating'
          }
        : todo
    ));

    try {
      if (!isOnline) {
        // Offline mode - add to pending sync
        addToPendingSync({
          id: `sync-${Date.now()}`,
          type: 'toggle',
          todoId: todoId
        });
        
        // Keep optimistic update but mark as needing sync
        setTodos(prev => prev.map(todo => 
          todo.id === todoId 
            ? { ...todo, isOptimistic: false, needsSync: true }
            : todo
        ));
        return;
      }

      const response = await fetch(`/api/todos/${todoId}/toggle`, {
        method: 'PATCH'
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? { ...updatedTodo, isOptimistic: false } : todo
        ));
      } else {
        // Revert optimistic update on failure
        setTodos(previousTodos);
        
        if (response.status >= 500) {
          setError(createError('server', 'Server error. Changes will be saved when the server is available.'));
        } else {
          setError(createError('validation', 'Failed to update todo. Please try again.'));
        }
        
        setRetryAction(() => () => toggleTodo(todoId));
      }
    } catch (err) {
      // Revert optimistic update on failure
      setTodos(previousTodos);
      
      if (!navigator.onLine) {
        setError(createError('network', 'No internet connection. Changes will be saved when connection is restored.'));
      } else {
        setError(createError('network', 'Network error. Please check your connection and try again.'));
      }
      
      setRetryAction(() => () => toggleTodo(todoId));
      console.error('Error toggling todo:', err);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = async (todoId) => {
    if (!editingText.trim()) {
      cancelEdit();
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingText.trim() })
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? updatedTodo : todo
        ));
        setEditingId(null);
        setEditingText('');
        setError('');
      } else {
        setError('Failed to update todo');
      }
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const deleteTodo = async (todoId) => {
    // Don't allow deleting optimistic todos
    const todo = todos.find(t => t.id === todoId);
    if (todo?.isOptimistic) return;

    setError(null);

    // Optimistic update - mark as deleting first, then remove
    const previousTodos = todos;
    
    // First mark as deleting for visual feedback
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { ...todo, isOptimistic: true, optimisticAction: 'deleting' }
        : todo
    ));

    // Then remove after a brief delay for better UX
    setTimeout(() => {
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    }, 300);

    try {
      if (!isOnline) {
        // Offline mode - add to pending sync and keep todo marked for deletion
        addToPendingSync({
          id: `sync-${Date.now()}`,
          type: 'delete',
          todoId: todoId
        });
        return;
      }

      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setTodos(previousTodos);
        setError('Failed to delete todo. Please try again.');
      }
    } catch (err) {
      // Revert optimistic update on failure
      setTodos(previousTodos);
      setError('Network error. Please check your connection and try again.');
      console.error('Error deleting todo:', err);
    }
  };

  // Memoized calculations for performance
  const { completedCount, totalCount, progressPercentage } = useMemo(() => {
    const completed = todos.filter(todo => todo.completed).length;
    const total = todos.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      completedCount: completed,
      totalCount: total,
      progressPercentage: percentage
    };
  }, [todos]);

  // Performance monitoring
  const performanceRef = useCallback((node) => {
    if (node && typeof window !== 'undefined' && window.performance) {
      // Monitor scroll performance
      let scrollTimeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          // Log scroll performance if needed
          if (process.env.NODE_ENV === 'development') {
            console.debug('Todo scroll performance check');
          }
        }, 100);
      };
      
      node.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        node.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className={`todo-list ${className}`.trim()}>
        <div className="todo-header">
          <h3 id="todo-title">📝 My Todo List</h3>
        </div>
        <div className="todo-loading">
          <div className="loading-spinner"></div>
          <span>Loading todos...</span>
        </div>
        <style jsx>{`
          .todo-list {
            background: var(--card);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 16px;
            box-shadow: var(--soft-shadow);
            backdrop-filter: blur(10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .todo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--glass-border);
          }

          .todo-header h3 {
            margin: 0;
            color: var(--primary);
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .todo-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 32px;
            color: var(--muted);
          }

          .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid var(--card-secondary);
            border-top: 2px solid var(--theme-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`todo-list ${className}`.trim()}>
      <div className="todo-header">
        <h3>📝 My Todo List</h3>
        {totalCount > 0 && (
          <div className="todo-progress">
            <span className="progress-text">
              {completedCount}/{totalCount} completed
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${completedCount} of ${totalCount} todos completed`}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={`todo-error error-${error.type}`}>
          <div className="error-content">
            <span className="error-icon">
              {error.type === 'network' && '📡'}
              {error.type === 'server' && '⚠️'}
              {error.type === 'validation' && '❌'}
              {error.type === 'not_found' && '🔍'}
              {error.type === 'unknown' && '⚠️'}
            </span>
            <div className="error-details">
              <div className="error-message">{error.message}</div>
              {retryCount > 0 && (
                <div className="retry-info">Retry attempt {retryCount}/3</div>
              )}
              {!isOnline && (
                <div className="offline-indicator">
                  Offline mode
                  {pendingSync.length > 0 && (
                    <span className="sync-count"> • {pendingSync.length} pending</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {retryAction && error.canRetry && (
            <button 
              className="retry-btn"
              onClick={() => {
                retryAction();
                setRetryAction(null);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      )}

      <form onSubmit={addTodo} className="todo-form" role="form" aria-label="Add new todo item">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo..."
          className="todo-input"
          maxLength={200}
          aria-label="New todo item text"
          aria-describedby="todo-input-help"
        />
        <div id="todo-input-help" className="sr-only">
          Enter a description for your new todo item. Maximum 200 characters.
        </div>
        <button 
          type="submit" 
          className="todo-add-btn" 
          disabled={!newTodoText.trim() || isSubmitting}
          aria-label={isSubmitting ? 'Adding todo item...' : 'Add todo item'}
        >
          {isSubmitting ? (
            <div className="loading-spinner small" aria-hidden="true"></div>
          ) : (
            <span aria-hidden="true">➕</span>
          )}
        </button>
      </form>

      <CustomScrollbar
        variant="todo"
        maxHeight="300px"
        className="todo-scroll-container"
        smoothScroll={true}
        ref={performanceRef}
      >
        <div className="todo-items" role="list" aria-label="Todo items">
          {todos.length === 0 ? (
            <div className="todo-empty">
              <span className="empty-icon">📋</span>
              <p>No todos yet. Add one above!</p>
            </div>
          ) : (
            todos.map(todo => (
              <div 
                key={todo.id} 
                className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.isOptimistic ? 'optimistic' : ''}`}
                data-action={todo.optimisticAction || ''}
                data-needs-sync={todo.needsSync || false}
                role="listitem"
                aria-label={`Todo: ${todo.text}. ${todo.completed ? 'Completed' : 'Not completed'}`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`todo-checkbox ${todo.completed ? 'checked' : 'unchecked'}`}
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  aria-checked={todo.completed}
                  aria-describedby={`todo-text-${todo.id}`}
                  role="checkbox"
                  disabled={todo.isOptimistic}
                >
                  <div className="checkbox-inner">
                    <div className="checkbox-background"></div>
                    <div className="checkbox-checkmark">
                      <svg viewBox="0 0 24 24" className="checkmark-icon">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  </div>
                </button>

                {editingId === todo.id ? (
                  <div className="todo-edit-form">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="todo-edit-input"
                      maxLength={200}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveEdit(todo.id);
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                    />
                    <div className="todo-edit-actions">
                      <button
                        type="button"
                        onClick={() => saveEdit(todo.id)}
                        className="todo-save-btn"
                        disabled={!editingText.trim()}
                      >
                        ✅
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="todo-cancel-btn"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span 
                      className="todo-text" 
                      id={`todo-text-${todo.id}`}
                      title={todo.text}
                    >
                      {todo.text}
                    </span>
                    <div className="todo-actions">
                      <button
                        onClick={() => startEditing(todo)}
                        className="todo-edit-btn"
                        aria-label="Edit todo"
                        disabled={todo.isOptimistic}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="todo-delete-btn"
                        aria-label="Delete todo"
                        disabled={todo.isOptimistic}
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CustomScrollbar>

      <style jsx>{`
        .todo-list {
          background: var(--card);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--soft-shadow);
          backdrop-filter: blur(15px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .todo-list::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, var(--theme-primary)03, var(--theme-secondary)03);
          pointer-events: none;
          z-index: 0;
        }

        .todo-list > * {
          position: relative;
          z-index: 1;
        }

        .todo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--glass-border);
        }

        .todo-header h3 {
          margin: 0;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .todo-progress {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .progress-text {
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
        }

        .progress-bar {
          width: 80px;
          height: 4px;
          background: var(--card-secondary);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .todo-error {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          animation: slideIn 0.3s ease-out;
          backdrop-filter: blur(10px);
        }

        .error-network {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #2563eb;
        }

        .error-server {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #d97706;
        }

        .error-validation {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }

        .error-not_found {
          background: rgba(107, 114, 128, 0.1);
          border: 1px solid rgba(107, 114, 128, 0.3);
          color: #6b7280;
        }

        .error-unknown {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .error-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .error-details {
          flex: 1;
        }

        .error-message {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .retry-info {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 400;
        }

        .offline-indicator {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .sync-count {
          font-weight: 400;
          opacity: 0.9;
        }

        .todo-item[data-needs-sync="true"] {
          border-left: 3px solid var(--theme-primary);
          background: linear-gradient(90deg, var(--theme-primary)05, var(--card-secondary));
        }

        .todo-item[data-needs-sync="true"]::after {
          content: '📤';
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          font-size: 12px;
          opacity: 0.7;
        }

        .retry-btn {
          background: var(--theme-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .retry-btn:hover:not(:disabled) {
          background: var(--theme-secondary);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--theme-primary)40;
        }

        .retry-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .todo-form {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .todo-input {
          flex: 1;
          padding: 12px 16px;
          border: 1.5px solid var(--glass-border);
          border-radius: 12px;
          background: var(--card-secondary);
          color: var(--primary);
          font-size: 15px;
          font-weight: 400;
          line-height: 1.4;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .todo-input:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px var(--theme-primary)20, 0 2px 8px var(--theme-primary)10;
          transform: translateY(-1px);
        }

        .todo-input::placeholder {
          color: var(--muted);
        }

        .todo-add-btn {
          padding: 12px 16px;
          background: var(--theme-primary);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
        }

        .todo-add-btn:hover:not(:disabled) {
          background: var(--theme-secondary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--theme-primary)30;
        }

        .todo-add-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 6px var(--theme-primary)20;
        }

        .todo-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .todo-scroll-container {
          margin: 0 -4px;
        }

        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Focus indicators for accessibility */
        .todo-input:focus,
        .todo-add-btn:focus,
        .todo-edit-btn:focus,
        .todo-delete-btn:focus,
        .retry-btn:focus {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .todo-checkbox:focus {
          outline: none;
        }

        .todo-checkbox:focus .checkbox-background {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px var(--theme-primary)20;
        }

        .todo-checkbox:focus-visible .checkbox-background {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px var(--theme-primary)30;
        }

        /* Keyboard navigation improvements */
        .todo-item:focus-within {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
          border-radius: 12px;
        }

        .todo-edit-input:focus {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
          box-shadow: 0 0 0 2px var(--theme-primary)30;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .todo-item {
            border: 2px solid var(--primary);
          }
          
          .todo-error {
            border: 2px solid currentColor;
          }
          
          .todo-input, .todo-add-btn {
            border: 2px solid var(--primary);
          }
        }

        .todo-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .todo-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          color: var(--muted);
          text-align: center;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.7;
        }

        .todo-empty p {
          margin: 0;
          font-size: 14px;
        }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--card-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .todo-item:hover {
          background: var(--card);
          border-color: var(--theme-primary)40;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--theme-primary)15, var(--soft-shadow);
        }

        .todo-item.completed {
          opacity: 0.8;
          background: linear-gradient(135deg, var(--card-secondary), var(--theme-primary)05);
          border-color: var(--theme-primary)20;
        }

        .todo-item.completed:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .todo-item.completed .todo-text {
          color: var(--muted);
          opacity: 0.8;
        }

        /* Theme-specific optimizations */
        :global(.dark) .todo-item.completed .todo-text {
          opacity: 0.7;
        }

        :global(.dark-blue) .todo-item.completed .todo-text {
          opacity: 0.75;
        }

        :global(.pink) .todo-item {
          border-color: rgba(236, 72, 153, 0.2);
        }

        :global(.pink) .todo-item:hover {
          border-color: rgba(236, 72, 153, 0.4);
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15), var(--soft-shadow);
        }

        :global(.yellow) .todo-item {
          border-color: rgba(245, 158, 11, 0.2);
        }

        :global(.yellow) .todo-item:hover {
          border-color: rgba(245, 158, 11, 0.4);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15), var(--soft-shadow);
        }

        :global(.green) .todo-item {
          border-color: rgba(34, 197, 94, 0.2);
        }

        :global(.green) .todo-item:hover {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15), var(--soft-shadow);
        }

        /* High contrast mode support for completed tasks */
        @media (prefers-contrast: high) {
          .todo-item.completed .todo-text {
            opacity: 0.9;
          }
          
          .todo-text::after {
            height: 2px;
            opacity: 0.8;
          }
        }

        /* Performance optimizations */
        .todo-item {
          will-change: transform;
        }

        .todo-checkbox {
          will-change: transform;
        }

        .checkbox-checkmark {
          will-change: transform, opacity;
        }

        .todo-text::after {
          will-change: width;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .todo-item,
          .todo-checkbox,
          .checkbox-checkmark,
          .todo-text::after,
          .todo-input,
          .todo-add-btn {
            transition: none;
            animation: none;
          }

          .todo-item:hover {
            transform: none;
          }

          .todo-checkbox:hover:not(:disabled) {
            transform: none;
          }
        }

        .todo-item.optimistic {
          opacity: 0.8;
          position: relative;
          background: linear-gradient(90deg, var(--card-secondary), var(--theme-primary)10);
          border-color: var(--theme-primary)30;
        }

        .todo-item.optimistic::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
          border-radius: 1px;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .todo-item.optimistic::after {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          font-size: 12px;
          opacity: 0.7;
          animation: pulse 1s ease-in-out infinite;
        }

        .todo-item.optimistic[data-action="creating"]::after {
          content: '⏳';
        }

        .todo-item.optimistic[data-action="updating"]::after {
          content: '🔄';
        }

        .todo-item.optimistic[data-action="deleting"]::after {
          content: '🗑️';
        }

        .todo-item.optimistic[data-action="deleting"] {
          opacity: 0.4;
          transform: scale(0.95);
          transition: all 0.3s ease;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.7;
            transform: translateY(-50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) scale(1.1);
          }
        }

        .todo-checkbox:disabled,
        .todo-edit-btn:disabled,
        .todo-delete-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .todo-checkbox {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .todo-checkbox:hover:not(:disabled) {
          transform: scale(1.05);
          background: var(--theme-primary)10;
        }

        .todo-checkbox:active:not(:disabled) {
          transform: scale(0.95);
        }

        .checkbox-inner {
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 2px solid var(--glass-border);
          border-radius: 4px;
          background: var(--card);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .todo-checkbox.checked .checkbox-background {
          background: var(--theme-primary);
          border-color: var(--theme-primary);
          transform: scale(1);
        }

        .todo-checkbox:hover:not(:disabled) .checkbox-background {
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 2px var(--theme-primary)20;
        }

        .checkbox-checkmark {
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: scale(0.3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .todo-checkbox.checked .checkbox-checkmark {
          opacity: 1;
          transform: scale(1);
          animation: checkmark-celebrate 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes checkmark-celebrate {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .checkmark-icon {
          width: 12px;
          height: 12px;
          fill: white;
        }

        .todo-checkbox:disabled .checkbox-background {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .todo-text {
          flex: 1;
          color: var(--primary);
          font-size: 15px;
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.005em;
          word-break: break-word;
          min-width: 0;
          position: relative;
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .todo-text::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          height: 1px;
          background: currentColor;
          opacity: 0.6;
          border-radius: 0.5px;
          width: 0;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(-50%);
        }

        .todo-item.completed .todo-text::after {
          width: 100%;
          animation: strikethrough 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes strikethrough {
          0% {
            width: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 1;
          }
        }

        /* Reverse animation when unchecking */
        .todo-item:not(.completed) .todo-text::after {
          animation: strikethrough-reverse 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes strikethrough-reverse {
          0% {
            width: 100%;
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            width: 0;
            opacity: 0;
          }
        }

        .todo-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .todo-item:hover .todo-actions {
          opacity: 1;
        }

        .todo-edit-btn,
        .todo-delete-btn,
        .todo-save-btn,
        .todo-cancel-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .todo-edit-btn:hover {
          background: var(--theme-primary)20;
          transform: scale(1.1);
        }

        .todo-delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.1);
        }

        .todo-save-btn:hover:not(:disabled) {
          background: rgba(34, 197, 94, 0.2);
          transform: scale(1.1);
        }

        .todo-cancel-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.1);
        }

        .todo-edit-form {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .todo-edit-input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--theme-primary);
          border-radius: 4px;
          background: var(--card);
          color: var(--primary);
          font-size: 14px;
        }

        .todo-edit-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        .todo-edit-actions {
          display: flex;
          gap: 4px;
        }

        .todo-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .todo-list {
            padding: 20px;
            border-radius: 16px;
          }

          .todo-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 20px;
          }

          .todo-header h3 {
            font-size: 18px;
          }

          .todo-progress {
            align-items: flex-start;
            width: 100%;
          }

          .progress-bar {
            width: 100%;
            height: 6px;
          }

          .todo-form {
            gap: 12px;
            margin-bottom: 24px;
          }

          .todo-input {
            padding: 14px 16px;
            font-size: 16px;
            border-radius: 12px;
          }

          .todo-add-btn {
            padding: 14px 16px;
            min-width: 52px;
            border-radius: 12px;
          }

          .todo-item {
            padding: 16px;
            gap: 16px;
            border-radius: 12px;
          }

          .todo-text {
            font-size: 16px;
            line-height: 1.5;
          }

          .todo-actions {
            opacity: 1;
            gap: 8px;
          }

          .todo-edit-btn,
          .todo-delete-btn,
          .todo-save-btn,
          .todo-cancel-btn {
            padding: 8px;
            min-width: 44px;
            min-height: 44px;
            font-size: 14px;
            border-radius: 8px;
          }

          .checkbox-inner {
            width: 24px;
            height: 24px;
          }

          .checkmark-icon {
            width: 14px;
            height: 14px;
          }

          /* Improve touch interactions */
          .todo-item:hover {
            transform: none;
          }

          .todo-item:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }

          .todo-checkbox:hover:not(:disabled) {
            transform: none;
          }

          .todo-checkbox:active:not(:disabled) {
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}