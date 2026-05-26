import { Link } from 'react-router';
import styles from './AdminPage.module.css';

export default function AdminPage({ onLogout, username }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/configurator" className={styles.backLink}>
          ← Конфигуратор
        </Link>
        <span className={styles.title}>Панель администратора</span>
        <div className={styles.userArea}>
          <span className={styles.username}>{username}</span>
          <button
            className={styles.logoutBtn}
            onClick={onLogout}
            type="button"
            aria-label="Выйти"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <p className={styles.placeholder}>Каталог и коэффициенты — Phase 8+</p>
      </main>
    </div>
  );
}
