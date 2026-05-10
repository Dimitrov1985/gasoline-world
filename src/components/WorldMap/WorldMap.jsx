import { useState, useCallback, useMemo, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { DATA, getPriceClass, getPriceRange, FUELS } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import { useTheme } from '../../hooks/useTheme'
import { countryName } from '../../i18n/countryNames'
import styles from './WorldMap.module.css'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const isoMap = {}
DATA.forEach(d => { isoMap[d.iso] = d })

function choroplethColor(usd, minUsd, maxUsd, isDark) {
  const t   = Math.max(0, Math.min(1, (usd - minUsd) / (maxUsd - minUsd)))
  const hue = Math.round(118 - t * 118)   // 118 (green) → 0 (red)
  const sat = isDark ? 62 : 58
  const lit = isDark ? 34 : 44
  return `hsl(${hue},${sat}%,${lit}%)`
}

function getFill(d, fuel, hovered, selected, isDark, minUsd, maxUsd) {
  if (!d) return isDark ? '#19253a' : '#cdd5e2'
  if (selected) return '#f97316'
  if (hovered)  return '#fb923c'
  return choroplethColor(d[fuel].usd, minUsd, maxUsd, isDark)
}

export default function WorldMap({ fuel, selectedIso, onSelect }) {
  const { t, lang }  = useTranslation()
  const { isDark }   = useTheme()
  const [tooltip,    setTooltip]    = useState(null)
  const [pos,        setPos]        = useState({ x: 0, y: 0 })
  const [hoveredIso, setHoveredIso] = useState(null)
  const [zoom,       setZoom]       = useState(1)
  const hideTimer                   = useRef(null)

  const { min: minUsd, max: maxUsd } = useMemo(() => getPriceRange(fuel), [fuel])

  const rankMap = useMemo(() => {
    const sorted = [...DATA].sort((a, b) => a[fuel].usd - b[fuel].usd)
    const m = {}
    sorted.forEach((d, i) => { m[d.iso] = i + 1 })
    return m
  }, [fuel])

  const handleMouseMove = useCallback((e) => setPos({ x: e.clientX, y: e.clientY }), [])

  const showTooltip  = (d) => { clearTimeout(hideTimer.current); setTooltip(d) }
  const scheduleHide = ()  => { hideTimer.current = setTimeout(() => setTooltip(null), 120) }
  const cancelHide   = ()  => clearTimeout(hideTimer.current)

  const ttLeft = pos.x + 16 + 240 > window.innerWidth ? pos.x - 256 : pos.x + 16

  const legendGradient = isDark
    ? 'linear-gradient(to right, hsl(118,62%,34%), hsl(59,62%,34%), hsl(0,62%,34%))'
    : 'linear-gradient(to right, hsl(118,58%,44%), hsl(59,58%,44%), hsl(0,58%,44%))'

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>{t('map.title')}</span>
        <span className={styles.hint}>{t('map.hint')}</span>
        <div className={styles.legend}>
          <span className={styles.legendLabel}>${minUsd.toFixed(2)}</span>
          <div className={styles.legendBar} style={{ background: legendGradient }} />
          <span className={styles.legendLabel}>${maxUsd.toFixed(2)}</span>
        </div>
        <div className={styles.zoomBtns}>
          <button onClick={() => setZoom(z => Math.min(z * 1.5, 8))}>+</button>
          <button onClick={() => setZoom(z => Math.max(z / 1.5, 1))}>−</button>
          <button onClick={() => setZoom(1)}>{t('map.reset')}</button>
        </div>
      </div>

      <div className={styles.mapWrap} onMouseMove={handleMouseMove}
        style={{ background: isDark ? '#0a1120' : '#dde4ee' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [10, 15] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={zoom} minZoom={1} maxZoom={8}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const isoNum     = parseInt(geo.id, 10)
                  const d          = isoMap[isoNum]
                  const isHover    = hoveredIso === isoNum
                  const isSelected = isoNum === selectedIso
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFill(d, fuel, isHover, isSelected, isDark, minUsd, maxUsd)}
                      stroke={isDark ? '#0a1120' : '#f1f5f9'}
                      strokeWidth={isSelected ? 0 : 0.4}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: d ? '#fb923c' : '#243552', cursor: d ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => { setHoveredIso(isoNum); if (d) showTooltip(d) }}
                      onMouseLeave={() => { setHoveredIso(null); scheduleHide() }}
                      onClick={() => { if (d) onSelect(isoNum) }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {tooltip && (() => {
        const rank = rankMap[tooltip.iso] ?? '—'
        const pct  = Math.max(2, Math.min(98, ((tooltip[fuel].usd - minUsd) / (maxUsd - minUsd)) * 100))
        const cls  = getPriceClass(tooltip[fuel].usd)
        const barColor = cls === 'cheap' ? 'var(--green)' : cls === 'medium' ? 'var(--amber)' : 'var(--red)'
        return (
          <div
            className={styles.tooltip}
            style={{ left: ttLeft, top: pos.y - 10 }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            {/* Head */}
            <div className={styles.ttHead}>
              <span className={styles.ttFlag}>{tooltip.flag}</span>
              <div className={styles.ttHeadText}>
                <span className={styles.ttName}>{countryName(tooltip.country, lang)}</span>
                <span className={styles.ttRegion}>{t(`region.${tooltip.region}`)}</span>
              </div>
              <span className={styles.ttRank}>#{rank}<span className={styles.ttRankOf}>/{DATA.length}</span></span>
            </div>

            {/* Fuel prices */}
            <div className={styles.ttFuelRow}>
              {FUELS.map(f => {
                const p   = tooltip[f.key]
                const c   = getPriceClass(p.usd)
                return (
                  <div key={f.key} className={`${styles.ttFuelBlock} ${fuel === f.key ? styles.ttFuelActive : ''}`}>
                    <div className={styles.ttFuelLabel}>{t(`fuel.${f.key}`)}</div>
                    <div className={`${styles.ttPrice} ${styles[c]}`}>${p.usd.toFixed(3)}</div>
                    <div className={styles.ttLocal}>{p.local}</div>
                  </div>
                )
              })}
            </div>

            {/* Price position bar */}
            <div className={styles.ttBarWrap}>
              <span className={styles.ttBarLabel}>${minUsd.toFixed(2)}</span>
              <div className={styles.ttBarTrack}>
                <div className={styles.ttBarFill} style={{ width: `${pct}%`, background: barColor }} />
                <div className={styles.ttBarDot}  style={{ left: `${pct}%`,  background: barColor }} />
              </div>
              <span className={styles.ttBarLabel}>${maxUsd.toFixed(2)}</span>
            </div>

            {/* CTA */}
            <button
              className={styles.ttCta}
              onMouseDown={e => { e.stopPropagation(); onSelect(tooltip.iso) }}
            >
              ⚡ {lang === 'en' ? 'Open in calculator →' : 'Открыть в калькуляторе →'}
            </button>
          </div>
        )
      })()}
    </section>
  )
}
