import { useRef } from 'react';
import styles from './Header.module.css';

function IconDownload() {
	return (
		<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
			<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
			<polyline points='7 10 12 15 17 10' />
			<line x1='12' y1='15' x2='12' y2='3' />
		</svg>
	);
}
function IconUpload() {
	return (
		<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
			<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
			<polyline points='17 8 12 3 7 8' />
			<line x1='12' y1='3' x2='12' y2='15' />
		</svg>
	);
}

export default function Header({ onLogout, username, config, onImport }) {
	const initial = username ? username[0].toUpperCase() : '?';
	const fileRef = useRef(null);

	function handleExport() {
		if (!config?.modelId) return;
		const json = JSON.stringify(config, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `config-${config.modelId}-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleImport(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const saved = JSON.parse(ev.target.result);
				onImport?.(saved);
			} catch { /* ignore invalid JSON */ }
		};
		reader.readAsText(file);
		e.target.value = '';
	}

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
				<div className={styles.headerActions}>
					<button
						type='button'
						className={styles.actionBtn}
						onClick={handleExport}
						disabled={!config?.modelId}
						data-tooltip='Экспортировать конфигурацию'
						aria-label='Экспортировать конфигурацию в JSON'
					>
						<IconDownload />
					</button>
					<label
						className={styles.actionBtn}
						data-tooltip='Импортировать конфигурацию'
						aria-label='Импортировать конфигурацию из JSON'
					>
						<input
							ref={fileRef}
							type='file'
							accept='.json'
							onChange={handleImport}
							className={styles.fileInput}
						/>
						<IconUpload />
					</label>
				</div>

				<div className={styles.divider} />

				<div className={styles.userChip}>
					<span className={styles.userAvatar}>{initial}</span>
					<span className={styles.userName}>{username}</span>
					<button
						className={styles.logoutBtn}
						onClick={onLogout}
						type='button'
						aria-label='Выйти'
						data-tooltip='Выйти'
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
