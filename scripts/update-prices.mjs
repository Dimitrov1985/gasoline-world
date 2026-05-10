/**
 * Scrapes GlobalPetrolPrices.com using Playwright (headless Chromium).
 * Run locally:  npx playwright install chromium && node scripts/update-prices.mjs
 * In CI: handled by .github/workflows/update-prices.yml
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath }               from 'node:url'
import { dirname, join }               from 'node:path'

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT     = join(ROOT, 'src/data/prices.json')
const CURRENT = JSON.parse(readFileSync(OUT, 'utf8'))

// English name → ISO numeric code
const EN_TO_ISO = {
  'Nigeria':566,'Libya':434,'Algeria':12,'Egypt':818,'Morocco':504,
  'South Africa':710,'Kenya':404,'Ethiopia':231,'Sudan':729,'Tunisia':788,
  'Ghana':288,'Senegal':686,'Cameroon':120,"Ivory Coast":384,"Côte d'Ivoire":384,
  'Angola':24,'Tanzania':834,'Mozambique':508,'Zimbabwe':716,'Zambia':894,
  'Uganda':800,'DR Congo':180,'Congo':180,'Namibia':516,'Madagascar':450,
  'Mali':466,'Niger':562,'Burkina Faso':854,'Rwanda':646,'Somalia':706,
  'Iran':364,'Kuwait':414,'Saudi Arabia':682,'UAE':784,
  'United Arab Emirates':784,'Qatar':634,'Iraq':368,'Jordan':400,
  'Israel':376,'Oman':512,'Bahrain':48,'Lebanon':422,
  'Russia':643,'Kazakhstan':398,'Azerbaijan':31,
  'Turkmenistan':795,'Uzbekistan':860,
  'Afghanistan':4,'Nepal':524,'Sri Lanka':144,
  'Pakistan':586,'India':356,'Bangladesh':50,
  'Myanmar':104,'Philippines':608,'Cambodia':116,
  'Mongolia':496,'Thailand':764,'Vietnam':704,
  'Indonesia':360,'Malaysia':458,'China':156,
  'South Korea':410,'Korea, South':410,'Japan':392,'Taiwan':158,
  'Singapore':702,'Turkey':792,'Norway':578,
  'Netherlands':528,'Denmark':208,'Sweden':752,
  'Finland':246,'Germany':276,'France':250,
  'United Kingdom':826,'UK':826,'Italy':380,'Spain':724,
  'Portugal':620,'Greece':300,'Austria':40,
  'Switzerland':756,'Poland':616,'Ukraine':804,
  'Belarus':112,'Romania':642,'Hungary':348,
  'Czech Republic':203,'Czechia':203,'Bulgaria':100,'Serbia':688,
  'Croatia':191,'Belgium':56,'Ireland':372,
  'Lithuania':440,'Latvia':428,'Estonia':233,
  'Moldova':498,'Slovakia':703,'Slovenia':705,
  'USA':840,'United States':840,'Canada':124,'Mexico':484,
  'Venezuela':862,'Brazil':76,'Argentina':32,'Chile':152,
  'Colombia':170,'Peru':604,'Bolivia':68,
  'Ecuador':218,'Paraguay':600,'Uruguay':858,
  'Guatemala':320,'Cuba':192,'Panama':591,
  'Australia':36,'New Zealand':554,
  'Hong Kong':344,'Luxembourg':442,'Iceland':352,
  'Cyprus':196,'Malta':470,'Albania':8,
  'Armenia':51,'Georgia':268,'Kyrgyzstan':417,'Tajikistan':762,
}

async function scrapeWithPlaywright(url) {
  let chromium
  try {
    const pw = await import('playwright')
    chromium = pw.chromium
  } catch {
    throw new Error('Playwright not installed. Run: npx playwright install chromium')
  }

  const browser = await chromium.launch({ headless: true })
  const page    = await browser.newPage()

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  })

  console.log(`  → Opening ${url}`)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

  // Wait for the price table to appear
  await page.waitForSelector('table tbody tr td', { timeout: 15000 }).catch(() => {
    console.warn('  ⚠ Table selector timeout — page may not have loaded fully')
  })

  const prices = await page.evaluate((enToIso) => {
    const result = {}
    const rows = document.querySelectorAll('table tbody tr')

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'))
      if (cells.length < 3) continue

      const country = cells[0]?.textContent?.trim()?.replace(/\*/g, '')
      if (!country) continue

      // Column index for USD price — GlobalPetrolPrices shows:
      // 0: Country  1: Local/EUR  2: USD/liter  3: USD/gallon  ...
      const usdRaw = cells[2]?.textContent?.trim()
      const usd = parseFloat(usdRaw)

      if (!isNaN(usd) && usd > 0 && usd < 10) {
        const iso = enToIso[country]
        if (iso) result[iso] = Math.round(usd * 1000) / 1000
      }
    }
    return result
  }, EN_TO_ISO)

  await browser.close()
  return prices
}

async function run() {
  console.log('=== Gasoline World — Price Updater ===\n')

  let petrol = {}, diesel = {}

  try {
    console.log('⛽  Petrol prices...')
    petrol = await scrapeWithPlaywright('https://www.globalpetrolprices.com/gasoline_prices/')
    console.log(`  ✓ Got ${Object.keys(petrol).length} countries`)
  } catch (e) {
    console.error('  ✗', e.message)
    console.error('  → Keeping existing petrol prices')
    petrol = {}
  }

  try {
    console.log('\n🛢  Diesel prices...')
    diesel = await scrapeWithPlaywright('https://www.globalpetrolprices.com/diesel_prices/')
    console.log(`  ✓ Got ${Object.keys(diesel).length} countries`)
  } catch (e) {
    console.error('  ✗', e.message)
    console.error('  → Keeping existing diesel prices')
    diesel = {}
  }

  const anyUpdated = Object.keys(petrol).length > 0 || Object.keys(diesel).length > 0
  if (!anyUpdated) {
    console.log('\n⚠ No new data fetched — prices.json unchanged')
    process.exit(0)
  }

  const output = {
    lastUpdated: new Date().toISOString().split('T')[0],
    source:      'https://www.globalpetrolprices.com',
    petrol:      { ...CURRENT.petrol, ...petrol },
    diesel:      { ...CURRENT.diesel, ...diesel },
  }

  writeFileSync(OUT, JSON.stringify(output, null, 2))
  console.log(`\n✅ Updated ${Object.keys(petrol).length} petrol + ${Object.keys(diesel).length} diesel prices`)
  console.log(`   Saved to ${OUT}`)
  console.log(`   Date: ${output.lastUpdated}`)
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
