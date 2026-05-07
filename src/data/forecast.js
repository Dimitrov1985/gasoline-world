// Seeded PRNG (mulberry32) — reproducible, same seed = same forecast every render
function seededRng(seed) {
  let s = (seed ^ 0x9e3779b9) >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

// Regional macroeconomic params (monthly trend % + noise level)
const PARAMS = {
  'Европа':       { trend:  0.0000, vol: 0.014, seasonAmp: 0.016 },
  'Сев. Америка': { trend:  0.0010, vol: 0.020, seasonAmp: 0.018 },
  'Азия':         { trend:  0.0012, vol: 0.022, seasonAmp: 0.010 },
  'Африка':       { trend:  0.0032, vol: 0.038, seasonAmp: 0.007 },
  'Ю. Америка':   { trend:  0.0022, vol: 0.040, seasonAmp: 0.012 },
  'Океания':      { trend:  0.0006, vol: 0.016, seasonAmp: 0.018 },
}

const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

function fmt(date) {
  return `${MONTHS_RU[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`
}

export function generateForecast(country, fuel, horizonMonths = 24) {
  const p   = PARAMS[country.region] ?? { trend: 0.001, vol: 0.025, seasonAmp: 0.012 }
  const base = country[fuel].usd
  const rng  = seededRng(country.iso * (fuel === 'diesel' ? 137 : 79) + horizonMonths)

  // Start from May 2026
  const origin = new Date(2026, 4, 1)
  const points = []

  points.push({ label: fmt(origin), price: base, upper: base, lower: base, isCurrent: true })

  let price = base

  for (let i = 1; i <= horizonMonths; i++) {
    const date = new Date(2026, 4 + i, 1)

    // Trend
    price = price * (1 + p.trend)

    // Seasonality — northern-hemisphere summer peak
    const seasonalPhase = ((date.getMonth() - 5) / 12) * 2 * Math.PI
    const seasonal = Math.sin(seasonalPhase) * p.seasonAmp

    // Box-Muller noise
    const u1 = Math.max(rng(), 1e-9), u2 = rng()
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * p.vol * 0.45

    const raw = Math.max(0.01, price * (1 + seasonal + noise))

    // Confidence interval grows with horizon
    const ciGrowth = 1 + (i / horizonMonths) * 1.8
    const ci = p.vol * base * ciGrowth * 0.75

    points.push({
      label: fmt(date),
      price: Math.round(raw * 1000) / 1000,
      upper: Math.round((raw + ci) * 1000) / 1000,
      lower: Math.round(Math.max(0.01, raw - ci) * 1000) / 1000,
      isCurrent: false,
    })
  }

  return points
}

export function getCountrySummary(country, fuel) {
  const pts  = generateForecast(country, fuel, 24)
  const cur  = pts[0].price
  const m6   = pts[6]?.price  ?? cur
  const m12  = pts[12]?.price ?? cur
  const m24  = pts[24]?.price ?? cur
  const allP = pts.map(d => d.price)
  const pct24 = ((m24 - cur) / cur) * 100

  return {
    current:  cur,
    m6, m12, m24,
    min: Math.min(...allP),
    max: Math.max(...allP),
    pct24,
    trend: pct24 > 5 ? 'up2' : pct24 > 1.5 ? 'up1' : pct24 < -5 ? 'down2' : pct24 < -1.5 ? 'down1' : 'flat',
  }
}
