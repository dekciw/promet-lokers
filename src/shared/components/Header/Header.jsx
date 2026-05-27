import { Link } from 'react-router';
import styles from './Header.module.css';

export default function Header({ onLogout, username, isAdmin }) {
	const initial = username ? username[0].toUpperCase() : '?';

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
				<Link to="/history" className={styles.adminLink} aria-label="История скачанных КП">
					История
				</Link>
				{isAdmin && (
					<Link to="/admin" className={styles.adminLink}>
						Админ
					</Link>
				)}
				<div className={styles.userChip}>
					<span className={styles.userAvatar}>{initial}</span>
					<span className={styles.userName}>{username}</span>
					<button
						className={styles.logoutBtn}
						onClick={onLogout}
						type='button'
						aria-label='Выйти'
						title='Выйти'
					>
						<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
							<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
							<polyline points='16 17 21 12 16 7' />
							<line x1='21' y1='12' x2='9' y2='12' />
						</svg>
					</button>
				</div>
			</div>
		</header>
	);
}
