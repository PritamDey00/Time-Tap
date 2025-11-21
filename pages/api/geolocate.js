// Using built-in fetch (Node.js 18+)

/*
  Server-side IP geolocation endpoint (optional).
  It attempts to determine an approximate timezone/city/country for the request IP.
  Note: this uses a public API (ipapi.co) for demo. For production, use MaxMind or a paid API and respect privacy.
*/
export default async function handler(req, res) {
  // Get IP (behind proxies use x-forwarded-for)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

  try {
    // ipapi.co: free tier but rate-limited. If ip is private/unavailable, use default lookup
    const url = `https://ipapi.co/${ip ? encodeURIComponent(ip) : ''}/json/`;
    const r = await fetch(url, { timeout: 5000 });
    if (!r.ok) {
      // fallback to ipapi.co/json (server IP)
      const r2 = await fetch('https://ipapi.co/json/', { timeout: 5000 });
      const data2 = await r2.json();
      res.json({ ip: data2.ip || null, city: data2.city || null, region: data2.region || null, country: data2.country_name || null, timezone: data2.timezone || null, raw: data2 });
      return;
    }
    const data = await r.json();
    res.json({
      ip: data.ip || null,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      timezone: data.timezone || null,
      raw: data
    });
  } catch (err) {
    // best-effort safe response
    res.status(500).json({ error: 'geolocation_failed', message: err.message || String(err) });
  }
}