import React, { useEffect, useState, useRef } from "react";

export default function Timer({ userId, lastConfirm, createdAt, onConfirm }) {
    // userId optional; client will include it in confirm call
    const [msUntilWindow, setMsUntilWindow] = useState(0);
    const [inWindow, setInWindow] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const audioRef = useRef(null);
    const musicRef = useRef(null);
    const notifiedRef = useRef(false);
    const notificationRef = useRef(null);
    const notificationIntervalRef = useRef(null);

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

    useEffect(() => {
        // Request notification permission on component mount
        if (Notification && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Create background music audio element
        musicRef.current = new Audio('/music.mp3');
        musicRef.current.loop = true;
        musicRef.current.volume = 0.3; // Set volume to 30%

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

    useEffect(() => {
        const tick = () => {
            const timing = getConfirmationTiming();
            setMsUntilWindow(timing.msUntilWindow);
            
            if (timing.isInWindow) {
                setInWindow(true);
                if (!notifiedRef.current) {
                    notifiedRef.current = true;
                    
                    // Start background music
                    if (musicRef.current) {
                        musicRef.current.play().catch(e => {
                            console.log('Music autoplay blocked:', e);
                        });
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
                setInWindow(false);
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
                alert(data?.error || "Confirm failed");
            } else {
                // success - show success notification
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
            alert("Confirm failed");
        } finally {
            setConfirming(false);
        }
    }

    const seconds = Math.max(0, Math.ceil(msUntilWindow / 1000));
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    return (
        <div className="timer">
            <div>Next confirmation window: {mm}:{ss}</div>
            {inWindow ? (
                <div className="confirm-area">
                    <div className="notice">Confirmation window open — 60s</div>
                    <button onClick={doConfirm} disabled={confirming}>Confirm</button>
                </div>
            ) : null}
        </div>
    );
}