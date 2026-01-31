import { useEffect, useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * Enhanced ConfirmationDialog that automatically integrates user music preferences
 */
export default function EnhancedConfirmationDialog(props) {
  const [userMusicPreference, setUserMusicPreference] = useState('music1.mp3');

  // Fetch user music preference
  useEffect(() => {
    const fetchUserPreference = async () => {
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        
        if (response.ok && data.user?.preferences?.notificationMusic) {
          setUserMusicPreference(data.user.preferences.notificationMusic);
        }
      } catch (error) {
        console.warn('Could not fetch user music preference:', error);
        // Keep default music1.mp3
      }
    };

    // Only fetch if dialog is open to avoid unnecessary requests
    if (props.isOpen) {
      fetchUserPreference();
    }
  }, [props.isOpen]);

  return (
    <ConfirmationDialog
      {...props}
      userMusicPreference={userMusicPreference}
      playNotificationSound={true}
    />
  );
}