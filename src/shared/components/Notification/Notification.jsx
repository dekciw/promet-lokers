import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import styles from './Notification.module.css';

function IconOk() {
	return (
		<span className={`${styles.iconWrap} ${styles.iconOk}`}>
			<svg width='18' height='18' viewBox='0 0 18 18' fill='none'>
				<path d='M4 9.5L7.5 13L14 6' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
			</svg>
		</span>
	);
}

function IconError() {
	return (
		<span className={`${styles.iconWrap} ${styles.iconError}`}>
			<svg width='18' height='18' viewBox='0 0 18 18' fill='none'>
				<path d='M5.5 5.5L12.5 12.5M12.5 5.5L5.5 12.5' stroke='white' strokeWidth='2' strokeLinecap='round' />
			</svg>
		</span>
	);
}

export default function Notification({
	visible = false,
	status = 'ok',
	title,
	children,
	stickTo = 'left',
	offset = 20,
	hasCloser = true,
	autoCloseDelay = 5000,
	onCloseTimeout,
	onCloserClick,
}) {
	const timerRef = useRef(null);

	useEffect(() => {
		if (!visible) return;
		timerRef.current = setTimeout(() => {
			onCloseTimeout?.();
		}, autoCloseDelay);
		return () => clearTimeout(timerRef.current);
	}, [visible, autoCloseDelay, onCloseTimeout]);

	const positionStyle = {
		top: offset,
		...(stickTo === 'left' ? { left: 20 } : { right: 20 }),
	};

	return createPortal(
		<AnimatePresence>
			{visible && (
				<motion.div
					className={styles.notification}
					style={positionStyle}
					initial={{ opacity: 0, y: -12, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -10, scale: 0.96 }}
					transition={{ type: 'spring', stiffness: 280, damping: 26 }}
				>
					{status === 'ok' ? <IconOk /> : <IconError />}

					<div className={styles.body}>
						{title && <p className={styles.title}>{title}</p>}
						{children && <p className={styles.desc}>{children}</p>}
					</div>

					{hasCloser && (
						<button
							className={styles.closer}
							onClick={onCloserClick}
							aria-label='Закрыть'
							type='button'
						>
							<svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
								<path d='M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
							</svg>
						</button>
					)}
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
