import { useState, useRef, useCallback, Fragment } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './ColorPicker.module.css';

const COLORS = [
	{
		group: 'Базовые',
		items: [
			{ color: '#3e4c5e', name: '5002 шагрень' },
			{ color: '#ffffff', name: '9003 гладкая' },
			{ color: '#c5c7c4', name: '7035 муар' },
			{ color: '#373f41', name: '7016 гладкая' },
		],
	},
	{
		group: 'Популярные',
		items: [
			{ color: '#4c7041', name: 'RAL 6018' },
			{ color: '#2874b2', name: 'RAL 5012' },
			{ color: '#9b111e', name: 'RAL 3000' },
		],
	},
	{
		group: 'Яркие',
		items: [
			{ color: '#f1eb9c', name: 'RAL 1016' },
			{ color: '#f3e03b', name: 'RAL 1018' },
			{ color: '#8d3f7d', name: 'RAL 4006' },
			{ color: '#d1552c', name: 'RAL 2008' },
		],
	},
];

export function ColorPicker({ placeholder, selected, onSelect, standardLabel = 'Стандарт (без изменений)' }) {
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

	return (
		<div className={`${styles.colorPicker}${open ? ` ${styles.colorPickerOpen}` : ''}`} ref={ref}>
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
				{COLORS.map(group => (
					<Fragment key={group.group}>
						<li className={styles.group}>{group.group}</li>
						{group.items.map(item => (
							<li
								key={item.name}
								className={`${styles.item}${selected?.name === item.name ? ` ${styles.itemActive}` : ''}`}
								onClick={() => handleSelect(item)}
							>
								<span className={styles.itemSwatch} style={{ background: item.color }} />
								<span className={styles.itemName}>{item.name}</span>
							</li>
						))}
					</Fragment>
				))}
			</ul>
		</div>
	);
}
