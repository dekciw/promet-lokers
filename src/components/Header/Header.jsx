import styles from './Header.module.css';

export function Header() {
	return (
		<header className={styles.header}>
			<div className={styles.brand}>
				<img className={styles.logo} src='/img/logo.svg' alt='Промет' />
				<div className={styles.info}>
					<span className={styles.siteName}>safe.ru</span>
					<span className={styles.tagline}>Калькулятор коррекции цен и передачи локеров</span>
				</div>
			</div>

			<div className={styles.deco} aria-hidden='true'>
				<img className={styles.logo2} src='/img/logo2.svg' alt='' />
			</div>

			{/* Личный кабинет — временно скрыт (Этап 4)
			<div className={styles.account}>
				<img className={styles.accountIcon} src='/img/account.svg' alt='' />
				<span className={styles.accountText}>Личный кабинет</span>
			</div>
			*/}
		</header>
	);
}
