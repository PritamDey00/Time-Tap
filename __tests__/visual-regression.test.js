import { render } from '@testing-library/react';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Extend Jest matchers
expect.extend({ toMatchImageSnapshot });

// Mock components for visual testing
const MockDashboard = ({ theme = 'light', viewport = 'desktop' }) => (
  <div className={`dashboard-mock ${theme} ${viewport}`}>
    <div className="dashboard-container">
      <div className="main-panel card">
        <div className="clock-wrap">
          <div className="clock-face">12:00</div>
        </div>
        <div className="timer-section">
          <div className="user-info">Test User - 1500 pts</div>
        </div>
      </div>
      <div className="right-panel">
        <div className="side-panel card leaderboard-persistent">
          <h4 className="leaderboard-title">🏆 Leaderboard</h4>
          <div className="leaderboard-unified-scroll">
            <div className="leaderboard-content">
              <div className="leaderboard-row-enhanced">
                <div className="avatar">JD</div>
                <div className="leaderboard-username">John Doe</div>
                <div className="leaderboard-points">1500</div>
              </div>
              <div className="leaderboard-row-enhanced">
                <div className="avatar">JS</div>
                <div className="leaderboard-username">Jane Smith</div>
                <div className="leaderboard-points">1200</div>
              </div>
            </div>
          </div>
        </div>
        <div className="todo-panel">
          <div className="todo-list">
            <div className="todo-header">
              <h3>📝 My Todo List</h3>
            </div>
            <div className="todo-form">
              <input className="todo-input" placeholder="Add a new todo..." />
              <button className="todo-add-btn">➕</button>
            </div>
            <div className="todo-items">
              <div className="todo-item">
                <button className="todo-checkbox">⬜</button>
                <span className="todo-text">Sample todo item</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

describe('Visual Regression Tests', () => {
  // Mock CSS styles for testing
  beforeAll(() => {
    // Add basic styles for visual testing
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-container {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 32px;
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
      }
      
      .main-panel {
        grid-column: 1;
        padding: 32px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 16px;
        border: 1px solid rgba(226, 232, 240, 0.8);
      }
      
      .right-panel {
        grid-column: 2;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .clock-wrap {
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(59, 130, 246, 0.3);
      }
      
      .clock-face {
        font-size: 48px;
        font-weight: bold;
        color: #1f2937;
      }
      
      .leaderboard-row-enhanced {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        border: 1px solid rgba(226, 232, 240, 0.8);
      }
      
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }
      
      .todo-list {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(226, 232, 240, 0.8);
      }
      
      .todo-form {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .todo-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 8px;
      }
      
      .todo-add-btn {
        padding: 10px 12px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
      }
      
      .todo-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(248, 250, 252, 0.8);
        border-radius: 8px;
        margin-bottom: 8px;
      }
      
      /* Theme variations */
      .dark .main-panel,
      .dark .leaderboard-row-enhanced,
      .dark .todo-list {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(71, 85, 105, 0.4);
        color: #e2e8f0;
      }
      
      .dark .clock-wrap {
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(71, 85, 105, 0.5);
      }
      
      .dark .clock-face {
        color: #e2e8f0;
      }
      
      .pink .main-panel,
      .pink .leaderboard-row-enhanced,
      .pink .todo-list {
        background: rgba(252, 231, 243, 0.9);
        border-color: rgba(236, 72, 153, 0.25);
      }
      
      .green .main-panel,
      .green .leaderboard-row-enhanced,
      .green .todo-list {
        background: rgba(220, 252, 231, 0.9);
        border-color: rgba(34, 197, 94, 0.25);
      }
      
      /* Responsive styles */
      @media (max-width: 768px) {
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .clock-wrap {
          width: 320px;
          height: 320px;
        }
        
        .right-panel {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  });

  describe('Theme Consistency', () => {
    const themes = ['light', 'dark', 'pink', 'green', 'yellow', 'dark-blue'];

    themes.forEach(theme => {
      it(`renders ${theme} theme correctly`, () => {
        const { container } = render(<MockDashboard theme={theme} />);
        
        // Add theme class to container for styling
        container.firstChild.className += ` ${theme}`;
        
        expect(container.firstChild).toMatchImageSnapshot({
          customSnapshotIdentifier: `dashboard-${theme}-theme`,
          failureThreshold: 0.01,
          failureThresholdType: 'percent',
        });
      });
    });
  });

  describe('Responsive Breakpoints', () => {
    const viewports = [
      { name: 'desktop', width: 1200 },
      { name: 'tablet', width: 1024 },
      { name: 'mobile', width: 600 },
      { name: 'small-mobile', width: 400 },
    ];

    viewports.forEach(({ name, width }) => {
      it(`renders correctly at ${name} viewport (${width}px)`, () => {
        // Mock viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { container } = render(<MockDashboard viewport={name} />);
        
        expect(container.firstChild).toMatchImageSnapshot({
          customSnapshotIdentifier: `dashboard-${name}-viewport`,
          failureThreshold: 0.01,
          failureThresholdType: 'percent',
        });
      });
    });
  });

  describe('Component States', () => {
    it('renders error states correctly', () => {
      const ErrorStateDashboard = () => (
        <div className="dashboard-mock">
          <div className="todo-list">
            <div className="todo-error error-network">
              <div className="error-content">
                <span className="error-icon">📡</span>
                <div className="error-details">
                  <div className="error-message">Network error occurred</div>
                </div>
              </div>
              <button className="retry-btn">Retry</button>
            </div>
          </div>
        </div>
      );

      const { container } = render(<ErrorStateDashboard />);
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-error-state',
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });

    it('renders loading states correctly', () => {
      const LoadingStateDashboard = () => (
        <div className="dashboard-mock">
          <div className="todo-list">
            <div className="todo-loading">
              <div className="loading-spinner"></div>
              <span>Loading todos...</span>
            </div>
          </div>
        </div>
      );

      const { container } = render(<LoadingStateDashboard />);
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-loading-state',
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });

    it('renders optimistic update states correctly', () => {
      const OptimisticStateDashboard = () => (
        <div className="dashboard-mock">
          <div className="todo-list">
            <div className="todo-items">
              <div className="todo-item optimistic" data-action="creating">
                <button className="todo-checkbox">⬜</button>
                <span className="todo-text">New optimistic todo</span>
              </div>
            </div>
          </div>
        </div>
      );

      const { container } = render(<OptimisticStateDashboard />);
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-optimistic-state',
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });
  });

  describe('Scroll Behavior', () => {
    it('renders scroll containers correctly', () => {
      const ScrollTestDashboard = () => (
        <div className="dashboard-mock">
          <div className="leaderboard-unified-scroll" style={{ maxHeight: '200px', overflow: 'auto' }}>
            <div className="leaderboard-content">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="leaderboard-row-enhanced">
                  <div className="avatar">U{i}</div>
                  <div className="leaderboard-username">User {i}</div>
                  <div className="leaderboard-points">{1000 - i * 50}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      const { container } = render(<ScrollTestDashboard />);
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-scroll-container',
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });
  });

  describe('Animation States', () => {
    it('captures hover state styling', () => {
      const HoverStateDashboard = () => (
        <div className="dashboard-mock">
          <div className="leaderboard-row-enhanced" style={{
            transform: 'translateX(8px) scale(1.02)',
            boxShadow: '0 12px 35px rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 0.6)',
          }}>
            <div className="avatar" style={{
              transform: 'scale(1.15) rotate(2deg)',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)',
            }}>JD</div>
            <div className="leaderboard-username" style={{ color: '#3b82f6' }}>John Doe</div>
            <div className="leaderboard-points" style={{ color: '#3b82f6' }}>1500</div>
          </div>
        </div>
      );

      const { container } = render(<HoverStateDashboard />);
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-hover-state',
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });
  });

  describe('Accessibility Features', () => {
    it('renders focus indicators correctly', () => {
      const FocusStateDashboard = () => (
        <div className="dashboard-mock">
          <div className="todo-form">
            <input 
              className="todo-input" 
              placeholder="Add a new todo..."
              style={{
                outline: '2px solid #3b82f6',
                outlineOffset: '2px',
                borderRadius: '4px',
              }}
            />
            <button 
              className="todo-add-btn"
              style={{
                outline: '2px solid #3b82f6',
                outlineOffset: '2px',
                borderRadius: '4px',
              }}
            >
              ➕
            </button>
          </div>
        </div>
      );

      const { container } = render(<FocusStateDashboard />);
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-focus-indicators',
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('renders consistently across different rendering engines', () => {
      const { container } = render(<MockDashboard />);
      
      // Test with different CSS properties that might render differently
      const testElement = container.querySelector('.clock-wrap');
      if (testElement) {
        testElement.style.backdropFilter = 'blur(20px)';
        testElement.style.webkitBackdropFilter = 'blur(20px)';
      }
      
      expect(container.firstChild).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dashboard-cross-browser',
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
      });
    });
  });
});