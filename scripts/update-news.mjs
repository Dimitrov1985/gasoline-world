/**
 * Fetches latest fuel news from GNews API and updates src/data/news-live.json
 * Requires: GNEWS_KEY environment variable (GitHub Secret)
 *
 * Run locally:
 *   GNEWS_KEY=your_key node scripts/update-news.mjs
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath }  from 'node:url'
import { dirname, join }  from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT  = join(ROOT, 'src/data/news-live.json')

const API_KEY = process.env.GNEWS_KEY
if (!API_KEY) {
  console.error('✗ GNEWS_KEY env variable is not set')
  console.error('  Usage: GNEWS_KEY=your_key node scripts/update-news.mjs')
  process.exit(1)
}

// ── Category & flag detection (mirrors useNews.js logic) ──────────────
function detectCategory(text) {
  const t = text.toLowerCase()
  if (/opec|saudi|aramco|uae|iran|iraq|kuwait|qatar|bahrain|oman/.test(t))
    return { cat: 'ОПЕК', en: 'OPEC' }
  if (/russia|moscow|kremlin|lukoil|rosneft/.test(t))
    return { cat: 'Россия', en: 'Russia' }
  if (/europe|germany|france|britain|norway|netherlands|eu |poland|italy|spain/.test(t))
    return { cat: 'Европа', en: 'Europe' }
  if (/china|india|japan|korea|singapore|asia|vietnam|indonesia|malaysia/.test(t))
    return { cat: 'Азия', en: 'Asia' }
  if (/america|united states|\busa\b|canada|mexico/.test(t))
    return { cat: 'Сев. Америка', en: 'N. America' }
  if (/africa|nigeria|kenya|ghana|angola|ethiopia/.test(t))
    return { cat: 'Африка', en: 'Africa' }
  if (/venezuela|brazil|argentina|latin|colombia|chile/.test(t))
    return { cat: 'Ю. Америка', en: 'S. America' }
  if (/middle east|jordan|israel|lebanon|turkey/.test(t))
    return { cat: 'Ближний Восток', en: 'Middle East' }
  return { cat: 'ОПЕК', en: 'OPEC' }
}

function detectFlag(text) {
  const t = text.toLowerCase()
  if (/saudi|aramco/.test(t))         return '🇸🇦'
  if (/russia|kremlin/.test(t))       return '🇷🇺'
  if (/iran/.test(t))                 return '🇮🇷'
  if (/china/.test(t))                return '🇨🇳'
  if (/india/.test(t))                return '🇮🇳'
  if (/\busa\b|united states/.test(t)) return '🇺🇸'
  if (/germany/.test(t))              return '🇩🇪'
  if (/norway/.test(t))               return '🇳🇴'
  if (/nigeria/.test(t))              return '🇳🇬'
  if (/venezuela/.test(t))            return '🇻🇪'
  if (/brazil/.test(t))               return '🇧🇷'
  if (/europe|eu /.test(t))           return '🇪🇺'
  if (/opec/.test(t))                 return '🌍'
  return '📰'
}

function mapArticle(a, i) {
  const text = `${a.title} ${a.description ?? ''}`
  const cat  = detectCategory(text)
  return {
    id:         `live-${Date.now()}-${i}`,
    flag:       detectFlag(text),
    category:   cat.cat,
    categoryEn: cat.en,
    date:       (a.publishedAt ?? '').split('T')[0] || new Date().toISOString().split('T')[0],
    source:     a.source?.name ?? 'News',
    featured:   i === 0,
    url:        a.url ?? '#',
    isLive:     true,
    // Same content in both fields — frontend picks language
    title:      a.title ?? '',
    titleEn:    a.title ?? '',
    summary:    a.description ?? '',
    summaryEn:  a.description ?? '',
    body:       (a.content ?? a.description ?? '').replace(/\s*\[\d+ chars\]$/, ''),
    bodyEn:     (a.content ?? a.description ?? '').replace(/\s*\[\d+ chars\]$/, ''),
  }
}

// ── Fetch from GNews ───────────────────────────────────────────────────
const QUERIES = [
  'gasoline fuel prices world',
  'oil price OPEC production',
  'petrol diesel prices',
  'fuel energy prices global',
]

async function fetchQuery(q) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&token=${API_KEY}`
  const res  = await fetch(url)
  if (!res.ok) throw new Error(`GNews HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (data.errors) throw new Error(data.errors.join(', '))
  return data.articles ?? []
}

async function run() {
  console.log('=== Gasoline World — News Updater ===\n')

  const seen    = new Set()
  const results = []

  for (const q of QUERIES) {
    try {
      console.log(`  Fetching: "${q}"`)
      const articles = await fetchQuery(q)
      let added = 0
      for (const a of articles) {
        if (!seen.has(a.url)) {
          seen.add(a.url)
          results.push(a)
          added++
        }
      }
      console.log(`  → ${articles.length} articles, ${added} new (${results.length} total)`)
    } catch (e) {
      console.error(`  ✗ Query failed: ${e.message}`)
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  if (results.length === 0) {
    console.error('\n✗ No articles fetched — news-live.json unchanged')
    process.exit(1)
  }

  // Sort by date desc, take top 16
  results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  const articles = results.slice(0, 16).map(mapArticle)
  // Mark first as featured
  if (articles[0]) articles[0].featured = true

  const output = {
    lastUpdated: new Date().toISOString().split('T')[0],
    articles,
  }

  writeFileSync(OUT, JSON.stringify(output, null, 2))
  console.log(`\n✅ Saved ${articles.length} articles to news-live.json`)
  console.log(`   Date: ${output.lastUpdated}`)
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
