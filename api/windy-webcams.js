/**
 * Server-side proxy for Windy Webcams API v3 (avoids browser CORS on api.windy.com / api4.windy.com).
 * Set WINDY_WEBCAM_API_KEY or VITE_WINDY_WEBCAM_API_KEY or VITE_WINDY_API_KEY in Vercel env.
 */

const WINDY_BASES = ['https://api.windy.com/webcams/api/v3/webcams', 'https://api4.windy.com/webcams/api/v3/webcams']

function getWindyKey() {
  return (
    process.env.WINDY_WEBCAM_API_KEY ||
    process.env.VITE_WINDY_WEBCAM_API_KEY ||
    process.env.VITE_WINDY_API_KEY ||
    ''
  )
    .toString()
    .trim()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = getWindyKey()
  if (!key) {
    res.status(503).json({ error: 'Windy webcam API key not configured on server' })
    return
  }

  const lat = Number.parseFloat(req.query?.lat)
  const lng = Number.parseFloat(req.query?.lng)
  const radiusRaw = Number.parseFloat(req.query?.radius)
  const radius = Math.min(200, Math.max(1, Number.isFinite(radiusRaw) ? radiusRaw : 50))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'Query params lat and lng are required' })
    return
  }

  const nearby = `${lat},${lng},${radius}`
  const query = new URLSearchParams({ nearby, limit: '20' }).toString()
  let lastErr = null

  for (const base of WINDY_BASES) {
    const url = `${base}?${query}`
    try {
      const r = await fetch(url, {
        method: 'GET',
        headers: { 'x-windy-api-key': key },
        signal: AbortSignal.timeout(12000),
      })
      const text = await r.text()
      let json
      try {
        json = JSON.parse(text)
      } catch {
        res.status(502).json({ error: 'Invalid JSON from Windy' })
        return
      }
      res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=180')
      res.status(r.status).json(json)
      return
    } catch (e) {
      lastErr = e
    }
  }

  res.status(502).json({ error: lastErr?.message || 'Windy upstream failed' })
}
