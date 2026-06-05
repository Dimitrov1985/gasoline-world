import { useTranslation, setLang } from '../../i18n'
import { useTheme, setTheme } from '../../hooks/useTheme'
import styles from './Header.module.css'

export default function Header({ notificationSlot, onLogoClick }) {
  const { t, lang } = useTranslation()
  const { theme }   = useTheme()

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : 'default' }}>
        <div className={styles.logoIcon}>⛽</div>
        <div className={styles.logoText}>
          <h1>GASOLINE WORLD</h1>
          <p>{t('header.subtitle')}</p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.badge}>
          <span className={styles.liveDot} />
          {t('header.data')}: <span>{t('header.dataPeriod')}</span>
        </div>

        <div className={styles.divider} />

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
