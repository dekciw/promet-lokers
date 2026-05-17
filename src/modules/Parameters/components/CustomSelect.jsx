import { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClickOutside } from '../../../shared/hooks/useClickOutside';
import styles from './Parameters.module.css';

const dropdownVariants = {
	hidden: { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
	visible: {
		clipPath: 'inset(0 0 0% 0)',
		opacity: 1,
		transition: {
			duration: 0.22,
			ease: [0.23, 1, 0.32, 1],
			staggerChildren: 0.025,
			delayChildren: 0.06,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -5 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.18 } },
};

export default function CustomSelect({ id, value, onChange, options, placeholder, disabled, isOpen, onOpenChange, leftIcon, modified }) {
	const ref = useRef(null);
	const closeDropdown = useCallback(() => onOpenChange(false), [onOpenChange]);
	useClickOutside(ref, closeDropdown);

	const selected = options.find(o => o.value === value);

	function handleSelect(val) {
		onChange(val);
		onOpenChange(false);
	}

	return (
		<div
			className={`${styles.cselect}${isOpen ? ` ${styles.cselectOpen}` : ''}${disabled ? ` ${styles.cselectDisabled}` : ''}`}
			ref={ref}
		>
			<button
				type='button'
				id={id}
				className={`${styles.cselectTrigger}${modified ? ` ${styles.cselectTriggerModified}` : ''}`}
				onClick={e => {
					if (disabled) return;
					e.stopPropagation();
					onOpenChange(!isOpen);
				}}
				aria-expanded={isOpen}
				disabled={disabled}
			>
				{leftIcon && <span className={styles.cselectLeftIcon}>{leftIcon}</span>}
				{selected?.swatch && (
					<span className={styles.cselectSwatch} style={{ background: selected.swatch }} />
				)}
				<span className={`${styles.cselectText}${!selected ? ` ${styles.cselectTextPlaceholder}` : ''}`}>
					{selected ? selected.label : placeholder}
				</span>
				<motion.img
					className={styles.cselectArrow}
					src='/img/icons/icon-arrow-down.svg'
					alt=''
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.ul
						className={styles.cselectDropdown}
						variants={dropdownVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						transition={{ duration: 0.15, ease: [0.4, 0, 1, 1] }}
					>
						{options.map(o => (
							<motion.li
								key={o.value ?? '__none'}
								variants={itemVariants}
								className={`${styles.cselectItem}${o.value === value ? ` ${styles.cselectItemActive}` : ''}`}
								onClick={() => handleSelect(o.value)}
							>
								{o.swatch && (
									<span className={styles.cselectSwatch} style={{ background: o.swatch }} />
								)}
								<span className={styles.cselectItemLabel}>{o.label}</span>
								<AnimatePresence>
									{o.value === value && (
										<motion.svg
											className={styles.cselectItemCheck}
											width='14'
											height='14'
											viewBox='0 0 14 14'
											fill='none'
											initial={{ scale: 0, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											exit={{ scale: 0, opacity: 0 }}
											transition={{ duration: 0.15, type: 'spring', bounce: 0.4 }}
										>
											<path
												d='M2.5 7l3 3 6-6'
												stroke='currentColor'
												strokeWidth='1.8'
												strokeLinecap='round'
												strokeLinejoin='round'
											/>
										</motion.svg>
									)}
								</AnimatePresence>
							</motion.li>
						))}
					</motion.ul>
				)}
			</AnimatePresence>
		</div>
	);
}
