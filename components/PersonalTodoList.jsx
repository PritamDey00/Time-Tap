import { useState, useEffect } from 'react';

export default function PersonalTodoList({ userId, className = '' }) {
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load todos on component mount
  useEffect(() => {
    if (userId) {
      loadTodos();
    }
  }, [userId]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/personal-todos');
      
      if (!response.ok) {
        throw new Error('Failed to load todos');
      }
      
      const data = await response.json();
      setTodos(data);
      
    } catch (err) {
      console.error('Error loading todos:', err);
      setError('Failed to load todos. Please try again.');
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

    try {
      const response = await fetch('/api/personal-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: todoText })
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos(prev => [...prev, newTodo]);
        setNewTodoText('');
      } else {
        setError('Failed to add todo');
      }
    } catch (err) {
      setError('Failed to add todo');
      console.error('Error adding todo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTodo = async (todoId) => {
    setError(null);

    // Optimistic update
    const previousTodos = todos;
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { ...todo, completed: !todo.completed }
        : todo
    ));

    try {
      const response = await fetch(`/api/personal-todos/${todoId}/toggle`, {
        method: 'PATCH'
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? updatedTodo : todo
        ));
      } else {
        // Revert on failure
        setTodos(previousTodos);
        setError('Failed to update todo');
      }
    } catch (err) {
      // Revert on failure
      setTodos(previousTodos);
      setError('Failed to update todo');
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
      const response = await fetch(`/api/personal-todos/${todoId}`, {
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
        setError(null);
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
    setError(null);

    // Optimistic update
    const previousTodos = todos;
    setTodos(prev => prev.filter(todo => todo.id !== todoId));

    try {
      const response = await fetch(`/api/personal-todos/${todoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Revert on failure
        setTodos(previousTodos);
        setError('Failed to delete todo');
      }
    } catch (err) {
      // Revert on failure
      setTodos(previousTodos);
      setError('Failed to delete todo');
      console.error('Error deleting todo:', err);
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className={`todo-list ${className}`.trim()}>
        <div className="todo-header">
          <h3>📝 My Todo List</h3>
        </div>
        <div className="todo-loading">
          <div className="loading-spinner"></div>
          <span>Loading todos...</span>
        </div>
        <style jsx>{`
          .todo-list {
            background: var(--glass);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 2px solid var(--glass-border);
            border-radius: 20px;
            padding: 24px;
            box-shadow: var(--soft-shadow);
            transition: all 0.3s ease;
          }

          .todo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--glass-border);
          }

          .todo-header h3 {
            margin: 0;
            background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 18px;
            font-weight: 700;
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
              {completedCount}/{totalCount}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="todo-error">
          <span>⚠️ {error}</span>
          <button onClick={loadTodos} className="retry-btn">Retry</button>
        </div>
      )}

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo..."
          className="todo-input"
          maxLength={200}
        />
        <button 
          type="submit" 
          className="todo-add-btn" 
          disabled={!newTodoText.trim() || isSubmitting}
        >
          {isSubmitting ? '⏳' : '➕'}
        </button>
      </form>

      <div className="todo-items">
        {todos.length === 0 ? (
          <div className="todo-empty">
            <span className="empty-icon">📋</span>
            <p>No todos yet. Add one above!</p>
          </div>
        ) : (
          todos.map(todo => (
            <div 
              key={todo.id} 
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
              >
                {todo.completed && '✓'}
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
                  <span className="todo-text">{todo.text}</span>
                  <div className="todo-actions">
                    <button
                      onClick={() => startEditing(todo)}
                      className="todo-edit-btn"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="todo-delete-btn"
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

      <style jsx>{`
        .todo-list {
          background: var(--glass);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 2px solid var(--glass-border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--soft-shadow), 0 0 40px var(--theme-primary)10;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .todo-list::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
          border-radius: 20px 20px 0 0;
        }

        .todo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--glass-border);
        }

        .todo-header h3 {
          margin: 0;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 18px;
          font-weight: 700;
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
          font-weight: 600;
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .retry-btn {
          background: var(--theme-primary);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:hover {
          background: var(--theme-secondary);
          transform: translateY(-1px);
        }

        .todo-form {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .todo-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid var(--glass-border);
          border-radius: 12px;
          background: var(--card-secondary);
          color: var(--primary);
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .todo-input:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px var(--theme-primary)20;
        }

        .todo-add-btn {
          padding: 12px 16px;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          min-width: 48px;
        }

        .todo-add-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--theme-primary)30;
        }

        .todo-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .todo-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .todo-items::-webkit-scrollbar {
          width: 6px;
        }

        .todo-items::-webkit-scrollbar-track {
          background: var(--card-secondary);
          border-radius: 3px;
        }

        .todo-items::-webkit-scrollbar-thumb {
          background: var(--theme-primary);
          border-radius: 3px;
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

        .todo-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--card-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .todo-item:hover {
          background: var(--card);
          border-color: var(--theme-primary)40;
          transform: translateX(4px);
        }

        .todo-item.completed {
          opacity: 0.7;
        }

        .todo-checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid var(--glass-border);
          border-radius: 6px;
          background: var(--card);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .todo-checkbox.checked {
          background: var(--theme-primary);
          border-color: var(--theme-primary);
          color: white;
        }

        .todo-checkbox:hover {
          border-color: var(--theme-primary);
        }

        .todo-text {
          flex: 1;
          color: var(--primary);
          font-size: 15px;
          word-break: break-word;
        }

        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: var(--muted);
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
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .todo-edit-btn:hover {
          background: var(--theme-primary)20;
        }

        .todo-delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
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
          border-radius: 6px;
          background: var(--card);
          color: var(--primary);
          font-size: 14px;
        }

        .todo-edit-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--theme-primary)30;
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
          }

          .todo-actions {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
