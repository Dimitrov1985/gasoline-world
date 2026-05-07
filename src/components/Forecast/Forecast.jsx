import { useState, useMemo, useCallback } from 'react'
import { DATA, FUELS, getPriceClass } from '../../data/gasoline'
import { generateForecast, getCountrySummary } from '../../data/forecast'
import { useTranslation } from '../../i18n'
import { useTheme } from '../../hooks/useTheme'
import { countryName } from '../../i18n/countryNames'
import styles from './Forecast.module.css'

function pct(a, b) { return (((b - a) / a) * 100).toFixed(1) }
function sign(v)   { return v > 0 ? '+' : '' }

function Chart({ data, fuelKey, hoverIdx, onHover, isDark }) {
  const color = fuelKey === 'diesel' ? '#0ea5e9' : '#f97316'
  const VW = 700, VH = 250
  const PL = 56, PR = 14, PT = 18, PB = 40
  const IW = VW - PL - PR, IH = VH - PT - PB

  const minY = Math.min(...data.map(d => d.lower)) * 0.93
  const maxY = Math.max(...data.map(d => d.upper)) * 1.07
  const xOf  = i => PL + (i / (data.length - 1)) * IW
  const yOf  = v => PT + IH - ((v - minY) / (maxY - minY)) * IH

  function smoothPath(pts) {
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i-1], b = pts[i]
      d += ` C${a.x+(b.x-a.x)*0.45},${a.y} ${a.x+(b.x-a.x)*0.55},${b.y} ${b.x},${b.y}`
    }
    return d
  }

  const linePath = smoothPath(data.map((d, i) => ({ x: xOf(i), y: yOf(d.price) })))
  const bandPath = [
    `M${xOf(0)},${yOf(data[0].upper)}`,
    ...data.map((d, i) => `L${xOf(i)},${yOf(d.upper)}`),
    ...data.slice().reverse().map((d, i) => `L${xOf(data.length-1-i)},${yOf(d.lower)}`),
    'Z',
  ].join(' ')

  const yTicks = Array.from({length: 5}, (_, i) => minY + (maxY - minY) * i / 4)
  const xTicks = data.reduce((a, d, i) => { if (i % 4 === 0) a.push({i, label: d.label}); return a }, [])

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', display: 'block', userSelect: 'none' }}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={yOf(v)} x2={PL+IW} y2={yOf(v)} stroke={isDark ? '#1e2d4a' : '#e2e8f0'} strokeWidth={1} />
            <text x={PL-6} y={yOf(v)+4} textAnchor="end" fill="#64748b" fontSize={10} fontFamily="JetBrains Mono,monospace">${v.toFixed(2)}</text>
          </g>
        ))}
        <path d={bandPath} fill={color} opacity={0.1} />
        <line x1={xOf(0)} y1={PT} x2={xOf(0)} y2={PT+IH} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {hoverIdx !== null && (
          <>
            <line x1={xOf(hoverIdx)} y1={PT} x2={xOf(hoverIdx)} y2={PT+IH} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <circle cx={xOf(hoverIdx)} cy={yOf(data[hoverIdx].price)} r={5} fill={color} stroke="#080c14" strokeWidth={2} />
          </>
        )}
        {xTicks.map(({ i, label }) => (
          <text key={i} x={xOf(i)} y={VH-6} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="JetBrains Mono,monospace">{label}</text>
        ))}
        <rect x={PL} y={PT} width={IW} height={IH} fill="transparent"
          onMouseMove={e => {
            const r = e.currentTarget.closest('svg').getBoundingClientRect()
            const idx = Math.round(((e.clientX - r.left) * (VW / r.width) - PL) / IW * (data.length - 1))
            onHover(Math.max(0, Math.min(data.length - 1, idx)))
          }}
          onMouseLeave={() => onHover(null)}
        />
      </svg>
      {hoverIdx !== null && (
        <div className={styles.chartTooltip}>
          <div className={styles.ctLabel}>{data[hoverIdx].label}</div>
          <div className={styles.ctPrice} style={{ color }}>${data[hoverIdx].price.toFixed(3)}</div>
          <div className={styles.ctRange}>↑ ${data[hoverIdx].upper.toFixed(3)} ↓ ${data[hoverIdx].lower.toFixed(3)}</div>
        </div>
      )}
    </div>
  )
}

