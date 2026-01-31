import CustomScrollbar from './CustomScrollbar';
import Leaderboard from './Leaderboard';

/**
 * Example component demonstrating the theme-aware scrollbar and enhanced leaderboard
 */
export default function ScrollbarExample() {
  // Mock data for demonstration
  const mockUsers = [
    {
      id: '1',
      name: 'Alice Johnson',
      points: 250,
      streak: 8,
      onlineStatus: 'online',
      avatar: null,
      isAnonymous: false
    },
    {
      id: '2',
      name: 'Bob Smith',
      points: 220,
      streak: 6,
      onlineStatus: 'away',
      avatar: null,
      isAnonymous: false
    },
    {
      id: '3',
      name: 'Charlie Brown',
      points: 180,
      streak: 4,
      onlineStatus: 'online',
      avatar: null,
      isAnonymous: false
    },
    {
      id: '4',
      name: 'Anonymous User',
      points: 150,
      streak: 3,
      onlineStatus: 'offline',
      avatar: null,
      isAnonymous: true,
      anonymousName: 'Mystery Student'
    },
    {
      id: '5',
      name: 'Eva Davis',
      points: 120,
      streak: 2,
      onlineStatus: 'online',
      avatar: null,
      isAnonymous: false
    },
    {
      id: '6',
      name: 'Frank Wilson',
      points: 90,
      streak: 1,
      onlineStatus: 'offline',
      avatar: null,
      isAnonymous: false
    },
    {
      id: '7',
      name: 'Grace Lee',
      points: 75,
      streak: 5,
      onlineStatus: 'away',
      avatar: null,
      isAnonymous: false
    },
    {
      id: '8',
      name: 'Henry Taylor',
      points: 60,
      streak: 2,
      onlineStatus: 'online',
      avatar: null,
      isAnonymous: false
    }
  ];

  const currentUser = {
    id: '1',
    name: 'Alice Johnson'
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    }}>
      {/* Enhanced Leaderboard Example */}
      <div className="card">
        <h3 style={{ 
          marginBottom: '16px', 
          color: 'var(--primary)',
          background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Enhanced Leaderboard
        </h3>
        <Leaderboard 
          users={mockUsers} 
          me={currentUser}
          maxHeight="400px"
          className="example-leaderboard"
        />
      </div>

      {/* Custom Scrollbar Examples */}
      <div className="card">
        <h3 style={{ 
          marginBottom: '16px', 
          color: 'var(--primary)',
          background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Custom Scrollbar Variants
        </h3>
        
        {/* Default Scrollbar */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '8px' }}>
            Default Scrollbar
          </h4>
          <CustomScrollbar maxHeight="120px" className="example-scroll">
            <div style={{ padding: '12px', color: 'var(--primary)' }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid var(--glass-border)' 
                }}>
                  Content item {i + 1} - This is a longer line of text to demonstrate scrolling behavior
                </div>
              ))}
            </div>
          </CustomScrollbar>
        </div>

        {/* Thin Scrollbar */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '8px' }}>
            Thin Scrollbar
          </h4>
          <CustomScrollbar variant="thin" maxHeight="120px" className="example-scroll">
            <div style={{ padding: '12px', color: 'var(--primary)' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ 
                  padding: '6px 0', 
                  borderBottom: '1px solid var(--glass-border)' 
                }}>
                  Thin scrollbar item {i + 1}
                </div>
              ))}
            </div>
          </CustomScrollbar>
        </div>

        {/* Auto-hide Scrollbar */}
        <div>
          <h4 style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '8px' }}>
            Auto-hide Scrollbar (hover to see)
          </h4>
          <CustomScrollbar variant="thin" autoHide maxHeight="120px" className="example-scroll">
            <div style={{ padding: '12px', color: 'var(--primary)' }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid var(--glass-border)' 
                }}>
                  Auto-hide item {i + 1} - Hover over this area to see the scrollbar
                </div>
              ))}
            </div>
          </CustomScrollbar>
        </div>
      </div>

      {/* Horizontal Scrollbar Example */}
      <div className="card">
        <h3 style={{ 
          marginBottom: '16px', 
          color: 'var(--primary)',
          background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Horizontal Scrollbar
        </h3>
        <CustomScrollbar direction="horizontal" className="example-scroll">
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            padding: '12px',
            minWidth: '800px' 
          }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                minWidth: '120px',
                padding: '16px',
                background: 'var(--card-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                color: 'var(--primary)',
                textAlign: 'center'
              }}>
                Card {i + 1}
              </div>
            ))}
          </div>
        </CustomScrollbar>
      </div>

      {/* Theme Information */}
      <div className="card">
        <h3 style={{ 
          marginBottom: '16px', 
          color: 'var(--primary)',
          background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Theme-Aware Features
        </h3>
        <div style={{ color: 'var(--primary)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '12px' }}>
            ✨ <strong>Automatic Theme Adaptation:</strong> Scrollbars and leaderboard styling automatically adapt to the current theme (Light, Dark, Dark Blue, Pink, Yellow, Green).
          </p>
          <p style={{ marginBottom: '12px' }}>
            🎨 <strong>Enhanced Visual Design:</strong> Modern glass-morphism effects, smooth animations, and consistent styling across all components.
          </p>
          <p style={{ marginBottom: '12px' }}>
            📱 <strong>Responsive Design:</strong> Optimized for both desktop and mobile devices with appropriate sizing and touch targets.
          </p>
          <p style={{ marginBottom: '12px' }}>
            ♿ <strong>Accessibility Support:</strong> High contrast mode support, reduced motion preferences, and proper focus management.
          </p>
          <p>
            🔧 <strong>Modular Components:</strong> Reusable CustomScrollbar component with multiple variants and the enhanced Leaderboard with theme-aware styling.
          </p>
        </div>
      </div>
    </div>
  );
}