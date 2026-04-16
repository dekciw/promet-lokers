import { useRef, useCallback } from 'react';
import { useClickOutside } from '../../../shared/hooks/useClickOutside';
import styles from './Parameters.module.css';

export default function CustomSelect({ id, value, onChange, options, placeholder, disabled, isOpen, onOpenChange }) {
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
				className={styles.cselectTrigger}
				onClick={e => {
					if (disabled) return;
					e.stopPropagation();
					onOpenChange(!isOpen);
				}}
				aria-expanded={isOpen}
				disabled={disabled}
			>
				<span className={`${styles.cselectText}${!selected ? ` ${styles.cselectTextPlaceholder}` : ''}`}>
					{selected ? selected.label : placeholder}
				</span>
				<img className={styles.cselectArrow} src='/img/arrow-down.svg' alt='' />
			</button>

			{isOpen && (
				<ul className={styles.cselectDropdown}>
					{options.map(o => (
						<li
							key={o.value}
							className={`${styles.cselectItem}${o.value === value ? ` ${styles.cselectItemActive}` : ''}`}
							onClick={() => handleSelect(o.value)}
						>
							<span className={styles.cselectItemLabel}>{o.label}</span>
							{o.value === value && (
								<svg className={styles.cselectItemCheck} width='14' height='14' viewBox='0 0 14 14' fill='none'>
									<path
										d='M2.5 7l3 3 6-6'
										stroke='currentColor'
										strokeWidth='1.8'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
