import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cx } from '../../utils/cx.js';
import styles from './Notification.module.css';

function IconOk() {
	return (
		<svg width='13' height='13' viewBox='0 0 14 14' fill='none' aria-hidden='true'>
			<path d='M2.5 7L5.5 10L11.5 4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

function IconError() {
	return (
		<svg width='13' height='13' viewBox='0 0 14 14' fill='none' aria-hidden='true'>
			<path d='M2.5 2.5L11.5 11.5M11.5 2.5L2.5 11.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
		</svg>
	);
}

export default function Notification({
	visible = false,
	status = 'ok',
	title,
	children,
	autoCloseDelay = 2000,
	onCloseTimeout,
	onCloserClick,
}) {
	const timerRef = useRef(null);

	useEffect(() => {
		if (!visible) return;
		timerRef.current = setTimeout(() => {
			onCloseTimeout?.() ?? onCloserClick?.();
		}, autoCloseDelay);
		return () => clearTimeout(timerRef.current);
	}, [visible, autoCloseDelay, onCloseTimeout, onCloserClick]);

	return createPortal(
		<AnimatePresence>
			{visible && (
				<motion.div
					className={styles.toast}
					style={{ top: 20, right: 20 }}
					initial={{ opacity: 0, y: -10, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -8, scale: 0.97 }}
					transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
				>
					<div className={cx(styles.accent, status === 'ok' ? styles.accentOk : styles.accentError)} />
					<div className={styles.body}>
						{title && (
							<p className={styles.title}>
								<span className={cx(styles.statusIcon, status === 'ok' ? styles.iconOk : styles.iconError)}>
									{status === 'ok' ? <IconOk /> : <IconError />}
								</span>
								{title}
							</p>
						)}
						{children && <p className={styles.desc}>{children}</p>}
					</div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
