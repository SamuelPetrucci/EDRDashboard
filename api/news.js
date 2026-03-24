const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc'
const GOOGLE_RSS = 'https://news.google.com/rss/search'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60
const REQUEST_TIMEOUT_MS = 9000

const DISASTER_TERMS = [
  'hurricane',
  'storm',
  'flood',
  'earthquake',
  'landslide',
  'wildfire',
  'drought',
  'outage',
  'evacuation',
  'emergency',
  'disaster',
  'humanitarian',
  'critical infrastructure',
  'port',
  'airport',
  'civil protection',
]

const JAM_REGION_TERMS = [
  'Jamaica',
  'Kingston',
  'Montego Bay',
  'Caribbean',
  'West Indies',
]

const TRUSTED_SOURCE_HINTS = [
  'reuters',
  'ap',
  'associated press',
  'bbc',
  'al jazeera',
  'noaa',
  'nhc',
  'usgs',
  'gdacs',
  'odpem',
  'government',
  '.gov',
]

function parseLimit(value) {
  const n = Number.parseInt(String(value || DEFAULT_LIMIT), 10)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT
  return Math.min(n, MAX_LIMIT)
}

function getAuthToken(req) {
  const header = req.headers?.authorization || ''
  if (!header.toLowerCase().startsWith('bearer ')) return ''
  return header.slice(7).trim()
}

function withTimeout(signal, ms) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  if (signal) {
    signal.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) }
}

function decodeHtml(str) {
  return String(str || '')
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function stripTags(str) {
  return String(str || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

function scoreArticle(article) {
  const hay = `${article.title || ''} ${article.summary || ''} ${article.source || ''}`.toLowerCase()
  let score = 0

  for (const term of DISASTER_TERMS) {
    if (hay.includes(term)) score += 2
  }
  for (const term of JAM_REGION_TERMS) {
    if (hay.includes(term.toLowerCase())) score += 2
  }
  for (const trusted of TRUSTED_SOURCE_HINTS) {
    if (hay.includes(trusted)) {
      score += 2
      break
    }
  }

  if (article.publishedAt) {
    const ageMs = Date.now() - new Date(article.publishedAt).getTime()
    if (ageMs < 12 * 60 * 60 * 1000) score += 3
    else if (ageMs < 48 * 60 * 60 * 1000) score += 1
  }

  return score
}

function dedupeArticles(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = `${(item.url || '').toLowerCase()}|${(item.title || '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

async function fetchFromGdelt(limit, signal) {
  const q = `(${JAM_REGION_TERMS.join(' OR ')}) AND (${DISASTER_TERMS.join(' OR ')})`
  const params = new URLSearchParams({
    query: q,
    mode: 'ArtList',
    format: 'json',
    maxrecords: String(Math.min(limit * 2, 60)),
    sort: 'DateDesc',
  })

  const timeout = withTimeout(signal, REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${GDELT_API}?${params.toString()}`, { signal: timeout.signal })
    if (!res.ok) return []
    const json = await res.json().catch(() => null)
    const articles = Array.isArray(json?.articles) ? json.articles : []
    return articles.map((a, idx) => ({
      id: `gdelt-${idx}-${a.url || a.title || 'item'}`,
      title: stripTags(a.title || ''),
      summary: stripTags(a.seendate ? `Seen: ${a.seendate}` : ''),
      source: a.sourceCommonName || a.domain || 'GDELT',
      url: a.url || '',
      publishedAt: normalizeDate(a.seendate || a.socialimage || ''),
      category: 'intel',
    }))
  } finally {
    timeout.clear()
  }
}

async function fetchFromGoogleRss(limit, signal) {
  const q = `${JAM_REGION_TERMS.join(' OR ')} ${DISASTER_TERMS.slice(0, 8).join(' OR ')}`
  const params = new URLSearchParams({
    q,
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  })

  const timeout = withTimeout(signal, REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${GOOGLE_RSS}?${params.toString()}`, { signal: timeout.signal })
    if (!res.ok) return []
    const xml = await res.text()
    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = itemRegex.exec(xml)) && items.length < Math.min(limit * 2, 60)) {
      const block = m[1]
      const title = decodeHtml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '')
      const link = decodeHtml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '')
      const pubDate = decodeHtml((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '')
      const source = decodeHtml((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || 'Google News')
      const description = decodeHtml((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '')
      if (!title) continue
      items.push({
        id: `rss-${items.length}-${link || title}`,
        title: stripTags(title),
        summary: stripTags(description),
        source: stripTags(source),
        url: link,
        publishedAt: normalizeDate(pubDate),
        category: 'intel',
      })
    }
    return items
  } finally {
    timeout.clear()
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const requiredToken = process.env.NEWS_BACKEND_TOKEN || ''
  const providedToken = getAuthToken(req)
  if (requiredToken && providedToken !== requiredToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const limit = parseLimit(req.query?.limit)
  const controller = new AbortController()

  try {
    const [gdelt, rss] = await Promise.all([
      fetchFromGdelt(limit, controller.signal).catch(() => []),
      fetchFromGoogleRss(limit, controller.signal).catch(() => []),
    ])

    const merged = dedupeArticles([...gdelt, ...rss])
      .map((a) => ({ ...a, _score: scoreArticle(a) }))
      .filter((a) => a._score >= 3)
      .sort((a, b) => {
        const tA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const tB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        if (tA !== tB) return tB - tA
        return b._score - a._score
      })
      .slice(0, limit)
      .map(({ _score, ...rest }) => rest)

    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300')
    res.status(200).json(merged)
  } catch {
    res.status(200).json([])
  } finally {
    controller.abort()
  }
}
