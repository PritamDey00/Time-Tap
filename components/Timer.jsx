import React, { useEffect, useState, useRef } from "react";

export default function Timer({ userId, lastConfirm, createdAt, onConfirm }) {
    // userId optional; client will include it in confirm call
    const [msUntilWindow, setMsUntilWindow] = useState(0);
    const [inWindow, setInWindow] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [hasConfirmed, setHasConfirmed] = useState(false);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [testMode, setTestMode] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);
    const audioRef = useRef(null);
    const musicRef = useRef(null);
    const notifiedRef = useRef(false);
    const notificationRef = useRef(null);
    const notificationIntervalRef = useRef(null);
    const prevInWindowRef = useRef(false);
    const windowStartTimeRef = useRef(null);
    const interactionHandlerRef = useRef(null);

    // Check for test mode from URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('testConfirm') === 'true') {
                setTestMode(true);
                setInWindow(true);
                // Remove the parameter from URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, []);

    function getConfirmationTiming() {
        const now = new Date();
        const currentMinutes = now.getMinutes();
        const currentSeconds = now.getSeconds();
        const currentMs = now.getMilliseconds();
        
        // Calculate current time in milliseconds within the hour
        const currentTimeInHour = (currentMinutes * 60 + currentSeconds) * 1000 + currentMs;
        
        // Define confirmation windows: :00-:01 and :30-:31 (60 seconds each)
        const window1Start = 0; // :00:00
        const window1End = 60 * 1000; // :01:00
        const window2Start = 30 * 60 * 1000; // :30:00
        const window2End = 31 * 60 * 1000; // :31:00
        
        let isInWindow = false;
        let msUntilWindow = 0;
        let windowStartTime, windowEndTime;
        
        if (currentTimeInHour >= window1Start && currentTimeInHour < window1End) {
            // Currently in first window (:00-:01)
            isInWindow = true;
            windowStartTime = now.getTime() - (currentTimeInHour - window1Start);
            windowEndTime = windowStartTime + (window1End - window1Start);
        } else if (currentTimeInHour >= window2Start && currentTimeInHour < window2End) {
            // Currently in second window (:30-:31)
            isInWindow = true;
            windowStartTime = now.getTime() - (currentTimeInHour - window2Start);
            windowEndTime = windowStartTime + (window2End - window2Start);
        } else {
            // Not in window, calculate time until next window
            if (currentTimeInHour < window1Start) {
                // Before first window today
                msUntilWindow = window1Start - currentTimeInHour;
                windowStartTime = now.getTime() + msUntilWindow;
            } else if (currentTimeInHour < window2Start) {
                // Between windows, next is :30
                msUntilWindow = window2Start - currentTimeInHour;
                windowStartTime = now.getTime() + msUntilWindow;
            } else {
                // After second window, next is :00 of next hour
                const msUntilNextHour = (60 * 60 * 1000) - currentTimeInHour;
                msUntilWindow = msUntilNextHour;
                windowStartTime = now.getTime() + msUntilWindow;
            }
            windowEndTime = windowStartTime + 60 * 1000; // 1 minute window
        }
        
        return {
            windowStartTime,
            windowEndTime,
            isInWindow,
            msUntilWindow,
            canConfirm: isInWindow,
            currentTime: now.toISOString(),
            nextWindowTime: new Date(windowStartTime).toISOString()
        };
    }

    // Handle user interaction to enable audio playback
    function handleUserInteraction() {
        console.log('User interaction detected - attempting to enable audio');
        setUserInteracted(true);
        
        // If confirmation window is active and music exists, try to play
        if (inWindow && musicRef.current && !musicRef.current.paused === false) {
            attemptMusicPlayback();
        }
        
        // Remove event listeners after first interaction
        if (interactionHandlerRef.current) {
            ['click', 'touchstart', 'keydown'].forEach(event => {
                document.removeEventListener(event, interactionHandlerRef.current);
            });
            interactionHandlerRef.current = null;
        }
    }

    // Set up event listeners for user interaction
    function setupInteractionListeners() {
        if (!interactionHandlerRef.current) {
            interactionHandlerRef.current = handleUserInteraction;
            ['click', 'touchstart', 'keydown'].forEach(event => {
                document.addEventListener(event, interactionHandlerRef.current, { once: false });
            });
        }
    }

    // Attempt to play music with autoplay detection
    function attemptMusicPlayback() {
        if (!musicRef.current) return;
        
        try {
            const playPromise = musicRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Music playback started successfully');
                        setAudioBlocked(false);
                    })
                    .catch(error => {
                        if (error.name === 'NotAllowedError') {
                            console.log('Audio autoplay blocked - waiting for user interaction');
                            setAudioBlocked(true);
                        } else {
                            console.error('Audio playback error:', error);
                            setAudioBlocked(false);
                        }
                    });
            }
        } catch (error) {
            console.error('Audio initialization error:', error);
        }
    }

    useEffect(() => {
        // Request notification permission on component mount
        if (Notification && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Create background music audio element
        musicRef.current = new Audio('/music.mp3');
        musicRef.current.loop = true;
        musicRef.current.volume = 0.3; // Set volume to 30%

        // Add error handler for missing audio file
        musicRef.current.onerror = () => {
            console.error('Failed to load music.mp3 - continuing without background music');
        };

        // Set up interaction listeners for autoplay handling
        setupInteractionListeners();

        // create a short beep generator (WebAudio) element
        audioRef.current = {
            play: () => {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = "sine";
                    o.frequency.value = 880;
                    g.gain.value = 0.1;
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.start();
                    setTimeout(() => { o.stop(); ctx.close(); }, 250);
                } catch (e) {
                    // ignore
                }
            },
        };

        // Cleanup function
        return () => {
            // Remove interaction listeners
            if (interactionHandlerRef.current) {
                ['click', 'touchstart', 'keydown'].forEach(event => {
                    document.removeEventListener(event, interactionHandlerRef.current);
                });
                interactionHandlerRef.current = null;
            }
            
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
            if (notificationIntervalRef.current) {
                clearInterval(notificationIntervalRef.current);
            }
            if (notificationRef.current) {
                notificationRef.current.close();
            }
        };
    }, []);

    // Handle test mode music and notifications
    useEffect(() => {
        if (testMode && inWindow && musicRef.current && !notifiedRef.current) {
            notifiedRef.current = true;
            
            // Start music for test mode
            setTimeout(() => {
                if (musicRef.current) {
                    attemptMusicPlayback();
                }
                if (audioRef.current) {
                    audioRef.current.play();
                }
            }, 500); // Small delay to ensure audio is initialized
        }
    }, [testMode, inWindow]);

    // Handle animation states when window opens/closes
    useEffect(() => {
        if (inWindow && !prevInWindowRef.current) {
            // Window just opened - trigger entrance animation
            setIsAnimatingIn(true);
            setIsAnimatingOut(false);
            setTimeout(() => setIsAnimatingIn(false), 300);
        } else if (!inWindow && prevInWindowRef.current) {
            // Window just closed - trigger exit animation
            setIsAnimatingOut(true);
            setTimeout(() => setIsAnimatingOut(false), 200);
        }
        prevInWindowRef.current = inWindow;
    }, [inWindow]);

    useEffect(() => {
        const tick = () => {
            const timing = getConfirmationTiming();
            setMsUntilWindow(timing.msUntilWindow);
            
            if (timing.isInWindow) {
                setInWindow(true);
                // Store window start time for accurate countdown
                if (!windowStartTimeRef.current) {
                    windowStartTimeRef.current = timing.windowStartTime;
                }
                if (!notifiedRef.current) {
                    notifiedRef.current = true;
                    
                    // Start background music with autoplay detection
                    if (musicRef.current) {
                        if (userInteracted) {
                            // User has already interacted, play directly
                            attemptMusicPlayback();
                        } else {
                            // First time, attempt playback and detect if blocked
                            attemptMusicPlayback();
                        }
                    }
                    
                    // Play initial beep sound
                    audioRef.current?.play();
                    
                    // Show persistent notification
                    if (Notification && Notification.permission === "granted") {
                        try {
                            // Close any existing notification
                            if (notificationRef.current) {
                                notificationRef.current.close();
                            }
                            
                            notificationRef.current = new Notification("🎯 Study Confirmation Required!", {
                                body: "Confirm now to earn points! You have 60 seconds remaining.",
                                icon: "/favicon.ico",
                                tag: "study-confirmation",
                                requireInteraction: true, // Keeps notification visible until user interacts
                                silent: false,
                                vibrate: [200, 100, 200], // Vibration pattern for mobile
                            });

                            // Handle notification click
                            notificationRef.current.onclick = () => {
                                window.focus(); // Bring window to front
                                notificationRef.current.close();
                            };

                        } catch (e) {
                            console.log('Notification error:', e);
                        }
                    }
                    
                    // Set up repeated notifications every 15 seconds during the window
                    notificationIntervalRef.current = setInterval(() => {
                        const currentTiming = getConfirmationTiming();
                        if (currentTiming.isInWindow && Notification && Notification.permission === "granted") {
                            try {
                                // Calculate remaining time in window
                                const remainingMs = currentTiming.windowEndTime - Date.now();
                                const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
                                
                                if (remainingSeconds > 0) {
                                    // Close previous notification
                                    if (notificationRef.current) {
                                        notificationRef.current.close();
                                    }
                                    
                                    notificationRef.current = new Notification("⏰ Confirmation Window Still Open!", {
                                        body: `Hurry! Only ${remainingSeconds} seconds left to confirm and earn points!`,
                                        icon: "/favicon.ico",
                                        tag: "study-confirmation",
                                        requireInteraction: true,
                                        silent: false,
                                        vibrate: [300, 100, 300, 100, 300],
                                    });

                                    notificationRef.current.onclick = () => {
                                        window.focus();
                                        notificationRef.current.close();
                                    };
                                    
                                    // Play beep sound for repeated notifications
                                    audioRef.current?.play();
                                }
                            } catch (e) {
                                console.log('Repeated notification error:', e);
                            }
                        }
                    }, 15000); // Every 15 seconds
                }
            } else {
                // Don't close window if in test mode
                if (!testMode) {
                    setInWindow(false);
                    setHasConfirmed(false); // Reset for next window
                    windowStartTimeRef.current = null; // Reset window start time
                    if (notifiedRef.current) {
                        notifiedRef.current = false;
                        
                        // Stop background music
                        if (musicRef.current) {
                            musicRef.current.pause();
                            musicRef.current.currentTime = 0; // Reset to beginning
                        }
                        
                        // Clear notification interval
                        if (notificationIntervalRef.current) {
                            clearInterval(notificationIntervalRef.current);
                            notificationIntervalRef.current = null;
                        }
                        
                        // Close notification
                        if (notificationRef.current) {
                            notificationRef.current.close();
                            notificationRef.current = null;
                        }
                    }
                }
            }
        };

        tick();
        const interval = setInterval(tick, 400);
        return () => clearInterval(interval);
    }, [userId]); // Removed lastConfirm and createdAt dependencies since we use clock time now

    async function doConfirm() {
        if (confirming) return;
        setConfirming(true);
        
        // Stop music and notifications immediately when user confirms
        if (musicRef.current) {
            musicRef.current.pause();
            musicRef.current.currentTime = 0;
        }
        if (notificationRef.current) {
            notificationRef.current.close();
            notificationRef.current = null;
        }
        if (notificationIntervalRef.current) {
            clearInterval(notificationIntervalRef.current);
            notificationIntervalRef.current = null;
        }
        
        // Mark as confirmed but keep window open to show countdown
        setHasConfirmed(true);
        
        try {
            const payload = {
                userId: userId || undefined,
                clientTs: Date.now(),
            };
            const res = await fetch("/api/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                // Show error in a dialog-style alert
                const errorMsg = data?.error || "Confirm failed";
                if (typeof window !== 'undefined' && window.showConfirmationDialog) {
                    window.showConfirmationDialog({
                        title: 'Confirmation Failed',
                        message: errorMsg,
                        type: 'danger',
                        confirmText: 'OK',
                        onConfirm: () => {},
                        showCancel: false
                    });
                } else {
                    alert(errorMsg);
                }
            } else {
                // success - show success dialog
                if (typeof window !== 'undefined' && window.showConfirmationDialog) {
                    window.showConfirmationDialog({
                        title: 'Success!',
                        message: `Great job! You earned ${data.pointsAwarded} point${data.pointsAwarded > 1 ? 's' : ''}. Keep up the streak!`,
                        type: 'success',
                        confirmText: 'Great!',
                        onConfirm: () => {},
                        showCancel: false
                    });
                }
                
                // Also show browser notification
                if (Notification && Notification.permission === "granted") {
                    try {
                        new Notification("✅ Confirmation Successful!", {
                            body: `Great job! You earned ${data.pointsAwarded} point${data.pointsAwarded > 1 ? 's' : ''}. Keep up the streak!`,
                            icon: "/favicon.ico",
                            tag: "study-success",
                            silent: false,
                        });
                    } catch (e) {
                        console.log('Success notification error:', e);
                    }
                }
                if (onConfirm) onConfirm(data);
            }
        } catch (e) {
            console.error(e);
            if (typeof window !== 'undefined' && window.showConfirmationDialog) {
                window.showConfirmationDialog({
                    title: 'Error',
                    message: 'Network error. Please check your connection and try again.',
                    type: 'danger',
                    confirmText: 'OK',
                    onConfirm: () => {},
                    showCancel: false
                });
            } else {
                alert("Confirm failed");
            }
        } finally {
            setConfirming(false);
        }
    }

    const seconds = Math.max(0, Math.ceil(msUntilWindow / 1000));
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    // Calculate remaining seconds in the confirmation window using stored start time
    const timing = getConfirmationTiming();
    const remainingMs = timing.isInWindow && windowStartTimeRef.current 
        ? Math.max(0, (windowStartTimeRef.current + 60000) - Date.now()) 
        : 0;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const isUrgent = remainingSeconds <= 10 && remainingSeconds > 0;

    return (
        <div className="timer">
            {testMode ? (
                <div style={{ 
                    padding: '8px 12px', 
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                    borderRadius: '8px', 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '14px',
                    textAlign: 'center',
                    marginBottom: '12px'
                }}>
                    🧪 TEST MODE - Confirmation Window Active
                </div>
            ) : (
                <div>Next confirmation window: {mm}:{ss}</div>
            )}
            {(inWindow || isAnimatingOut) ? (
                <div className={`confirm-area ${isAnimatingIn ? 'animating-in' : ''} ${isAnimatingOut ? 'animating-out' : ''}`}>
                    {audioBlocked && !userInteracted && (
                        <div className="audio-blocked-indicator">
                            <span className="audio-icon">🔊</span>
                            <span>Click anywhere to enable sound</span>
                        </div>
                    )}
                    <div className={`confirm-icon ${isUrgent ? 'urgent' : ''}`}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="countdown-display">
                        <div className={`countdown-number ${isUrgent ? 'urgent' : ''}`}>
                            {testMode ? '∞' : remainingSeconds}
                        </div>
                        <div className="countdown-label">{testMode ? 'test mode' : 'seconds remaining'}</div>
                    </div>
                    {!hasConfirmed && (
                        <button className="confirm-button" onClick={doConfirm} disabled={confirming}>
                            {confirming ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Confirming...
                                </>
                            ) : (
                                'Confirm Now'
                            )}
                        </button>
                    )}
                    {hasConfirmed && (
                        <div style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: '15px'
                        }}>
                            ✅ Confirmed! Window closes soon...
                        </div>
                    )}
                </div>
            ) : null}
            <style jsx>{`
                .confirm-area {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                .confirm-area.animating-in {
                    animation: fadeInSlideScale 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .confirm-area.animating-out {
                    animation: fadeOutSlide 0.2s ease-out forwards;
                }

                @keyframes fadeInSlideScale {
                    0% {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes fadeOutSlide {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                }

                .audio-blocked-indicator {
                    width: 100%;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                    animation: slideInBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .audio-blocked-indicator:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
                }

                @keyframes slideInBounce {
                    0% {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.9);
                    }
                    60% {
                        opacity: 1;
                        transform: translateY(5px) scale(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .audio-icon {
                    font-size: 18px;
                    animation: pulse-icon 1.5s ease-in-out infinite;
                }

                @keyframes pulse-icon {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                }

                .confirm-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 8px 25px var(--theme-primary)30;
                    transition: all 0.3s ease;
                }

                .confirm-icon.urgent {
                    animation: pulse-urgent 1s ease-in-out infinite;
                }

                @keyframes pulse-urgent {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 8px 25px var(--theme-primary)30;
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 12px 35px var(--theme-primary)50;
                    }
                }

                .countdown-display {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .countdown-number {
                    font-size: 48px;
                    font-weight: 700;
                    line-height: 1;
                    background: linear-gradient(135deg, #10b981, #22c55e);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    transition: all 0.3s ease;
                }

                .countdown-number.urgent {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: pulse-number 0.5s ease-in-out infinite;
                }

                @keyframes pulse-number {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                .countdown-label {
                    font-size: 14px;
                    color: var(--muted);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .confirm-button {
                    width: 100%;
                    padding: 16px 32px;
                    border: none;
                    border-radius: 16px;
                    background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 25px var(--theme-primary)30;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .confirm-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s ease;
                }

                .confirm-button:hover:not(:disabled)::before {
                    left: 100%;
                }

                .confirm-button:hover:not(:disabled) {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 12px 35px var(--theme-primary)40;
                }

                .confirm-button:active:not(:disabled) {
                    transform: translateY(0) scale(0.98);
                }

                .confirm-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                /* Mobile styles (default - mobile-first) */
                @media (max-width: 767px) {
                    .confirm-area {
                        padding: 20px;
                        gap: 16px;
                    }

                    .confirm-icon {
                        width: 56px;
                        height: 56px;
                    }

                    .confirm-icon svg {
                        width: 28px;
                        height: 28px;
                    }

                    .countdown-number {
                        font-size: 40px;
                    }

                    .countdown-label {
                        font-size: 12px;
                    }

                    .confirm-button {
                        padding: 14px 28px;
                        font-size: 15px;
                        min-height: 44px; /* Touch-friendly minimum */
                    }
                }

                /* Tablet styles */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .confirm-area {
                        padding: 24px;
                        gap: 18px;
                    }

                    .confirm-icon {
                        width: 60px;
                        height: 60px;
                    }

                    .confirm-icon svg {
                        width: 30px;
                        height: 30px;
                    }

                    .countdown-number {
                        font-size: 44px;
                    }

                    .countdown-label {
                        font-size: 13px;
                    }

                    .confirm-button {
                        padding: 15px 30px;
                        font-size: 15px;
                    }
                }

                /* Desktop styles */
                @media (min-width: 1024px) {
                    .confirm-area {
                        padding: 28px;
                        gap: 20px;
                    }

                    .confirm-icon {
                        width: 64px;
                        height: 64px;
                    }

                    .confirm-icon svg {
                        width: 32px;
                        height: 32px;
                    }

                    .countdown-number {
                        font-size: 48px;
                    }

                    .countdown-label {
                        font-size: 14px;
                    }

                    .confirm-button {
                        padding: 16px 32px;
                        font-size: 16px;
                    }
                }

                /* Orientation handling */
                @media (max-width: 767px) and (orientation: landscape) {
                    .confirm-area {
                        padding: 16px;
                        gap: 12px;
                    }

                    .confirm-icon {
                        width: 48px;
                        height: 48px;
                    }

                    .confirm-icon svg {
                        width: 24px;
                        height: 24px;
                    }

                    .countdown-number {
                        font-size: 36px;
                    }

                    .countdown-label {
                        font-size: 11px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .confirm-area.animating-in,
                    .confirm-area.animating-out,
                    .confirm-icon.urgent,
                    .countdown-number.urgent {
                        animation: none;
                    }
                    
                    .loading-spinner {
                        animation: none;
                        border: 2px solid white;
                    }
                    
                    .confirm-button:hover:not(:disabled) {
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
}