import styles from './Header.module.css';

export default function Header({ onLogout }) {
	return (
		<header className={styles.header}>
			<div className={styles.brand}>
				<img className={styles.logo} src='/img/brand/logo.svg' alt='Промет' />
				<div className={styles.divider} />
				<div className={styles.info}>
					<span className={styles.tagline}>Калькулятор коррекции</span>
					<span className={styles.tagline}>цен и передачи локеров</span>
				</div>
			</div>

			<img
				className={styles.decoIcons}
				src='/img/header/header-icons.svg'
				alt=''
				aria-hidden='true'
			/>

			<div className={styles.userArea}>
				<button className={styles.userBtn} onClick={onLogout} type='button'>
					<img src='/img/header/btn-logout.svg' alt='Выйти' className={styles.userBtnImg} />
				</button>
			</div>
		</header>
	);
}
