import { useState, useRef, useCallback, Fragment } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import './ColorPicker.css';

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

/* Выпадающий список выбора цвета показывает цветовые группы, запоминает выбранный цвет и закрывается при клике вне компонента. */
export default function ColorPicker({ placeholder, selected, onSelect, standardLabel = 'Стандарт (без изменений)' }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const closeDropdown = useCallback(() => setOpen(false), []);
	useClickOutside(ref, closeDropdown);

	/* Переключает открытие/закрытие дропдауна по клику на кнопку-триггер.
	   stopPropagation нужен, чтобы клик не попал в handleClickOutside и сразу не закрыл список */
	function handleTriggerClick(e) {
		e.stopPropagation();
		setOpen(prev => !prev);
	}

	/* Передаёт выбранный цвет в родительский компонент через onSelect и закрывает дропдаун */
	function handleSelect(item) {
		onSelect(item);
		setOpen(false);
	}

	/* Возвращает inline-стили для цветового квадратика (swatch):
	   белый цвет получает видимую рамку, остальные — полупрозрачную тёмную */
	function getSwatchStyle(colorHex) {
		const border = colorHex === '#ffffff' ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.12)';
		return { background: colorHex, border };
	}

	const swatchStyle = selected ? getSwatchStyle(selected.color) : {};

	return (
		<div className={`color-picker${open ? ' color-picker--open' : ''}`} ref={ref}>
			<button type='button' className='trigger' aria-expanded={open} onClick={handleTriggerClick}>
				<span className='trigger-swatch' style={swatchStyle} />
				<span className={`trigger-text${selected ? ' trigger-text--selected' : ''}`}>
					{selected ? selected.name : placeholder}
				</span>
				<img className='trigger-arrow' src='/img/arrow-down.svg' alt='' />
			</button>

			<ul className='dropdown'>
				{selected && (
					<li className='item item--reset' onClick={() => handleSelect(null)}>
						<span className='item-swatch item-swatch--standard' />
						<span className='item-name'>{standardLabel}</span>
					</li>
				)}
				{COLORS.map(group => (
					<Fragment key={group.group}>
						<li className='group'>{group.group}</li>
						{group.items.map(item => (
							<li
								key={item.name}
								className={`item${selected?.name === item.name ? ' item--active' : ''}`}
								onClick={() => handleSelect(item)}
							>
								<span className='item-swatch' style={{ background: item.color }} />
								<span className='item-name'>{item.name}</span>
							</li>
						))}
					</Fragment>
				))}
			</ul>
		</div>
	);
}
