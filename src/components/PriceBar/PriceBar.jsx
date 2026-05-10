import { getPriceRange } from '../../data/gasoline'
import styles from './PriceBar.module.css'

const COLOR = {
  cheap:     'var(--green)',
  medium:    'var(--amber)',
  expensive: 'var(--red)',
}

export default function PriceBar({ usd, fuel, cls }) {
  const { min, max } = getPriceRange(fuel)
  const pct = Math.max(2, Math.min(98, ((usd - min) / (max - min)) * 100))
  const color = COLOR[cls] ?? 'var(--muted)'

  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
      <div className={styles.marker} style={{ left: `${pct}%`, background: color }} />
    </div>
  )
}
