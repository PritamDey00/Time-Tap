/**
 * Audio Manager for handling notification music files
 * Supports both MP3 and MP4 audio formats
 */

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.currentAudio = null;
    this.supportedFormats = ['mp3', 'mp4', 'wav', 'ogg'];
  }

  /**
   * Check if the browser supports audio playback
   */
  isAudioSupported() {
    return typeof Audio !== 'undefined';
  }

  /**
   * Get the supported audio format for the current browser
   */
  getSupportedFormat(baseFileName) {
    if (!this.isAudioSupported()) {
      return null;
    }

    const audio = new Audio();
    const formats = [
      { ext: 'mp3', mime: 'audio/mpeg' },
      { ext: 'mp4', mime: 'audio/mp4' },
      { ext: 'wav', mime: 'audio/wav' },
      { ext: 'ogg', mime: 'audio/ogg' }
    ];

    // Try to find a supported format
    for (const format of formats) {
      const canPlay = audio.canPlayType(format.mime);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        // Check if file exists with this extension
        const fileName = baseFileName.replace(/\.[^/.]+$/, '') + '.' + format.ext;
        return fileName;
      }
    }

    // Default to mp3 if no specific support detected
    return baseFileName;
  }

  /**
   * Preload an audio file into cache
   */
  async preloadAudio(fileName) {
    if (!this.isAudioSupported()) {
      throw new Error('Audio not supported in this browser');
    }

    if (this.audioCache.has(fileName)) {
      return this.audioCache.get(fileName);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const audioPath = `/audio/notifications/${fileName}`;
      
      audio.addEventListener('canplaythrough', () => {
        this.audioCache.set(fileName, audio);
        resolve(audio);
      });

      audio.addEventListener('error', (e) => {
        console.error(`Failed to load audio file: ${audioPath}`, e);
        reject(new Error(`Could not load audio file: ${fileName}`));
      });

      audio.preload = 'auto';
      audio.src = audioPath;
    });
  }

  /**
   * Play an audio file with preview functionality
   */
  async playAudio(fileName, options = {}) {
    if (!this.isAudioSupported()) {
      throw new Error('Audio not supported in this browser');
    }

    const {
      volume = 0.7,
      loop = false,
      stopCurrent = true
    } = options;

    // Stop current audio if requested
    if (stopCurrent && this.currentAudio) {
      this.stopCurrentAudio();
    }

    try {
      // Get or load the audio
      let audio = this.audioCache.get(fileName);
      if (!audio) {
        audio = await this.preloadAudio(fileName);
      }

      // Configure audio settings
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.loop = loop;
      audio.currentTime = 0; // Reset to beginning

      // Set as current audio
      this.currentAudio = audio;

      // Play the audio
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }

      return audio;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw new Error(`Failed to play audio: ${fileName}`);
    }
  }

  /**
   * Stop the currently playing audio
   */
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused;
  }

  /**
   * Get the currently playing audio file name
   */
  getCurrentAudioFile() {
    if (!this.currentAudio) return null;
    
    const src = this.currentAudio.src;
    const fileName = src.split('/').pop();
    return fileName;
  }

  /**
   * Preload all notification music files
   */
  async preloadAllNotificationMusic() {
    const musicFiles = [
      'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3',
      'music5.mp3', 'music6.mp3', 'music7.mp3'
    ];

    const loadPromises = musicFiles.map(async (fileName) => {
      try {
        await this.preloadAudio(fileName);
        return { fileName, success: true };
      } catch (error) {
        console.warn(`Failed to preload ${fileName}:`, error);
        return { fileName, success: false, error };
      }
    });

    const results = await Promise.allSettled(loadPromises);
    return results.map(result => result.value || result.reason);
  }

  /**
   * Play notification sound based on user preference
   */
  async playNotificationSound(userPreference = 'music1.mp3') {
    try {
      await this.playAudio(userPreference, {
        volume: 0.6,
        loop: false,
        stopCurrent: true
      });
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      // Fallback to default sound
      if (userPreference !== 'music1.mp3') {
        try {
          await this.playAudio('music1.mp3', {
            volume: 0.6,
            loop: false,
            stopCurrent: true
          });
        } catch (fallbackError) {
          console.error('Failed to play fallback notification sound:', fallbackError);
        }
      }
    }
  }

  /**
   * Clear audio cache to free memory
   */
  clearCache() {
    this.stopCurrentAudio();
    this.audioCache.clear();
  }

  /**
   * Get audio cache statistics
   */
  getCacheStats() {
    return {
      cachedFiles: Array.from(this.audioCache.keys()),
      cacheSize: this.audioCache.size,
      isPlaying: this.isPlaying(),
      currentFile: this.getCurrentAudioFile()
    };
  }
}

// Create a singleton instance
const audioManager = new AudioManager();

// Export both the class and the singleton instance
export { AudioManager };
export default audioManager;