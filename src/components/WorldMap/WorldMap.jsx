import { useState, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { DATA, getPriceClass, FUELS } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import { useTheme } from '../../hooks/useTheme'
import { countryName } from '../../i18n/countryNames'
import styles from './WorldMap.module.css'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const isoMap = {}
DATA.forEach(d => { isoMap[d.iso] = d })

function getFill(d, fuel, hovered, selected, isDark) {
  if (!d) return isDark ? '#19253a' : '#cdd5e2'
  if (selected) return '#f97316'
  if (hovered)  return '#fb923c'
  const usd = d[fuel].usd
  if (usd < 0.5)  return isDark ? '#166534' : '#16a34a'
  if (usd <= 1.5) return isDark ? '#92400e' : '#c2620a'
  return isDark ? '#991b1b' : '#b91c1c'
}

export default function WorldMap({ fuel, selectedIso, onSelect }) {
  const { t, lang }  = useTranslation()
  const { isDark }   = useTheme()
  const [tooltip,    setTooltip]    = useState(null)
  const [pos,        setPos]        = useState({ x: 0, y: 0 })
  const [hoveredIso, setHoveredIso] = useState(null)
  const [zoom,       setZoom]       = useState(1)

  const handleMouseMove = useCallback((e) => setPos({ x: e.clientX, y: e.clientY }), [])

  const fuelLabel = FUELS.find(f => f.key === fuel)
  const ttLeft = pos.x + 16 + 220 > window.innerWidth ? pos.x - 236 : pos.x + 16

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>{t('map.title')}</span>
        <span className={styles.hint}>{t('map.hint')}</span>
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
                      fill={getFill(d, fuel, isHover, isSelected, isDark)}
                      stroke={isDark ? '#0a1120' : '#f1f5f9'}
                      strokeWidth={isSelected ? 0 : 0.4}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: d ? '#fb923c' : '#243552', cursor: d ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => { setHoveredIso(isoNum); if (d) setTooltip(d) }}
                      onMouseLeave={() => { setHoveredIso(null); setTooltip(null) }}
                      onClick={() => { if (d) onSelect(isoNum) }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {tooltip && (
        <div className={styles.tooltip} style={{ left: ttLeft, top: pos.y - 10 }}>
          <div className={styles.ttHead}>
            <span className={styles.ttFlag}>{tooltip.flag}</span>
            <span className={styles.ttName}>{countryName(tooltip.country, lang)}</span>
          </div>
          <div className={styles.ttFuelRow}>
            {FUELS.map(f => {
              const p   = tooltip[f.key]
              const cls = getPriceClass(p.usd)
              return (
                <div key={f.key} className={`${styles.ttFuelBlock} ${fuel === f.key ? styles.ttFuelActive : ''}`}>
                  <div className={styles.ttFuelLabel}>{t(`fuel.${f.key}`)}</div>
                  <div className={`${styles.ttPrice} ${styles[cls]}`}>${p.usd.toFixed(3)}</div>
                  <div className={styles.ttLocal}>{p.local}</div>
                </div>
              )
            })}
          </div>
          <div className={styles.ttRegion}>{t(`region.${tooltip.region}`)}</div>
        </div>
      )}
    </section>
  )
}
