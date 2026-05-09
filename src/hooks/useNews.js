import { useState, useEffect } from 'react'
import { NEWS } from '../data/news'

const API_KEY  = import.meta.env.VITE_GNEWS_KEY
const CACHE_KEY = 'gw_news_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 хв

// ── Cache helpers ──────────────────────────────────────────
function getCached() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && Date.now() - c.ts < CACHE_TTL) return c.articles
  } catch {}
  return null
}
function setCache(articles) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), articles })) }
  catch {}
}

// ── Category / flag auto-detect ────────────────────────────
function detectCategory(text) {
  const t = text.toLowerCase()
  if (/opec|saudi|aramco|uae|iran|iraq|kuwait|qatar|bahrain|oman/.test(t))
    return { uk: 'ОПЕК', en: 'OPEC', cat: 'ОПЕК' }
  if (/russia|moscow|kremlin|lukoil|rosneft/.test(t))
    return { uk: 'Росія', en: 'Russia', cat: 'Россия' }
  if (/europe|germany|france|britain|norway|netherlands|eu |poland|italy|spain/.test(t))
    return { uk: 'Європа', en: 'Europe', cat: 'Европа' }
  if (/china|india|japan|korea|singapore|asia|vietnam|indonesia|malaysia/.test(t))
    return { uk: 'Азія', en: 'Asia', cat: 'Азия' }
  if (/america|united states|\busa\b|canada|mexico/.test(t))
    return { uk: 'Пн. Америка', en: 'N. America', cat: 'Сев. Америка' }
  if (/africa|nigeria|kenya|ghana|angola|ethiopia/.test(t))
    return { uk: 'Африка', en: 'Africa', cat: 'Африка' }
  if (/venezuela|brazil|argentina|latin|colombia|chile/.test(t))
    return { uk: 'Пд. Америка', en: 'S. America', cat: 'Ю. Америка' }
  if (/middle east|jordan|israel|lebanon|turkey/.test(t))
    return { uk: 'Близький Схід', en: 'Middle East', cat: 'Ближний Восток' }
  return { uk: 'ОПЕК', en: 'OPEC', cat: 'ОПЕК' }
}

function detectFlag(text) {
  const t = text.toLowerCase()
  if (/saudi|aramco/.test(t)) return '🇸🇦'
  if (/russia|kremlin/.test(t)) return '🇷🇺'
  if (/iran/.test(t)) return '🇮🇷'
  if (/china/.test(t)) return '🇨🇳'
  if (/india/.test(t)) return '🇮🇳'
  if (/\busa\b|united states/.test(t)) return '🇺🇸'
  if (/germany/.test(t)) return '🇩🇪'
  if (/norway/.test(t)) return '🇳🇴'
  if (/nigeria/.test(t)) return '🇳🇬'
  if (/venezuela/.test(t)) return '🇻🇪'
  if (/brazil/.test(t)) return '🇧🇷'
  if (/europe|eu /.test(t)) return '🇪🇺'
  if (/opec/.test(t)) return '🌍'
  return '📰'
}

function mapArticle(a, i) {
  const text = `${a.title} ${a.description ?? ''}`
  const cat  = detectCategory(text)
  return {
    id:          `live-${i}`,
    flag:        detectFlag(text),
    category:    cat.cat,
    categoryUk:  cat.uk,
    categoryEn:  cat.en,
    date:        (a.publishedAt ?? '').split('T')[0] || new Date().toISOString().split('T')[0],
    source:      a.source?.name ?? 'News',
    featured:    i === 0,
    url:         a.url ?? '#',
    title:       a.title ?? '',
    titleEn:     a.title ?? '',
    summary:     a.description ?? '',
    summaryEn:   a.description ?? '',
    body:        (a.content ?? a.description ?? '').replace(/\s*\[\d+ chars\]$/, ''),
    bodyEn:      (a.content ?? a.description ?? '').replace(/\s*\[\d+ chars\]$/, ''),
    isLive:      true,
  }
}

// ── Main hook ──────────────────────────────────────────────
const QUERIES = [
  'gasoline fuel prices',
  'oil price OPEC production',
  'petrol diesel prices world',
]

export function useNews() {
  const [articles, setArticles] = useState(NEWS)
  const [loading,  setLoading]  = useState(false)
  const [isLive,   setIsLive]   = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!API_KEY) return  // немає ключа — статичні новини

    // Спробувати кеш
    const cached = getCached()
    if (cached) {
      setArticles(cached)
      setIsLive(true)
      return
    }

    setLoading(true)
    const q = QUERIES[Math.floor(Math.random() * QUERIES.length)]

    fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&token=${API_KEY}`
    )
      .then(r => r.json())
      .then(data => {
        if (data.articles?.length) {
          const mapped = data.articles.map(mapArticle)
          setCache(mapped)
          setArticles(mapped)
          setIsLive(true)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { articles, loading, isLive, error }
}
