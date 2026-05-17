/**
 * Generates public/og-image.png (1200×630) using Playwright.
 * Run: node scripts/generate-og-image.mjs
 */

import { chromium }    from 'playwright'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT  = join(ROOT, 'public', 'og-image.png')

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #0a0a0f;
    font-family: 'Rajdhani', sans-serif;
    color: #fff;
    position: relative;
  }

  /* grid background */
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(226,187,4,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(226,187,4,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* glow */
  .glow {
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(226,187,4,0.15) 0%, transparent 70%);
    top: -150px; left: -100px;
  }
  .glow2 {
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(226,187,4,0.08) 0%, transparent 70%);
    bottom: -100px; right: 50px;
  }

  .content {
    position: relative; z-index: 2;
    padding: 60px 80px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .top {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .fuel-icon {
    font-size: 48px;
    line-height: 1;
  }
  .brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 52px;
    letter-spacing: 4px;
    color: #e2bb04;
    text-shadow: 0 0 30px rgba(226,187,4,0.5);
  }

  .headline {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 96px;
    line-height: 1;
    letter-spacing: 2px;
    color: #fff;
    text-shadow: 0 0 60px rgba(255,255,255,0.1);
  }
  .headline span { color: #e2bb04; }

  .sub {
    font-size: 28px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    letter-spacing: 1px;
    margin-top: 12px;
  }

  .stats {
    display: flex;
    gap: 48px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 42px;
    color: #e2bb04;
    letter-spacing: 2px;
  }
  .stat-label {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .url {
    font-size: 22px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 2px;
  }
  .badge {
    background: rgba(226,187,4,0.15);
    border: 1px solid rgba(226,187,4,0.4);
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 20px;
    font-weight: 700;
    color: #e2bb04;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="glow2"></div>
  <div class="content">
    <div class="top">
      <div class="fuel-icon">⛽</div>
      <div class="brand">GASOLINE WORLD</div>
    </div>

    <div>
      <div class="headline">ЦЕНЫ НА<br><span>ТОПЛИВО</span> В МИРЕ</div>
      <div class="sub">Бензин · Дизель · 170+ стран · Ежедневное обновление</div>
    </div>

    <div class="bottom">
      <div class="stats">
        <div class="stat">
          <div class="stat-value">170+</div>
          <div class="stat-label">Стран</div>
        </div>
        <div class="stat">
          <div class="stat-value">$1.52</div>
          <div class="stat-label">Средняя цена</div>
        </div>
        <div class="stat">
          <div class="stat-value">$0.02</div>
          <div class="stat-label">Минимум</div>
        </div>
      </div>
      <div class="url">gasoline-world.vercel.app</div>
    </div>
  </div>
</body>
</html>`

const browser = await chromium.launch({ headless: true })
const page    = await browser.newPage()
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(HTML, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

const buffer = await page.screenshot({ type: 'png' })
writeFileSync(OUT, buffer)
await browser.close()

console.log(`✅ OG image saved to ${OUT}`)
