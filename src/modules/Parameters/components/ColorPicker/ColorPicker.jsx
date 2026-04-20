import { useState, useRef, useCallback, Fragment } from 'react';
import { useClickOutside } from '../../../../shared/hooks/useClickOutside';
import { COLORS } from '../../../../shared/utils/colors';
import { cx } from '../../../../shared/utils/cx';
import styles from './ColorPicker.module.css';

export default function ColorPicker({ placeholder, selected, onSelect, standardLabel = 'Стандарт (без изменений)', colorRule, quantity }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const closeDropdown = useCallback(() => setOpen(false), []);
	useClickOutside(ref, closeDropdown);

	function handleTriggerClick(e) {
		e.stopPropagation();
		setOpen(prev => !prev);
	}

	function handleSelect(item) {
		onSelect(item);
		setOpen(false);
	}

	function getSwatchStyle(colorHex) {
		const border = colorHex === '#ffffff' ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.12)';
		return { background: colorHex, border };
	}

	const swatchStyle = selected ? getSwatchStyle(selected.color) : {};

	// Определяем какие категории доступны по количеству
	const catRules = colorRule ? [colorRule.cat1, colorRule.cat2, colorRule.cat3] : null;
	function isCatAvailable(groupIdx) {
		if (!catRules || quantity === undefined) return true;
		const rule = catRules[groupIdx];
		return !rule || quantity >= rule.minQty;
	}

	return (
		<div className={cx(styles.colorPicker, open && styles.colorPickerOpen)} ref={ref}>
			<button type='button' className={styles.trigger} aria-expanded={open} onClick={handleTriggerClick}>
				<span className={styles.triggerSwatch} style={swatchStyle} />
				<span className={`${styles.triggerText}${selected ? ` ${styles.triggerTextSelected}` : ''}`}>
					{selected ? selected.name : placeholder}
				</span>
				<img className={styles.triggerArrow} src='/img/arrow-down.svg' alt='' />
			</button>

			<ul className={styles.dropdown}>
				{selected && (
					<li className={`${styles.item} ${styles.itemReset}`} onClick={() => handleSelect(null)}>
						<span className={`${styles.itemSwatch} ${styles.itemSwatchStandard}`} />
						<span className={styles.itemName}>{standardLabel}</span>
					</li>
				)}
				{COLORS.map((group, groupIdx) => {
					if (!isCatAvailable(groupIdx)) return null;
					return (
						<Fragment key={group.group}>
							<li className={styles.group}>{group.group}</li>
							{group.items.map(item => (
								<li
									key={item.name}
									className={cx(styles.item, selected?.name === item.name && styles.itemActive)}
									onClick={() => handleSelect(item)}
								>
									<span className={styles.itemSwatch} style={{ background: item.color }} />
									<span className={styles.itemName}>{item.name}</span>
								</li>
							))}
						</Fragment>
					);
				})}
			</ul>
		</div>
	);
}
