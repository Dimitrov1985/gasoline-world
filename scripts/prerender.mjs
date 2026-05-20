import { spawn } from 'child_process'
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

function updateSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gasoline-world.vercel.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>\n`
  writeFileSync('dist/sitemap.xml', xml)
  console.log(`sitemap.xml updated: lastmod=${today}`)
}

const PORT = 4173

async function waitForServer(url, maxMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {}
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Server at ${url} did not start within ${maxMs}ms`)
}

async function prerender() {
  // sitemap always updates regardless of whether Playwright succeeds
  updateSitemap()

  // Playwright requires system Chromium libs — skip gracefully in CI if unavailable
  if (process.env.VERCEL) {
    console.log('Vercel environment detected — skipping Playwright prerender')
    return
  }

  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    shell: true,
    stdio: 'pipe',
  })

  try {
    await waitForServer(`http://localhost:${PORT}`)

    const browser = await chromium.launch()
    const page = await browser.newPage()

    // prerender=1 skips the splash screen animation
    await page.goto(`http://localhost:${PORT}/?prerender=1`)

    // wait until React has mounted the app
    await page.waitForSelector('[data-app="ready"]', { timeout: 15000 })

    // let async state (translations, etc.) settle
    await page.waitForTimeout(500)

    const html = await page.content()
    writeFileSync('dist/index.html', html)
    console.log('pre-render complete: dist/index.html updated')

    await browser.close()
  } finally {
    server.kill()
  }
}

prerender().catch(e => {
  console.error('pre-render failed:', e)
  process.exit(1)
})
