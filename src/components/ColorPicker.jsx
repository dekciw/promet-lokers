import { useState, useRef, useEffect, Fragment } from 'react';

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

export default function ColorPicker({ placeholder, selected, onSelect }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		function handleClickOutside(e) {
			if (ref.current && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		}
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, []);

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
		<div className={`color-picker${open ? ' color-picker--open' : ''}`} ref={ref}>
			<button type='button' className='color-picker__trigger' aria-expanded={open} onClick={handleTriggerClick}>
				<span className='color-picker__trigger-swatch' style={swatchStyle} />
				<span className='color-picker__trigger-text' style={selected ? { color: 'var(--c-text-dark)' } : {}}>
					{selected ? selected.name : placeholder}
				</span>
				<img className='color-picker__trigger-arrow' src='/img/arrow-down.svg' alt='' />
			</button>

			<ul className='color-picker__dropdown'>
				{COLORS.map(group => (
					<Fragment key={group.group}>
						<li className='color-picker__group'>{group.group}</li>
						{group.items.map(item => (
							<li
								key={item.name}
								className={`color-picker__item${selected?.name === item.name ? ' color-picker__item--active' : ''}`}
								onClick={() => handleSelect(item)}
							>
								<span className='color-picker__item-swatch' style={{ background: item.color }} />
								<span className='color-picker__item-name'>{item.name}</span>
							</li>
						))}
					</Fragment>
				))}
			</ul>
		</div>
	);
}
