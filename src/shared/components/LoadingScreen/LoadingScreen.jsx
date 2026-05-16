import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import styles from './LoadingScreen.module.css';

const SPIN = 0.6;
const STEP = 0.95;
const CYCLE = STEP * 3;

function LockerIcon() {
	return (
		<svg width='32' height='40' viewBox='0 0 28 36' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
			<rect x='2' y='2' width='24' height='32' rx='1.5' />
			<line x1='2' y1='18' x2='26' y2='18' />
			<circle cx='14' cy='11' r='2.5' />
			<circle cx='14' cy='27' r='2.5' />
			<line x1='8' y1='6' x2='20' y2='6' />
			<line x1='8' y1='8.5' x2='20' y2='8.5' />
			<line x1='8' y1='22' x2='20' y2='22' />
			<line x1='8' y1='24.5' x2='20' y2='24.5' />
		</svg>
	);
}

function SafeIcon() {
	return (
		<svg width='40' height='36' viewBox='0 0 36 32' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
			<rect x='2' y='2' width='32' height='28' rx='2' />
			<circle cx='16' cy='16' r='7' />
			<circle cx='16' cy='16' r='3' />
			<line x1='16' y1='9' x2='16' y2='13' />
			<rect x='28' y='8' width='4' height='5' rx='1' />
			<rect x='28' y='19' width='4' height='5' rx='1' />
		</svg>
	);
}

function DoorIcon() {
	return (
		<svg width='32' height='40' viewBox='0 0 28 36' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
			<rect x='2' y='2' width='24' height='32' rx='1.5' />
			<rect x='5.5' y='5.5' width='17' height='25' rx='1' />
			<circle cx='19' cy='18' r='2' />
			<line x1='4' y1='8' x2='7' y2='8' />
			<line x1='4' y1='12' x2='7' y2='12' />
			<line x1='4' y1='24' x2='7' y2='24' />
			<line x1='4' y1='28' x2='7' y2='28' />
		</svg>
	);
}

const ICONS = [LockerIcon, SafeIcon, DoorIcon];

export default function LoadingScreen() {
	const [activeIcon, setActiveIcon] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setActiveIcon(prev => (prev + 1) % 3);
		}, STEP * 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<motion.div
			className={styles.overlay}
			exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
		>
			<div className={styles.content}>
				{/* Лого — въезжает сверху */}
				<motion.img
					src='/img/brand/logo.svg'
					alt='Промет'
					className={styles.logo}
					initial={{ opacity: 0, y: -16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
				/>

				{/* Иконки — въезжают снизу с задержкой */}
				<div className={styles.iconsRow}>
					{ICONS.map((Icon, i) => (
						<motion.div
							key={i}
							className={styles.iconWrap}
							initial={{ opacity: 0, y: 16 }}
							animate={{
								opacity: activeIcon === i ? 1 : 0.2,
								y: 0,
								scale: activeIcon === i ? [1, 1.14, 1] : 1,
							}}
							transition={{
								y: { duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.18 + i * 0.08 },
								opacity: { duration: 0.3 },
								scale: { duration: SPIN, ease: [0.4, 0, 0.6, 1] },
							}}
						>
							{/* Вращение */}
							<motion.div
								animate={{ rotate: [0, 360] }}
								transition={{
									duration: SPIN,
									ease: [0.4, 0, 0.6, 1],
									repeat: Infinity,
									repeatDelay: CYCLE - SPIN,
									delay: i * STEP,
								}}
							>
								<Icon />
							</motion.div>
						</motion.div>
					))}
				</div>
			</div>
		</motion.div>
	);
}
