import { forwardRef } from 'react';

/**
 * CustomScrollbar component provides consistent scrollable elements with theme-aware styling
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to be scrolled
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {number} props.maxHeight - Maximum height for the scrollable area
 * @param {string} props.variant - Scrollbar variant ('default', 'thin', 'leaderboard', 'leaderboard-unified', 'chat', 'todo')
 * @param {boolean} props.autoHide - Whether to auto-hide scrollbar when not hovering
 * @param {string} props.direction - Scroll direction ('vertical', 'horizontal', 'both')
 * @param {boolean} props.smoothScroll - Enable smooth scrolling behavior
 */
const CustomScrollbar = forwardRef(({
  children,
  className = '',
  style = {},
  maxHeight,
  variant = 'default',
  autoHide = false,
  direction = 'vertical',
  smoothScroll = true,
  ...props
}, ref) => {
  // Generate CSS class names based on variant and options
  const getScrollbarClasses = () => {
    const classes = ['custom-scrollable'];
    
    if (variant === 'thin') {
      classes.push('custom-scrollable-thin');
    } else if (variant === 'leaderboard') {
      classes.push('leaderboard-container');
    } else if (variant === 'leaderboard-unified') {
      classes.push('leaderboard-unified-container');
    } else if (variant === 'chat') {
      classes.push('chat-messages');
    } else if (variant === 'todo') {
      classes.push('todo-container');
    }
    
    if (autoHide) {
      classes.push('custom-scrollable-autohide');
    }
    
    if (direction === 'horizontal') {
      classes.push('custom-scrollable-horizontal');
    } else if (direction === 'both') {
      classes.push('custom-scrollable-both');
    }

    if (smoothScroll) {
      classes.push('custom-scrollable-smooth');
    }
    
    return classes.join(' ');
  };

  // Combine styles
  const combinedStyle = {
    ...style,
    ...(maxHeight && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
    ...(direction === 'horizontal' && { overflowX: 'auto', overflowY: 'hidden' }),
    ...(direction === 'vertical' && { overflowY: 'auto', overflowX: 'hidden' }),
    ...(direction === 'both' && { overflow: 'auto' }),
  };

  return (
    <>
      <div
        ref={ref}
        className={`${getScrollbarClasses()} ${className}`.trim()}
        style={combinedStyle}
        {...props}
      >
        {children}
      </div>
      
      <style jsx>{`
        /* Base scrollbar styling */
        .custom-scrollable {
          scrollbar-width: thin;
          scrollbar-color: var(--theme-primary)60 var(--card-secondary);
        }

        .custom-scrollable::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollable::-webkit-scrollbar-track {
          background: var(--card-secondary);
          border-radius: 4px;
          border: 1px solid var(--glass-border);
        }

        .custom-scrollable::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, var(--theme-primary)70, var(--theme-secondary)70);
          border-radius: 4px;
          border: 1px solid var(--glass-border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .custom-scrollable::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: scale(1.05);
        }

        .custom-scrollable::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, var(--theme-secondary), var(--theme-primary));
        }

        /* Smooth scrolling behavior with performance optimizations */
        .custom-scrollable-smooth {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          transform: translateZ(0);
          will-change: scroll-position;
          contain: layout style paint;
        }

        /* Performance optimizations for scroll containers */
        .custom-scrollable {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Momentum scrolling for iOS */
        .custom-scrollable {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        /* Thin scrollbar variant */
        .custom-scrollable-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .custom-scrollable-thin::-webkit-scrollbar-track {
          background: var(--card-secondary);
          border-radius: 2px;
        }
        
        .custom-scrollable-thin::-webkit-scrollbar-thumb {
          background: var(--theme-primary)40;
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        
        .custom-scrollable-thin::-webkit-scrollbar-thumb:hover {
          background: var(--theme-primary)60;
        }

        /* Leaderboard unified container - single scroll WITHOUT visible scrollbar */
        .leaderboard-unified-container {
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch; /* Enable momentum scrolling on iOS */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .leaderboard-unified-container::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        /* Ensure smooth touch scrolling */
        .leaderboard-unified-container {
          overscroll-behavior: contain;
          scroll-behavior: smooth;
        }

        /* Todo container styling */
        .todo-container::-webkit-scrollbar {
          width: 6px;
        }

        .todo-container::-webkit-scrollbar-track {
          background: var(--card-secondary);
          border-radius: 3px;
        }

        .todo-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, var(--theme-primary)60, var(--theme-secondary)60);
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .todo-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, var(--theme-primary)80, var(--theme-secondary)80);
        }
        
        /* Auto-hide scrollbar variant */
        .custom-scrollable-autohide::-webkit-scrollbar {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .custom-scrollable-autohide:hover::-webkit-scrollbar {
          opacity: 1;
        }
        
        /* Horizontal scrollbar styling */
        .custom-scrollable-horizontal::-webkit-scrollbar:horizontal {
          height: 8px;
        }
        
        .custom-scrollable-horizontal::-webkit-scrollbar-track:horizontal {
          background: var(--card-secondary);
          border-radius: 4px;
        }
        
        .custom-scrollable-horizontal::-webkit-scrollbar-thumb:horizontal {
          background: linear-gradient(90deg, var(--theme-primary)60, var(--theme-secondary)60);
          border-radius: 4px;
          border: 1px solid var(--glass-border);
        }
        
        /* Both directions scrollbar */
        .custom-scrollable-both::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollable-both::-webkit-scrollbar-corner {
          background: var(--card-secondary);
          border-radius: 4px;
        }
        
        /* Theme-specific enhancements for custom scrollbar */
        :global(.dark) .custom-scrollable::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
        }
        
        :global(.dark-blue) .custom-scrollable::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.2);
        }
        
        :global(.pink) .custom-scrollable::-webkit-scrollbar-track {
          background: rgba(252, 231, 243, 0.8);
        }
        
        :global(.yellow) .custom-scrollable::-webkit-scrollbar-track {
          background: rgba(254, 243, 199, 0.8);
        }
        
        :global(.green) .custom-scrollable::-webkit-scrollbar-track {
          background: rgba(220, 252, 231, 0.8);
        }
        
        /* Responsive scrollbar sizing */
        @media (min-width: 1200px) {
          .custom-scrollable::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .leaderboard-unified-container::-webkit-scrollbar {
            width: 8px;
          }
          
          .todo-container::-webkit-scrollbar {
            width: 6px;
          }
        }

        @media (min-width: 769px) and (max-width: 1199px) {
          .custom-scrollable::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          .leaderboard-unified-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .todo-container::-webkit-scrollbar {
            width: 5px;
          }
        }

        @media (max-width: 768px) {
          .custom-scrollable::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          
          .custom-scrollable-thin::-webkit-scrollbar {
            width: 3px;
            height: 3px;
          }
          
          .leaderboard-unified-container::-webkit-scrollbar {
            width: 4px;
          }
          
          .todo-container::-webkit-scrollbar {
            width: 4px;
          }

          /* Auto-hide on mobile for cleaner look */
          .custom-scrollable::-webkit-scrollbar {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .custom-scrollable:hover::-webkit-scrollbar,
          .custom-scrollable:focus-within::-webkit-scrollbar {
            opacity: 1;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .custom-scrollable::-webkit-scrollbar-thumb {
            background: var(--primary) !important;
            border: 2px solid var(--bg) !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .custom-scrollable::-webkit-scrollbar-thumb {
            transition: none !important;
          }
          
          .custom-scrollable-autohide::-webkit-scrollbar {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
});

CustomScrollbar.displayName = 'CustomScrollbar';

export default CustomScrollbar;