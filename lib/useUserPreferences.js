import { useState, useEffect } from 'react';

/**
 * Custom hook to manage user preferences including notification music
 */
export function useUserPreferences() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data and preferences
  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/me');
      const data = await response.json();
      
      if (response.ok && data.user) {
        setUser(data.user);
      } else {
        setError('Failed to fetch user preferences');
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError('Network error while fetching preferences');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update user preferences
  const updateUserPreferences = (updatedUser) => {
    setUser(updatedUser);
  };

  // Get notification music preference with fallback
  const getNotificationMusic = () => {
    return user?.preferences?.notificationMusic || 'music1.mp3';
  };

  // Get theme preference with fallback
  const getTheme = () => {
    return user?.preferences?.theme || 'light';
  };

  // Check if user is anonymous
  const isAnonymous = () => {
    return user?.isAnonymous || false;
  };

  // Get display name (anonymous or real name)
  const getDisplayName = () => {
    if (isAnonymous()) {
      return user?.anonymousName || 'Anonymous User';
    }
    return user?.name || 'User';
  };

  // Initialize preferences on mount
  useEffect(() => {
    fetchUserPreferences();
  }, []);

  return {
    user,
    loading,
    error,
    fetchUserPreferences,
    updateUserPreferences,
    getNotificationMusic,
    getTheme,
    isAnonymous,
    getDisplayName
  };
}

/**
 * Higher-order component to provide user preferences to any component
 */
export function withUserPreferences(WrappedComponent) {
  return function WithUserPreferencesComponent(props) {
    const userPreferences = useUserPreferences();
    
    return (
      <WrappedComponent 
        {...props} 
        userPreferences={userPreferences}
      />
    );
  };
}

/**
 * Context provider for user preferences (optional, for complex apps)
 */
import { createContext, useContext } from 'react';

const UserPreferencesContext = createContext(null);

export function UserPreferencesProvider({ children }) {
  const userPreferences = useUserPreferences();
  
  return (
    <UserPreferencesContext.Provider value={userPreferences}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferencesContext() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferencesContext must be used within a UserPreferencesProvider');
  }
  return context;
}

export default useUserPreferences;