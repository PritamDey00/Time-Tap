import { useEffect, useState } from 'react';

/*
  Robust analog clock component.
  - Accepts optional prop `timeZone` (IANA string like "Asia/Kolkata").
  - Uses Intl to compute hours/minutes/seconds in that timezone if provided.
  - Draws ticks and hands as centered lines so rotation is precise.
*/
export default function AnalogClock({ timeZone }) {
  const [timeParts, setTimeParts] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    let mounted = true;

    function getParts() {
      const now = new Date();

      if (timeZone) {
        try {
          const fmt = new Intl.DateTimeFormat('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone
          });
          const parts = fmt.formatToParts(now);
          const h = Number(parts.find(p => p.type === 'hour')?.value || 0);
          const m = Number(parts.find(p => p.type === 'minute')?.value || 0);
          const s = Number(parts.find(p => p.type === 'second')?.value || 0);

          // smooth hour and minute values (for continuous movement)
          const hourFraction = (h % 12) + m / 60 + s / 3600;
          const minuteFraction = m + s / 60;
          return { hours: hourFraction, minutes: minuteFraction, seconds: s };
        } catch (e) {
          // invalid timezone -> fall back
        }
      }

      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours() % 12;
      return { hours: h + m / 60 + s / 3600, minutes: m + s / 60, seconds: s };
    }

    function tick() {
      if (!mounted) return;
      setTimeParts(getParts());
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [timeZone]);

  // convert to degrees
  const secondsDeg = (timeParts.seconds / 60) * 360;
  const minutesDeg = (timeParts.minutes / 60) * 360;
  const hoursDeg = (timeParts.hours / 12) * 360;

  // svg sizing: use user coords centered at 0,0 for easier rotation
  return (
    <svg viewBox="-50 -50 100 100" style={{ width: '80%', height: '80%' }}>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#f3f4f6" />
        </linearGradient>
      </defs>

      {/* face */}
      <circle r="48" fill="url(#g)" stroke="rgba(16,24,40,0.04)" strokeWidth="0.8" />

      {/* ticks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const isHour = i % 5 === 0;
        const rOut = 42;
        const rIn = isHour ? 34 : 38;
        const angle = (i / 60) * Math.PI * 2;
        const x1 = Math.cos(angle) * rIn;
        const y1 = Math.sin(angle) * rIn;
        const x2 = Math.cos(angle) * rOut;
        const y2 = Math.sin(angle) * rOut;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#e6e9ef"
            strokeWidth={isHour ? 1.6 : 0.9}
            strokeLinecap="round"
            opacity={isHour ? 1 : 0.9}
          />
        );
      })}

      {/* hour hand (shorter, thicker) */}
      <g transform={`rotate(${hoursDeg})`}>
        <line x1="0" y1="0" x2="0" y2="-22" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* minute hand (longer) */}
      <g transform={`rotate(${minutesDeg})`}>
        <line x1="0" y1="0" x2="0" y2="-30" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
      </g>

      {/* second hand (thin, colored) */}
      <g transform={`rotate(${secondsDeg})`}>
        <line x1="0" y1="6" x2="0" y2="-34" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* center pin */}
      <circle r="3.2" fill="#111827" />
    </svg>
  );
}