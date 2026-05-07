import { useTranslation, setLang } from '../../i18n'
import { useTheme, setTheme } from '../../hooks/useTheme'
import styles from './Header.module.css'

export default function Header({ notificationSlot }) {
  const { t, lang } = useTranslation()
  const { theme }   = useTheme()

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>⛽</div>
        <div className={styles.logoText}>
          <h1>GASOLINE WORLD</h1>
          <p>{t('header.subtitle')}</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.badge}>
          {t('header.data')}: <span>{t('header.dataPeriod')}</span>
        </div>
        <div className={styles.legend}>
          <span className={styles.dot} style={{ background: 'var(--green)' }} /> &lt; $0.50
          <span className={styles.dot} style={{ background: 'var(--amber)', marginLeft: 14 }} /> $0.50–$1.50
          <span className={styles.dot} style={{ background: 'var(--red)', marginLeft: 14 }} /> &gt; $1.50
        </div>
        {/* Theme toggle */}
        <button
          className={styles.themeBtn}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className={styles.langToggle}>
          <button
            className={`${styles.langBtn} ${lang === 'ru' ? styles.langActive : ''}`}
            onClick={() => setLang('ru')}
          >RU</button>
          <button
            className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
            onClick={() => setLang('en')}
          >EN</button>
        </div>
        {notificationSlot}
      </div>
    </header>
  )
}
