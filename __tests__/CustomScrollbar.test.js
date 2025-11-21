import { render, screen } from '@testing-library/react';
import CustomScrollbar from '../components/CustomScrollbar';

describe('CustomScrollbar', () => {
  it('renders children correctly', () => {
    render(
      <CustomScrollbar>
        <div>Test content</div>
      </CustomScrollbar>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { container } = render(
      <CustomScrollbar variant="leaderboard-unified">
        <div>Content</div>
      </CustomScrollbar>
    );
    
    expect(container.firstChild).toHaveClass('leaderboard-unified-container');
  });

  it('applies smooth scroll when enabled', () => {
    const { container } = render(
      <CustomScrollbar smoothScroll={true}>
        <div>Content</div>
      </CustomScrollbar>
    );
    
    expect(container.firstChild).toHaveClass('custom-scrollable-smooth');
  });

  it('sets max height correctly', () => {
    const { container } = render(
      <CustomScrollbar maxHeight="200px">
        <div>Content</div>
      </CustomScrollbar>
    );
    
    expect(container.firstChild).toHaveStyle({ maxHeight: '200px' });
  });

  it('applies auto-hide class when enabled', () => {
    const { container } = render(
      <CustomScrollbar autoHide={true}>
        <div>Content</div>
      </CustomScrollbar>
    );
    
    expect(container.firstChild).toHaveClass('custom-scrollable-autohide');
  });

  it('handles different scroll directions', () => {
    const { container: horizontal } = render(
      <CustomScrollbar direction="horizontal">
        <div>Content</div>
      </CustomScrollbar>
    );
    
    expect(horizontal.firstChild).toHaveClass('custom-scrollable-horizontal');
    
    const { container: both } = render(
      <CustomScrollbar direction="both">
        <div>Content</div>
      </CustomScrollbar>
    );
    
    expect(both.firstChild).toHaveClass('custom-scrollable-both');
  });
});