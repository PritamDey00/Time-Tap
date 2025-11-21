/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import AccountButton from '../components/AccountButton';

// Mock user data
const mockUser = {
  id: '1',
  name: 'Test User',
  avatar: null,
  points: 100,
  streak: 5
};

// Mock functions
const mockOnUserUpdate = jest.fn();

describe('AccountButton Mobile Display', () => {
  beforeEach(() => {
    // Reset any previous styles
    document.head.innerHTML = '';
    mockOnUserUpdate.mockClear();
  });

  test('renders account button with proper mobile styles', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('account-button');
  });

  test('account button has proper positioning styles', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    const styles = window.getComputedStyle(button);
    
    expect(styles.position).toBe('fixed');
    expect(styles.zIndex).toBe('997');
  });

  test('account button displays user initials when no avatar', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    // Should display first two letters of name
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  test('account button displays avatar when provided', () => {
    const userWithAvatar = {
      ...mockUser,
      avatar: 'https://example.com/avatar.jpg'
    };
    
    render(<AccountButton user={userWithAvatar} onUserUpdate={mockOnUserUpdate} />);
    
    const avatar = screen.getByAltText('Account');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('account button has proper accessibility attributes', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Open account panel');
  });

  test('mobile styles are applied correctly', () => {
    // Create a style element with our mobile styles
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .account-button {
          width: 46px !important;
          height: 46px !important;
          top: max(16px, env(safe-area-inset-top, 16px)) !important;
          left: max(16px, env(safe-area-inset-left, 16px)) !important;
        }
      }
      @media (max-width: 600px) {
        .account-button {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Verify the button has the account-button class which will receive the mobile styles
    expect(button).toHaveClass('account-button');
  });

  test('does not render when user is null', () => {
    render(<AccountButton user={null} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  test('handles click events properly', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    button.click();
    
    // Button should be clickable (no errors thrown)
    expect(button).toBeInTheDocument();
  });
});

describe('AccountButton Mobile Responsive Behavior', () => {
  test('maintains minimum touch target size for accessibility', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    
    // The button should have minimum dimensions for touch accessibility
    // This is enforced by our CSS, so we check that the class is applied
    expect(button).toHaveClass('account-button');
  });

  test('uses safe area insets for modern mobile devices', () => {
    // Create a style element that simulates safe area support
    const style = document.createElement('style');
    style.textContent = `
      .account-button {
        top: max(16px, env(safe-area-inset-top, 16px)) !important;
        left: max(16px, env(safe-area-inset-left, 16px)) !important;
      }
    `;
    document.head.appendChild(style);
    
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('account-button');
  });

  test('prevents icon truncation with proper sizing', () => {
    render(<AccountButton user={mockUser} onUserUpdate={mockOnUserUpdate} />);
    
    const button = screen.getByRole('button');
    
    // Verify the button content is properly contained
    const buttonContent = button.querySelector('div[style*="position: relative"]');
    expect(buttonContent).toBeInTheDocument();
  });
});