import { useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClickOutside } from '../../../../shared/hooks/useClickOutside';
import { COLORS } from '../../../../shared/utils/colors';
import { cx } from '../../../../shared/utils/cx';
import styles from './ColorPicker.module.css';

const dropdownVariants = {
	hidden: { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
	visible: {
		clipPath: 'inset(0% 0 0 0)',
		opacity: 1,
		transition: {
			duration: 0.22,
			ease: [0.23, 1, 0.32, 1],
			staggerChildren: 0.02,
			delayChildren: 0.04,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -5 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.16 } },
};

export default function ColorPicker({
	placeholder,
	selected,
	onSelect,
	standardLabel = 'Стандарт (без изменений)',
	isOpen,
	onOpenChange,
	modified,
}) {
	const ref = useRef(null);
	const closeDropdown = useCallback(() => onOpenChange(false), [onOpenChange]);
	useClickOutside(ref, closeDropdown);

	function handleTriggerClick(e) {
		e.stopPropagation();
		onOpenChange(!isOpen);
	}

	function handleSelect(item) {
		onSelect(item);
		onOpenChange(false);
	}

	return (
		<div className={cx(styles.colorPicker, isOpen && styles.colorPickerOpen)} ref={ref}>
			<button type='button' className={cx(styles.trigger, modified && styles.triggerModified)} aria-expanded={isOpen} onClick={handleTriggerClick}>
				<img src='/img/icons/icon-color.svg' alt='' width='16' height='16' className={styles.triggerIcon} />
				{selected && (
					<span
						className={cx(styles.triggerSwatch, selected.color === '#ffffff' && styles.triggerSwatchLight)}
						style={{ '--swatch-bg': selected.color }}
					/>
				)}
				<span className={`${styles.triggerText}${selected ? ` ${styles.triggerTextSelected}` : ''}`}>
					{selected ? selected.name : placeholder}
				</span>
				<motion.img
					className={styles.triggerArrow}
					src='/img/icons/icon-arrow-down.svg'
					alt=''
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.ul
						className={styles.dropdown}
						variants={dropdownVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						transition={{ duration: 0.15, ease: [0.4, 0, 1, 1] }}
					>
						{selected && (
							<motion.li variants={itemVariants} className={`${styles.item} ${styles.itemReset}`} onClick={() => handleSelect(null)}>
								<span className={`${styles.itemSwatch} ${styles.itemSwatchStandard}`} />
								<span className={styles.itemName}>{standardLabel}</span>
							</motion.li>
						)}
						{COLORS.map((group) => {
							const filteredItems = group.items.filter(item => item.name !== 'RAL 7038');
							if (filteredItems.length === 0) return null;
							return (
								<Fragment key={group.group}>
									<motion.li variants={itemVariants} className={styles.group}>{group.group}</motion.li>
									{filteredItems.map(item => (
										<motion.li
											key={item.name}
											variants={itemVariants}
											className={cx(styles.item, selected?.name === item.name && styles.itemActive)}
											onClick={() => handleSelect(item)}
										>
											<span className={styles.itemSwatch} style={{ '--swatch-bg': item.color }} />
											<span className={styles.itemName}>{item.name}</span>
											<AnimatePresence>
												{selected?.name === item.name && (
													<motion.svg
														width='14' height='14' viewBox='0 0 14 14' fill='none'
														className={styles.itemCheck}
														initial={{ scale: 0, opacity: 0 }}
														animate={{ scale: 1, opacity: 1 }}
														exit={{ scale: 0, opacity: 0 }}
														transition={{ duration: 0.15, type: 'spring', bounce: 0.4 }}
													>
														<path d='M2.5 7l3 3 6-6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
													</motion.svg>
												)}
											</AnimatePresence>
										</motion.li>
									))}
								</Fragment>
							);
						})}
					</motion.ul>
				)}
			</AnimatePresence>
		</div>
	);
}
