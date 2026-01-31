// Using built-in fetch (Node.js 18+)
import { handleApiError, getRequestContext, logApiRequest } from '../../lib/apiErrorHandler';

/*
  Server-side IP geolocation endpoint (optional).
  It attempts to determine an approximate timezone/city/country for the request IP.
  Note: this uses a public API (ipapi.co) for demo. For production, use MaxMind or a paid API and respect privacy.
*/
export default async function handler(req, res) {
  try {
    // Log request for debugging
    logApiRequest(req, { endpoint: 'geolocate' });

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        type: 'method',
        message: 'This endpoint only supports GET requests'
      });
    }

    // Get IP (behind proxies use x-forwarded-for)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    // ipapi.co: free tier but rate-limited. If ip is private/unavailable, use default lookup
    const url = `https://ipapi.co/${ip ? encodeURIComponent(ip) : ''}/json/`;
    const r = await fetch(url, { timeout: 5000 });
    
    if (!r.ok) {
      console.warn('Primary geolocation API failed, trying fallback');
      // fallback to ipapi.co/json (server IP)
      const r2 = await fetch('https://ipapi.co/json/', { timeout: 5000 });
      if (!r2.ok) {
        throw new Error('Geolocation service unavailable');
      }
      const data2 = await r2.json();
      console.log('Geolocation successful (fallback):', { ip: data2.ip, city: data2.city });
      return res.json({ 
        ip: data2.ip || null, 
        city: data2.city || null, 
        region: data2.region || null, 
        country: data2.country_name || null, 
        timezone: data2.timezone || null, 
        raw: data2 
      });
    }
    
    const data = await r.json();
    console.log('Geolocation successful:', { ip: data.ip, city: data.city });
    res.json({
      ip: data.ip || null,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      timezone: data.timezone || null,
      raw: data
    });
    
  } catch (error) {
    const context = getRequestContext(req);
    context.endpoint = 'geolocate';
    // For geolocation failures, provide a more specific error message
    if (error.message.includes('timeout') || error.message.includes('fetch')) {
      error.message = 'Geolocation service temporarily unavailable';
    }
    return handleApiError(error, res, context);
  }
}