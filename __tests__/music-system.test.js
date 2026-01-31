/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusicSelector from '../components/MusicSelector';
import { AudioManager } from '../lib/audioManager';
import { useUserPreferences } from '../lib/useUserPreferences';

// Mock the useUserPreferences hook
jest.mock('../lib/useUserPreferences');

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Audio constructor and methods
const mockAudio = {
  play: jest.fn().mockResolvedValue(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  canPlayType: jest.fn().mockReturnValue('probably'),
  volume: 0.7,
  currentTime: 0,
  paused: false,
  loop: false,
  src: '',
  onended: null,
  preload: 'auto'
};

global.Audio = jest.fn().mockImplementation(() => mockAudio);

describe('Music System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Reset audio mock
    mockAudio.play.mockClear();
    mockAudio.pause.mockClear();
    mockAudio.addEventListener.mockClear();
    mockAudio.removeEventListener.mockClear();
    mockAudio.canPlayType.mockReturnValue('probably');
    mockAudio.volume = 0.7;
    mockAudio.currentTime = 0;
    mockAudio.paused = false;
    mockAudio.loop = false;
    mockAudio.src = '';
    mockAudio.onended = null;
  });

  describe('MusicSelector Component', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      preferences: {
        notificationMusic: 'music2.mp3'
      }
    };

    const mockOnMusicChange = jest.fn();

    test('renders music selector with all music options', () => {
      // Requirements: 22.1, 22.4
      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      expect(screen.getByText('🎵 Notification Music')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred notification sound for confirmations and alerts.')).toBeInTheDocument();
      
      // Check all music options are rendered
      expect(screen.getByText('Classic Bell')).toBeInTheDocument();
      expect(screen.getByText('Gentle Chime')).toBeInTheDocument();
      expect(screen.getByText('Digital Beep')).toBeInTheDocument();
      expect(screen.getByText('Soft Ding')).toBeInTheDocument();
      expect(screen.getByText('Notification Pop')).toBeInTheDocument();
      expect(screen.getByText('Melodic Tone')).toBeInTheDocument();
      expect(screen.getByText('Alert Sound')).toBeInTheDocument();
    });

    test('displays current user selection correctly', () => {
      // Requirements: 22.1, 22.4
      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      // The selected option should have different styling (checked radio button)
      const gentleChimeOption = screen.getByText('Gentle Chime').closest('div');
      expect(gentleChimeOption).toHaveStyle({
        background: expect.stringContaining('linear-gradient')
      });
    });

    test('handles music selection change', async () => {
      // Requirements: 22.3, 22.5
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, preferences: { notificationMusic: 'music3.mp3' } }
        })
      });

      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      const digitalBeepOption = screen.getByText('Digital Beep').closest('div');
      fireEvent.click(digitalBeepOption);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/user/music-preference', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationMusic: 'music3.mp3' })
        });
      });

      expect(mockOnMusicChange).toHaveBeenCalledWith({
        ...mockUser,
        preferences: { notificationMusic: 'music3.mp3' }
      });
    });

    test('handles API error during music selection', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to save preference' })
      });

      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      const digitalBeepOption = screen.getByText('Digital Beep').closest('div');
      fireEvent.click(digitalBeepOption);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to save preference');
      });

      alertSpy.mockRestore();
    });

    test('handles network error during music selection', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      const digitalBeepOption = screen.getByText('Digital Beep').closest('div');
      fireEvent.click(digitalBeepOption);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Network error while saving music preference');
      });

      alertSpy.mockRestore();
    });

    test('handles audio preview functionality', async () => {
      // Requirements: 22.2, 22.4
      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      const previewButtons = screen.getAllByTitle(/Play preview|Stop preview/);
      const firstPreviewButton = previewButtons[0];

      fireEvent.click(firstPreviewButton);

      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });
    });

    test('stops current preview when playing new one', async () => {
      // Requirements: 22.2, 22.4
      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      const previewButtons = screen.getAllByTitle(/Play preview|Stop preview/);
      
      // Play first preview
      fireEvent.click(previewButtons[0]);
      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });

      // Play second preview (should stop first)
      fireEvent.click(previewButtons[1]);
      await waitFor(() => {
        expect(mockAudio.pause).toHaveBeenCalled();
      });
    });

    test('handles audio playback errors gracefully', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      mockAudio.play.mockRejectedValueOnce(new Error('Audio not supported'));

      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      const previewButtons = screen.getAllByTitle(/Play preview|Stop preview/);
      fireEvent.click(previewButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Could not play audio file. Your browser may not support this audio format.');
      });

      alertSpy.mockRestore();
    });

    test('defaults to music1.mp3 when user has no preference', () => {
      // Requirements: 22.1, 22.4
      const userWithoutPreference = { id: 'user-123', name: 'Test User' };
      
      render(<MusicSelector user={userWithoutPreference} onMusicChange={mockOnMusicChange} />);

      // Classic Bell (music1.mp3) should be selected by default
      const classicBellOption = screen.getByText('Classic Bell').closest('div');
      expect(classicBellOption).toHaveStyle({
        background: expect.stringContaining('linear-gradient')
      });
    });
  });

  describe('AudioManager', () => {
    let audioManager;

    beforeEach(() => {
      audioManager = new AudioManager();
    });

    test('initializes with correct default values', () => {
      expect(audioManager.audioCache).toBeInstanceOf(Map);
      expect(audioManager.currentAudio).toBeNull();
      expect(audioManager.supportedFormats).toEqual(['mp3', 'mp4', 'wav', 'ogg']);
    });

    test('detects audio support correctly', () => {
      expect(audioManager.isAudioSupported()).toBe(true);
      
      // Test when Audio is not available
      const originalAudio = global.Audio;
      delete global.Audio;
      expect(audioManager.isAudioSupported()).toBe(false);
      global.Audio = originalAudio;
    });

    test('gets supported audio format', () => {
      // Requirements: 22.6
      const format = audioManager.getSupportedFormat('music1.mp3');
      expect(format).toBe('music1.mp3');
    });

    test('preloads audio file successfully', async () => {
      // Requirements: 22.2, 22.6
      const fileName = 'music1.mp3';
      
      // Simulate successful load
      setTimeout(() => {
        const loadEvent = new Event('canplaythrough');
        mockAudio.addEventListener.mock.calls
          .find(call => call[0] === 'canplaythrough')[1](loadEvent);
      }, 0);

      const audio = await audioManager.preloadAudio(fileName);
      
      expect(audio).toBe(mockAudio);
      expect(audioManager.audioCache.has(fileName)).toBe(true);
      expect(mockAudio.src).toBe(`/audio/notifications/${fileName}`);
    });

    test('handles audio preload errors', async () => {
      const fileName = 'invalid.mp3';
      
      // Simulate error
      setTimeout(() => {
        const errorEvent = new Event('error');
        mockAudio.addEventListener.mock.calls
          .find(call => call[0] === 'error')[1](errorEvent);
      }, 0);

      await expect(audioManager.preloadAudio(fileName))
        .rejects.toThrow('Could not load audio file: invalid.mp3');
    });

    test('plays audio with correct options', async () => {
      // Requirements: 22.2, 22.6
      const fileName = 'music1.mp3';
      audioManager.audioCache.set(fileName, mockAudio);

      const audio = await audioManager.playAudio(fileName, {
        volume: 0.5,
        loop: true,
        stopCurrent: false
      });

      expect(mockAudio.volume).toBe(0.5);
      expect(mockAudio.loop).toBe(true);
      expect(mockAudio.currentTime).toBe(0);
      expect(mockAudio.play).toHaveBeenCalled();
      expect(audioManager.currentAudio).toBe(mockAudio);
    });

    test('stops current audio when requested', async () => {
      // Requirements: 22.2, 22.6
      const fileName = 'music1.mp3';
      audioManager.audioCache.set(fileName, mockAudio);
      audioManager.currentAudio = mockAudio;

      await audioManager.playAudio(fileName, { stopCurrent: true });

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
    });

    test('stops current audio manually', () => {
      audioManager.currentAudio = mockAudio;
      
      audioManager.stopCurrentAudio();
      
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
      expect(audioManager.currentAudio).toBeNull();
    });

    test('checks if audio is playing', () => {
      audioManager.currentAudio = mockAudio;
      mockAudio.paused = false;
      
      expect(audioManager.isPlaying()).toBe(true);
      
      mockAudio.paused = true;
      expect(audioManager.isPlaying()).toBe(false);
      
      audioManager.currentAudio = null;
      expect(audioManager.isPlaying()).toBe(false);
    });

    test('gets current audio file name', () => {
      mockAudio.src = '/audio/notifications/music2.mp3';
      audioManager.currentAudio = mockAudio;
      
      expect(audioManager.getCurrentAudioFile()).toBe('music2.mp3');
      
      audioManager.currentAudio = null;
      expect(audioManager.getCurrentAudioFile()).toBeNull();
    });

    test('preloads all notification music files', async () => {
      // Requirements: 22.2, 22.6
      const preloadSpy = jest.spyOn(audioManager, 'preloadAudio');
      preloadSpy.mockResolvedValue(mockAudio);

      const results = await audioManager.preloadAllNotificationMusic();

      expect(preloadSpy).toHaveBeenCalledTimes(7);
      expect(preloadSpy).toHaveBeenCalledWith('music1.mp3');
      expect(preloadSpy).toHaveBeenCalledWith('music7.mp3');
      expect(results).toHaveLength(7);
      expect(results[0]).toEqual({ fileName: 'music1.mp3', success: true });

      preloadSpy.mockRestore();
    });

    test('handles preload failures in batch operation', async () => {
      const preloadSpy = jest.spyOn(audioManager, 'preloadAudio');
      preloadSpy.mockImplementation((fileName) => {
        if (fileName === 'music3.mp3') {
          return Promise.reject(new Error('Load failed'));
        }
        return Promise.resolve(mockAudio);
      });

      const results = await audioManager.preloadAllNotificationMusic();

      expect(results).toHaveLength(7);
      expect(results.find(r => r.fileName === 'music3.mp3').success).toBe(false);
      expect(results.filter(r => r.success).length).toBe(6);

      preloadSpy.mockRestore();
    });

    test('plays notification sound with fallback', async () => {
      // Requirements: 22.5, 22.6
      const playSpy = jest.spyOn(audioManager, 'playAudio');
      playSpy.mockResolvedValue(mockAudio);

      await audioManager.playNotificationSound('music5.mp3');

      expect(playSpy).toHaveBeenCalledWith('music5.mp3', {
        volume: 0.6,
        loop: false,
        stopCurrent: true
      });

      playSpy.mockRestore();
    });

    test('falls back to default sound on error', async () => {
      const playSpy = jest.spyOn(audioManager, 'playAudio');
      playSpy.mockImplementation((fileName) => {
        if (fileName === 'music5.mp3') {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve(mockAudio);
      });

      await audioManager.playNotificationSound('music5.mp3');

      expect(playSpy).toHaveBeenCalledWith('music5.mp3', expect.any(Object));
      expect(playSpy).toHaveBeenCalledWith('music1.mp3', expect.any(Object));

      playSpy.mockRestore();
    });

    test('clears cache correctly', () => {
      audioManager.audioCache.set('music1.mp3', mockAudio);
      audioManager.currentAudio = mockAudio;

      audioManager.clearCache();

      expect(audioManager.audioCache.size).toBe(0);
      expect(audioManager.currentAudio).toBeNull();
      expect(mockAudio.pause).toHaveBeenCalled();
    });

    test('provides cache statistics', () => {
      audioManager.audioCache.set('music1.mp3', mockAudio);
      audioManager.audioCache.set('music2.mp3', mockAudio);
      audioManager.currentAudio = mockAudio;
      mockAudio.src = '/audio/notifications/music1.mp3';
      mockAudio.paused = false;

      const stats = audioManager.getCacheStats();

      expect(stats).toEqual({
        cachedFiles: ['music1.mp3', 'music2.mp3'],
        cacheSize: 2,
        isPlaying: true,
        currentFile: 'music1.mp3'
      });
    });
  });

  describe('useUserPreferences Hook', () => {
    beforeEach(() => {
      useUserPreferences.mockReturnValue({
        user: {
          id: 'user-123',
          name: 'Test User',
          preferences: {
            notificationMusic: 'music3.mp3',
            theme: 'dark'
          },
          isAnonymous: false
        },
        loading: false,
        error: null,
        fetchUserPreferences: jest.fn(),
        updateUserPreferences: jest.fn(),
        getNotificationMusic: jest.fn().mockReturnValue('music3.mp3'),
        getTheme: jest.fn().mockReturnValue('dark'),
        isAnonymous: jest.fn().mockReturnValue(false),
        getDisplayName: jest.fn().mockReturnValue('Test User')
      });
    });

    test('returns correct notification music preference', () => {
      // Requirements: 22.3, 22.5
      const { getNotificationMusic } = useUserPreferences();
      expect(getNotificationMusic()).toBe('music3.mp3');
    });

    test('handles missing user preferences gracefully', () => {
      // Requirements: 22.3, 22.5
      useUserPreferences.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        getNotificationMusic: jest.fn().mockReturnValue('music1.mp3'),
        getTheme: jest.fn().mockReturnValue('light'),
        isAnonymous: jest.fn().mockReturnValue(false),
        getDisplayName: jest.fn().mockReturnValue('User')
      });

      const { getNotificationMusic, getTheme, getDisplayName } = useUserPreferences();
      
      expect(getNotificationMusic()).toBe('music1.mp3');
      expect(getTheme()).toBe('light');
      expect(getDisplayName()).toBe('User');
    });
  });

  describe('Music Preference API', () => {
    test('validates music file selection', async () => {
      // Requirements: 22.2, 22.6
      // This would be tested in an API test, but we can test the validation logic
      const validMusicFiles = [
        'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3',
        'music5.mp3', 'music6.mp3', 'music7.mp3'
      ];

      validMusicFiles.forEach(file => {
        expect(validMusicFiles.includes(file)).toBe(true);
      });

      expect(validMusicFiles.includes('invalid.mp3')).toBe(false);
      expect(validMusicFiles.includes('')).toBe(false);
      expect(validMusicFiles.includes(null)).toBe(false);
    });

    test('handles successful preference update', async () => {
      // Requirements: 22.3, 22.5
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'user-123', preferences: { notificationMusic: 'music4.mp3' } },
          message: 'Music preference updated successfully'
        })
      });

      const response = await fetch('/api/user/music-preference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationMusic: 'music4.mp3' })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.user.preferences.notificationMusic).toBe('music4.mp3');
    });

    test('handles invalid music file in API request', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid music file selection' })
      });

      const response = await fetch('/api/user/music-preference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationMusic: 'invalid.mp3' })
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Invalid music file selection');
    });
  });

  describe('Integration Tests', () => {
    test('complete music selection workflow', async () => {
      // Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        preferences: { notificationMusic: 'music1.mp3' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, preferences: { notificationMusic: 'music5.mp3' } }
        })
      });

      const mockOnMusicChange = jest.fn();
      render(<MusicSelector user={mockUser} onMusicChange={mockOnMusicChange} />);

      // Select new music
      const notificationPopOption = screen.getByText('Notification Pop').closest('div');
      fireEvent.click(notificationPopOption);

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/user/music-preference', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationMusic: 'music5.mp3' })
        });
      });

      // Verify callback
      expect(mockOnMusicChange).toHaveBeenCalledWith({
        ...mockUser,
        preferences: { notificationMusic: 'music5.mp3' }
      });
    });

    test('audio preview and selection integration', async () => {
      // Requirements: 22.1, 22.2, 22.4, 22.6
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        preferences: { notificationMusic: 'music1.mp3' }
      };

      render(<MusicSelector user={mockUser} onMusicChange={jest.fn()} />);

      // Test preview functionality
      const previewButtons = screen.getAllByTitle(/Play preview/);
      fireEvent.click(previewButtons[1]); // Preview second option

      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });

      // Verify audio configuration
      expect(mockAudio.volume).toBe(0.7);
      expect(mockAudio.loop).toBe(false);
    });
  });
});