function Spark({ points, color }) {
  const prices = points.map(p => p.price)
  const mn = Math.min(...prices), mx = Math.max(...prices)
  const W = 64, H = 24
  const d = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${(i/(points.length-1))*W},${H-((p.price-mn)/(mx-mn+0.0001))*H}`
  ).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Forecast({ fuel, onFuelChange }) {
  const { t, lang }  = useTranslation()
  const { isDark }   = useTheme()
  const [selectedIso,   setSelectedIso]   = useState(643)
  const [horizonMonths, setHorizonMonths] = useState(24)
  const [view,          setView]          = useState('chart')
  const [hoverIdx,      setHoverIdx]      = useState(null)
  const [sortKey,       setSortKey]       = useState('pct24')
  const [sortDir,       setSortDir]       = useState(1)

  const sortedCountries = useMemo(
    () => [...DATA].sort((a, b) => countryName(a.country, lang).localeCompare(countryName(b.country, lang), lang)),
    [lang]
  )

  const country    = DATA.find(d => d.iso === selectedIso) ?? DATA[0]
  const fuelColor  = fuel === 'diesel' ? '#0ea5e9' : '#f97316'
  const forecastData = useMemo(() => generateForecast(country, fuel, horizonMonths), [country, fuel, horizonMonths])
  const summary      = useMemo(() => getCountrySummary(country, fuel), [country, fuel])

  const TREND_META = {
    up2:   { icon: '📈', labelKey: 'trend.up2',   cls: 'trendUp2'   },
    up1:   { icon: '↗',  labelKey: 'trend.up1',   cls: 'trendUp1'   },
    flat:  { icon: '→',  labelKey: 'trend.flat',  cls: 'trendFlat'  },
    down1: { icon: '↘',  labelKey: 'trend.down1', cls: 'trendDown1' },
    down2: { icon: '📉', labelKey: 'trend.down2', cls: 'trendDown2' },
  }

  const trendMeta  = TREND_META[summary.trend]

  const rankingData = useMemo(() => {
    const rows = DATA.map(d => ({ ...d, s: getCountrySummary(d, fuel) }))
    rows.sort((a, b) => {
      if (sortKey === 'name') return countryName(a.country, lang).localeCompare(countryName(b.country, lang), lang) * sortDir
      return (a.s[sortKey] - b.s[sortKey]) * sortDir
    })
    return rows
  }, [fuel, sortKey, sortDir, lang])

  const sparkCache = useMemo(() => {
    const m = {}
    DATA.forEach(d => { m[d.iso] = generateForecast(d, fuel, 24) })
    return m
  }, [fuel])

  const handleHover = useCallback(idx => setHoverIdx(idx), [])

  const SORT_OPTIONS = [
    { key: 'pct24',   label: t('fc.sortChange') },
    { key: 'm24',     label: t('fc.sortPrice24') },
    { key: 'current', label: t('fc.sortCurrent') },
    { key: 'name',    label: t('fc.sortName') },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${view === 'chart' ? styles.tabActive : ''}`} onClick={() => setView('chart')}>{t('fc.chart')}</button>
          <button className={`${styles.tab} ${view === 'ranking' ? styles.tabActive : ''}`} onClick={() => setView('ranking')}>{t('fc.ranking')}</button>
        </div>
        <div className={styles.fuelToggle}>
          {FUELS.map(f => (
            <button key={f.key}
              className={`${styles.fuelBtn} ${fuel === f.key ? styles.fuelActive : ''}`}
              onClick={() => onFuelChange(f.key)}>
              {t(`fuel.${f.key}`)}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' && (
        <div className={styles.chartView}>
          <div className={styles.chartControls}>
            <select className={styles.select} value={selectedIso} onChange={e => setSelectedIso(Number(e.target.value))}>
              {sortedCountries.map(d => (
                <option key={d.iso} value={d.iso}>{d.flag} {countryName(d.country, lang)}</option>
              ))}
            </select>
            <div className={styles.horizonBtns}>
              {[12, 24].map(m => (
                <button key={m} className={`${styles.hBtn} ${horizonMonths === m ? styles.hActive : ''}`} onClick={() => setHorizonMonths(m)}>
                  {m} {t('fc.months')}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.countryHeader}>
            <span className={styles.cFlag}>{country.flag}</span>
            <div>
              <div className={styles.cName}>{countryName(country.country, lang)}</div>
              <div className={styles.cRegion}>{t(`region.${country.region}`)}</div>
            </div>
            <div className={`${styles.trendBadge} ${styles[trendMeta.cls]}`}>
              {trendMeta.icon} {t(trendMeta.labelKey)}
            </div>
          </div>

          <Chart data={forecastData} fuelKey={fuel} hoverIdx={hoverIdx} onHover={handleHover} isDark={isDark} />

          <div className={styles.statsRow}>
            {[
              { label: t('fc.now'),  price: summary.current, ref: null },
              { label: t('fc.6m'),   price: summary.m6,      ref: summary.current },
              { label: t('fc.12m'),  price: summary.m12,     ref: summary.current },
              { label: t('fc.24m'),  price: summary.m24,     ref: summary.current },
            ].map(({ label, price, ref }) => {
              const delta = ref !== null ? pct(ref, price) : null
              const isPos = delta !== null && parseFloat(delta) > 0
              const isNeg = delta !== null && parseFloat(delta) < 0
              return (
                <div key={label} className={styles.statCard}>
                  <div className={styles.statLabel}>{label}</div>
                  <div className={styles.statPrice} style={{ color: fuelColor }}>${price.toFixed(3)}</div>
                  {delta !== null && (
                    <div className={`${styles.statDelta} ${isPos ? styles.pos : isNeg ? styles.neg : styles.neutral}`}>
                      {sign(parseFloat(delta))}{delta}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.bottomSummary}>
            <div className={styles.summaryItem}><span className={styles.sLabel}>{t('fc.min')}</span><span className={styles.sVal} style={{color:'var(--green)'}}>${summary.min.toFixed(3)}</span></div>
            <div className={styles.summaryItem}><span className={styles.sLabel}>{t('fc.max')}</span><span className={styles.sVal} style={{color:'var(--red)'}}>${summary.max.toFixed(3)}</span></div>
            <div className={styles.summaryItem}><span className={styles.sLabel}>{t('fc.change24')}</span><span className={`${styles.sVal} ${parseFloat(summary.pct24) > 0 ? styles.pos : styles.neg}`}>{sign(summary.pct24)}{summary.pct24.toFixed(1)}%</span></div>
            <div className={styles.summaryItem}><span className={styles.sLabel}>{t('fc.localPrice')}</span><span className={styles.sVal}>{country[fuel].local}</span></div>
          </div>
        </div>
      )}

      {view === 'ranking' && (
        <div className={styles.rankingView}>
          <div className={styles.rankingHint}>{t('fc.rankHint', { count: DATA.length })}</div>
          <div className={styles.sortRow}>
            <span className={styles.sortLabel}>{t('fc.sortBy')}:</span>
            {SORT_OPTIONS.map(o => (
              <button key={o.key}
                className={`${styles.sortBtn} ${sortKey === o.key ? styles.sortActive : ''}`}
                onClick={() => { if (sortKey === o.key) setSortDir(d => -d); else { setSortKey(o.key); setSortDir(1) } }}>
                {o.label}{sortKey === o.key ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
          </div>
          <div className={styles.rankTable}>
            <table>
              <thead>
                <tr>
                  <th>#</th><th></th><th>{t('table.country')}</th>
                  <th>{t('fc.now')}</th><th>{t('fc.12m')}</th><th>{t('fc.24m')}</th>
                  <th>Δ 24{t('fc.months')}</th><th>{lang === 'en' ? 'Trend' : 'Тренд'}</th>
                  <th>{lang === 'en' ? 'Chart' : 'График'}</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((d, idx) => {
                  const s   = d.s
                  const tm  = TREND_META[s.trend]
                  const sp  = sparkCache[d.iso]
                  const cls = getPriceClass(s.current)
                  const isPos = s.pct24 > 0
                  return (
                    <tr key={d.iso}
                      className={d.iso === selectedIso ? styles.activeRow : ''}
                      onClick={() => { setSelectedIso(d.iso); setView('chart') }}>
                      <td className={styles.tdNum}>{idx+1}</td>
                      <td className={styles.tdFlag}>{d.flag}</td>
                      <td className={styles.tdName}>{countryName(d.country, lang)}</td>
                      <td className={`${styles.tdPrice} ${styles[cls]}`}>${s.current.toFixed(3)}</td>
                      <td className={styles.tdForecast}>${s.m12.toFixed(3)}</td>
                      <td className={styles.tdForecast}>${s.m24.toFixed(3)}</td>
                      <td className={`${styles.tdPct} ${isPos ? styles.pos : styles.neg}`}>{sign(s.pct24)}{s.pct24.toFixed(1)}%</td>
                      <td className={`${styles.tdTrend} ${styles[tm.cls]}`}>{tm.icon} {t(tm.labelKey)}</td>
                      <td className={styles.tdSpark}><Spark points={sp} color={fuelColor} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
