import { useState, useEffect, useRef } from 'react';
import audioManager from '../lib/audioManager';

export default function MusicSelector({ user, onMusicChange }) {
  const [selectedMusic, setSelectedMusic] = useState(user?.preferences?.notificationMusic || 'music1.mp3');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const audioRef = useRef(null);

  const musicOptions = [
    { value: 'music1.mp3', label: 'Classic Bell' },
    { value: 'music2.mp3', label: 'Gentle Chime' },
    { value: 'music3.mp3', label: 'Digital Beep' },
    { value: 'music4.mp3', label: 'Soft Ding' },
    { value: 'music5.mp3', label: 'Notification Pop' },
    { value: 'music6.mp3', label: 'Melodic Tone' },
    { value: 'music7.mp3', label: 'Alert Sound' }
  ];

  useEffect(() => {
    // Update selected music when user prop changes
    if (user?.preferences?.notificationMusic) {
      setSelectedMusic(user.preferences.notificationMusic);
    }
  }, [user]);

  useEffect(() => {
    // Preload notification music files for better performance
    audioManager.preloadAllNotificationMusic().then((results) => {
      const failedLoads = results.filter(result => !result.success);
      if (failedLoads.length > 0) {
        console.warn('Some audio files failed to preload:', failedLoads);
      }
    });

    // Cleanup audio when component unmounts
    return () => {
      audioManager.stopCurrentAudio();
    };
  }, []);

  const handleMusicChange = async (musicFile) => {
    setSelectedMusic(musicFile);
    
    try {
      const res = await fetch('/api/user/music-preference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationMusic: musicFile })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (onMusicChange) {
          onMusicChange(data.user);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save music preference');
        // Revert selection on error
        setSelectedMusic(user?.preferences?.notificationMusic || 'music1.mp3');
      }
    } catch (error) {
      console.error('Error saving music preference:', error);
      alert('Network error while saving music preference');
      // Revert selection on error
      setSelectedMusic(user?.preferences?.notificationMusic || 'music1.mp3');
    }
  };

  const handlePreview = async (musicFile) => {
    // Stop current preview if playing
    if (isPlaying && currentPreview === musicFile) {
      audioManager.stopCurrentAudio();
      setIsPlaying(false);
      setCurrentPreview(null);
      return;
    }

    try {
      setCurrentPreview(musicFile);
      setIsPlaying(true);

      // Play audio using audio manager
      const audio = await audioManager.playAudio(musicFile, {
        volume: 0.7,
        loop: false,
        stopCurrent: true
      });

      // Handle audio end event
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPreview(null);
      };

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentPreview(null);
      
      // Show user-friendly error message
      if (error.message.includes('not supported')) {
        alert('Audio playback is not supported in your browser.');
      } else if (error.message.includes('Could not load')) {
        alert('Could not load the audio file. Please check if the file exists.');
      } else {
        alert('Could not play audio file. Your browser may not support this audio format.');
      }
    }
  };

  return (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      background: 'var(--card-secondary)',
      borderRadius: '16px',
      border: '1px solid var(--glass-border)'
    }}>
      <h4 style={{
        marginTop: 0,
        marginBottom: '16px',
        background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-primary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '18px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🎵 Notification Music
      </h4>
      
      <div style={{
        fontSize: '14px',
        color: 'var(--muted)',
        marginBottom: '16px',
        lineHeight: '1.4'
      }}>
        Choose your preferred notification sound for confirmations and alerts.
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {musicOptions.map((option) => (
          <div
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: selectedMusic === option.value 
                ? 'linear-gradient(135deg, var(--theme-primary)15, var(--theme-secondary)15)'
                : 'var(--glass)',
              border: `1px solid ${selectedMusic === option.value 
                ? 'var(--theme-primary)40' 
                : 'var(--glass-border)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onClick={() => handleMusicChange(option.value)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Radio button indicator */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${selectedMusic === option.value 
                  ? 'var(--theme-primary)' 
                  : 'var(--muted)'}`,
                background: selectedMusic === option.value 
                  ? 'var(--theme-primary)' 
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                {selectedMusic === option.value && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white'
                  }} />
                )}
              </div>
              
              {/* Music name */}
              <span style={{
                fontWeight: selectedMusic === option.value ? '600' : '500',
                color: selectedMusic === option.value 
                  ? 'var(--theme-primary)' 
                  : 'var(--primary)',
                fontSize: '14px'
              }}>
                {option.label}
              </span>
            </div>

            {/* Preview button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(option.value);
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: isPlaying && currentPreview === option.value
                  ? 'linear-gradient(135deg, var(--theme-accent), var(--theme-primary))'
                  : 'var(--glass)',
                color: isPlaying && currentPreview === option.value
                  ? 'white'
                  : 'var(--primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: isPlaying && currentPreview === option.value
                  ? '0 4px 12px var(--theme-primary)30'
                  : 'none'
              }}
              title={isPlaying && currentPreview === option.value ? 'Stop preview' : 'Play preview'}
            >
              {isPlaying && currentPreview === option.value ? '⏹️' : '▶️'}
            </button>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: 'var(--muted)',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        Click on any option to select it, or use the play button to preview the sound.
      </div>

      <style jsx>{`
        /* Responsive design for mobile */
        @media (max-width: 768px) {
          div[style*="display: flex"][style*="justify-content: space-between"] {
            padding: 14px 16px !important;
          }
          
          div[style*="display: flex"][style*="gap: 12px"] span {
            font-size: 15px !important;
          }
          
          button[style*="width: 36px"] {
            width: 40px !important;
            height: 40px !important;
            font-size: 16px !important;
          }
        }
        
        @media (max-width: 600px) {
          div[style*="padding: 20px"] {
            padding: 16px !important;
          }
          
          h4 {
            font-size: 16px !important;
          }
          
          div[style*="display: flex"][style*="justify-content: space-between"] {
            padding: 12px 14px !important;
          }
          
          div[style*="display: flex"][style*="gap: 12px"] {
            gap: 10px !important;
          }
          
          div[style*="display: flex"][style*="gap: 12px"] span {
            font-size: 14px !important;
          }
          
          button[style*="width: 36px"] {
            width: 38px !important;
            height: 38px !important;
            font-size: 15px !important;
          }
        }
        
        @media (max-width: 480px) {
          div[style*="padding: 20px"] {
            padding: 14px !important;
            border-radius: 12px !important;
          }
          
          h4 {
            font-size: 15px !important;
            margin-bottom: 12px !important;
          }
          
          div[style*="margin-bottom: 16px"] {
            margin-bottom: 12px !important;
            font-size: 13px !important;
          }
          
          div[style*="display: flex"][style*="justify-content: space-between"] {
            padding: 10px 12px !important;
            border-radius: 10px !important;
          }
          
          div[style*="width: 20px"][style*="height: 20px"] {
            width: 18px !important;
            height: 18px !important;
          }
          
          div[style*="width: 8px"][style*="height: 8px"] {
            width: 6px !important;
            height: 6px !important;
          }
          
          div[style*="display: flex"][style*="gap: 12px"] {
            gap: 8px !important;
          }
          
          div[style*="display: flex"][style*="gap: 12px"] span {
            font-size: 13px !important;
          }
          
          button[style*="width: 36px"] {
            width: 34px !important;
            height: 34px !important;
            font-size: 14px !important;
            border-radius: 6px !important;
          }
          
          div[style*="margin-top: 12px"] {
            margin-top: 10px !important;
            font-size: 11px !important;
          }
        }
        
        /* Touch-specific optimizations */
        @media (hover: none) and (pointer: coarse) {
          div[style*="cursor: pointer"]:active {
            transform: scale(0.98) !important;
            transition: transform 0.1s ease !important;
          }
          
          button:active {
            transform: scale(0.9) !important;
            transition: transform 0.1s ease !important;
          }
        }
        
        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          button {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
        }
      `}</style>
    </div>
  );
}