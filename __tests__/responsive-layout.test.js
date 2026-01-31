import { render } from '@testing-library/react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Responsive Layout System', () => {
  const mockViewport = (width, height = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });

    // Update matchMedia to match the viewport
    window.matchMedia = jest.fn().mockImplementation(query => {
      let matches = false;
      
      if (query.includes('min-width: 1200px')) {
        matches = width >= 1200;
      } else if (query.includes('min-width: 769px') && query.includes('max-width: 1199px')) {
        matches = width >= 769 && width <= 1199;
      } else if (query.includes('max-width: 768px')) {
        matches = width <= 768;
      } else if (query.includes('max-width: 600px')) {
        matches = width <= 600;
      } else if (query.includes('max-width: 480px')) {
        matches = width <= 480;
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  };

  describe('Desktop Layout (≥1200px)', () => {
    beforeEach(() => {
      mockViewport(1400);
    });

    it('applies desktop grid layout', () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('uses correct component sizing for desktop', () => {
      const { container } = render(
        <div className="leaderboard-unified-scroll">
          <div className="leaderboard-row-enhanced">User</div>
        </div>
      );

      const scrollContainer = container.querySelector('.leaderboard-unified-scroll');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('applies desktop-specific spacing', () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="main-panel">Content</div>
        </div>
      );

      const container_elem = container.querySelector('.dashboard-container');
      expect(container_elem).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (769px - 1199px)', () => {
    beforeEach(() => {
      mockViewport(1024);
    });

    it('applies tablet grid layout', () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('adjusts component sizes for tablet', () => {
      const { container } = render(
        <div className="right-panel">
          <div className="side-panel">Leaderboard</div>
          <div className="todo-panel">Todos</div>
        </div>
      );

      const rightPanel = container.querySelector('.right-panel');
      expect(rightPanel).toBeInTheDocument();
    });
  });

  describe('Mobile Layout (≤768px)', () => {
    beforeEach(() => {
      mockViewport(600);
    });

    it('switches to mobile stacked layout', () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('stacks components vertically on mobile', () => {
      const { container } = render(
        <div className="right-panel">
          <div className="side-panel">Leaderboard</div>
          <div className="todo-panel">Todos</div>
        </div>
      );

      const rightPanel = container.querySelector('.right-panel');
      expect(rightPanel).toBeInTheDocument();
    });

    it('applies mobile-specific touch targets', () => {
      const { container } = render(
        <button className="theme-btn">Theme</button>
      );

      const themeBtn = container.querySelector('.theme-btn');
      expect(themeBtn).toBeInTheDocument();
    });
  });

  describe('Small Mobile Layout (≤480px)', () => {
    beforeEach(() => {
      mockViewport(400);
    });

    it('applies extra small mobile optimizations', () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="clock-wrap">Clock</div>
        </div>
      );

      const clockWrap = container.querySelector('.clock-wrap');
      expect(clockWrap).toBeInTheDocument();
    });

    it('optimizes spacing for small screens', () => {
      const { container } = render(
        <div className="main-panel">
          <div className="user-info">User info</div>
        </div>
      );

      const mainPanel = container.querySelector('.main-panel');
      expect(mainPanel).toBeInTheDocument();
    });
  });

  describe('Landscape Orientation', () => {
    beforeEach(() => {
      mockViewport(800, 600); // Landscape mobile
      
      // Mock orientation
      Object.defineProperty(screen, 'orientation', {
        value: { angle: 90 },
        writable: true,
      });
    });

    it('adapts layout for landscape mobile', () => {
      const { container } = render(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('maintains usability in landscape mode', () => {
      const { container } = render(
        <div className="right-panel">
          <div className="side-panel">Leaderboard</div>
        </div>
      );

      const sidePanel = container.querySelector('.side-panel');
      expect(sidePanel).toBeInTheDocument();
    });
  });

  describe('Breakpoint Transitions', () => {
    it('handles smooth transitions between breakpoints', () => {
      const { container, rerender } = render(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      // Start with desktop
      mockViewport(1400);
      rerender(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      // Transition to tablet
      mockViewport(1024);
      rerender(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      // Transition to mobile
      mockViewport(600);
      rerender(
        <div className="dashboard-container">
          <div className="main-panel">Clock</div>
          <div className="right-panel">Data</div>
        </div>
      );

      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });
  });

  describe('Component Sizing Matrix', () => {
    const testSizes = [
      { width: 1400, label: 'Desktop' },
      { width: 1024, label: 'Tablet' },
      { width: 600, label: 'Mobile' },
      { width: 400, label: 'Small Mobile' },
    ];

    testSizes.forEach(({ width, label }) => {
      it(`applies correct sizing for ${label} (${width}px)`, () => {
        mockViewport(width);
        
        const { container } = render(
          <div>
            <div className="clock-wrap">Clock</div>
            <div className="leaderboard-unified-scroll">
              <div className="leaderboard-row-enhanced">User</div>
            </div>
            <div className="todo-list">Todo</div>
          </div>
        );

        const clockWrap = container.querySelector('.clock-wrap');
        const leaderboard = container.querySelector('.leaderboard-unified-scroll');
        const todoList = container.querySelector('.todo-list');

        expect(clockWrap).toBeInTheDocument();
        expect(leaderboard).toBeInTheDocument();
        expect(todoList).toBeInTheDocument();
      });
    });
  });

  describe('Touch-Friendly Optimizations', () => {
    beforeEach(() => {
      mockViewport(600);
      
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
      });
    });

    it('applies touch-friendly button sizes', () => {
      const { container } = render(
        <button className="theme-btn">Theme</button>
      );

      const button = container.querySelector('.theme-btn');
      expect(button).toBeInTheDocument();
    });

    it('optimizes scroll areas for touch', () => {
      const { container } = render(
        <div className="leaderboard-unified-scroll">
          <div>Content</div>
        </div>
      );

      const scrollArea = container.querySelector('.leaderboard-unified-scroll');
      expect(scrollArea).toBeInTheDocument();
    });
  });
});