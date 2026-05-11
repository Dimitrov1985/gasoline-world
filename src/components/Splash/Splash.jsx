import { useState, useEffect } from 'react'
import styles from './Splash.module.css'

export default function Splash({ onDone }) {
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 1400)
    const t2 = setTimeout(() => onDone(), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className={`${styles.splash} ${hiding ? styles.hiding : ''}`}>
      <div className={styles.drop}>
        <svg className={styles.dropSvg} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M40 8 C40 8 16 36 16 50 C16 63.8 27.2 74 40 74 C52.8 74 64 63.8 64 50 C64 36 40 8 40 8Z"
            fill="#f97316"
          />
          <path
            d="M28 42 C28 42 24 50 24 54 C24 57 26.5 59 29 58"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35"
          />
        </svg>
      </div>

      <div className={styles.title}>GASOLINE WORLD</div>
      <div className={styles.subtitle}>Мировые цены на топливо</div>

      <div className={styles.bar}>
        <div className={styles.barFill} />
      </div>
    </div>
  )
}
