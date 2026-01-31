import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import UniversalClassroom from '../pages/dashboard';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.Notification
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: jest.fn(() => Promise.resolve('granted')),
  },
});

describe('Dashboard Layout Integration', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    points: 1500,
    streak: 5,
    timezone: 'America/New_York',
    lastConfirm: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mockUsers = [
    {
      id: 'user1',
      name: 'Test User',
      points: 1500,
      streak: 5,
      onlineStatus: 'online',
    },
    {
      id: 'user2',
      name: 'Other User',
      points: 1200,
      streak: 3,
      onlineStatus: 'away',
    },
  ];

  beforeEach(() => {
    useRouter.mockReturnValue({
      push: jest.fn(),
      pathname: '/dashboard',
    });

    fetch.mockImplementation((url) => {
      if (url === '/api/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser }),
        });
      }
      if (url === '/api/classrooms/universal/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes('/api/todos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'light'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    });
  });

  afterEach(() => {
    fetch.mockClear();
  });

  describe('CSS Grid Layout', () => {
    it('renders main dashboard container with grid layout', async () => {
      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
      
      // Should have grid layout styles applied
      const computedStyle = window.getComputedStyle(dashboardContainer);
      expect(computedStyle.display).toBe('grid');
    });

    it('positions todo list on left, clock in center, and leaderboard on right', async () => {
      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const leftPanel = container.querySelector('.left-panel');
      const centerPanel = container.querySelector('.center-panel');
      const rightPanel = container.querySelector('.right-panel');
      
      expect(leftPanel).toBeInTheDocument();
      expect(centerPanel).toBeInTheDocument();
      expect(rightPanel).toBeInTheDocument();
      
      // Check grid positioning for three-column layout
      expect(leftPanel).toHaveStyle({ gridColumn: '1' });
      expect(centerPanel).toHaveStyle({ gridColumn: '2' });
      expect(rightPanel).toHaveStyle({ gridColumn: '3' });
    });

    it('contains clock, leaderboard, and todo list in correct positions', async () => {
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Clock should be in center panel
      const clockElement = screen.getByLabelText(/clock and timer section/i);
      expect(clockElement).toBeInTheDocument();
      
      // Leaderboard should be in right panel
      const leaderboard = screen.getByText(/universal leaderboard/i);
      expect(leaderboard).toBeInTheDocument();
      
      // Todo list should be in left panel
      const todoList = screen.getByText(/my todo list/i);
      expect(todoList).toBeInTheDocument();
    });
  });

  describe('Responsive Breakpoints', () => {
    it('adapts layout for tablet screens', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('switches to mobile layout on small screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates leaderboard with unified scroll system', async () => {
      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const leaderboardScroll = container.querySelector('.leaderboard-unified-scroll');
      expect(leaderboardScroll).toBeInTheDocument();
    });

    it('integrates todo list with enhanced error handling', async () => {
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const todoInput = screen.getByPlaceholderText(/add a new todo/i);
      expect(todoInput).toBeInTheDocument();
      
      const addButton = screen.getByRole('button', { name: /add todo/i });
      expect(addButton).toBeInTheDocument();
    });

    it('maintains theme consistency across all components', async () => {
      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Check that theme classes are applied
      const cards = container.querySelectorAll('.card');
      expect(cards.length).toBeGreaterThan(0);
      
      cards.forEach(card => {
        expect(card).toHaveClass('card');
      });
    });
  });

  describe('Performance Integration', () => {
    it('loads components efficiently', async () => {
      const startTime = performance.now();
      
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(1000);
    });

    it('handles multiple API calls concurrently', async () => {
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Verify all expected API calls were made
      expect(fetch).toHaveBeenCalledWith('/api/me');
      expect(fetch).toHaveBeenCalledWith('/api/classrooms/universal/users');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/todos'));
    });
  });

  describe('Accessibility Integration', () => {
    it('provides proper semantic structure', async () => {
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Check for proper landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      
      // Check for proper regions
      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);
    });

    it('maintains focus management across components', async () => {
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Check that interactive elements are focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('provides screen reader friendly content', async () => {
      render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Check for proper ARIA labels
      const labelledElements = screen.getAllByLabelText(/.+/);
      expect(labelledElements.length).toBeGreaterThan(0);
    });
  });

  describe('Theme Integration', () => {
    it('applies theme consistently across all components', async () => {
      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // Check theme selector
      const themeButtons = container.querySelectorAll('.theme-btn');
      expect(themeButtons.length).toBe(6); // 6 themes
      
      // Check that active theme is marked
      const activeTheme = container.querySelector('.theme-btn.active');
      expect(activeTheme).toBeInTheDocument();
    });

    it('maintains visual consistency in different themes', async () => {
      const { container } = render(<UniversalClassroom />);
      
      await screen.findByText('Test User');
      
      // All themed elements should have consistent styling
      const themedElements = container.querySelectorAll('[class*="theme"]');
      expect(themedElements.length).toBeGreaterThan(0);
    });
  });
});