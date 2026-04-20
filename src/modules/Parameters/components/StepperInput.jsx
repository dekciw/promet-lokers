import { useState, useRef, useEffect } from 'react';
import styles from './Parameters.module.css';

const SLOT_SETS = 3;
const SLOT_HIGH = 22;
const SLOT_LOW = 8;
const DIGIT_H = 20;
const LIMIT_HINT_DURATION = 1500;

function SlotDigit({ digit, direction }) {
	const posRef = useRef(10 + digit);
	const prevRef = useRef(digit);
	const [pos, setPos] = useState(10 + digit);
	const [instant, setInstant] = useState(false);

	useEffect(() => {
		if (prevRef.current === digit) return;
		const prev = prevRef.current;
		prevRef.current = digit;

		const delta =
			direction === 'up'
				? digit >= prev
					? digit - prev
					: 10 - prev + digit
				: digit <= prev
					? digit - prev
					: -(prev + 10 - digit);

		const cur = posRef.current;
		const next = cur + delta;

		if (next >= SLOT_HIGH || next < SLOT_LOW) {
			const adj = next >= SLOT_HIGH ? -10 : 10;
			const snap = cur + adj;
			const fin = snap + delta;
			posRef.current = snap;
			// eslint-disable-next-line react-hooks/set-state-in-effect -- double-rAF trick: snap без анимации → потом re-enable
			setInstant(true);
			setPos(snap);
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					posRef.current = fin;
					setInstant(false);
					setPos(fin);
				}),
			);
		} else {
			posRef.current = next;
			setPos(next);
		}
	}, [digit]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<span style={{ display: 'inline-block', overflow: 'hidden', height: DIGIT_H, width: '1ch', verticalAlign: 'top' }}>
			<span
				style={{
					display: 'block',
					transform: `translateY(${-pos * DIGIT_H}px)`,
					transition: instant ? 'none' : 'transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)',
					willChange: 'transform',
				}}
			>
				{Array.from({ length: SLOT_SETS * 10 }, (_, i) => (
					<span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: DIGIT_H }}>
						{i % 10}
					</span>
				))}
			</span>
		</span>
	);
}

function SlotCounter({ value, direction }) {
	return (
		<span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
			{String(value)
				.split('')
				.map((ch, i) => (
					<SlotDigit key={i} digit={Number(ch)} direction={direction} />
				))}
		</span>
	);
}

export default function StepperInput({ id, value, min, max, step = 50, onChange, modified, defaultValue, snaps, editable, blocked }) {
	const [limitSide, setLimitSide] = useState(null);
	const [direction, setDirection] = useState('none');
	const [inputVal, setInputVal] = useState(value);
	const [focused, setFocused] = useState(false);
	const inputRef = useRef(null);
	const timerRef = useRef(null);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- controlled input: синхронизация локального стейта с внешним value
		if (!focused) setInputVal(value);
	}, [value, focused]);

	function triggerLimit(side) {
		if (timerRef.current) clearTimeout(timerRef.current);
		setLimitSide(side);
		timerRef.current = setTimeout(() => setLimitSide(null), LIMIT_HINT_DURATION);
	}

	function handleStep(dir) {
		if (blocked) {
			triggerLimit('blocked');
			return;
		}
		const current = Number(value);
		const base = defaultValue !== undefined ? Number(defaultValue) : current;

		const pts = new Set();
		for (let v = base; v >= min; v -= step) pts.add(v);
		for (let v = base + step; v < max; v += step) pts.add(v);
		pts.add(max);
		if (snaps)
			snaps.forEach(s => {
				if (s > min && s < max) pts.add(s);
			});

		const sorted = [...pts].sort((a, b) => a - b);

		let idx = sorted.indexOf(current);
		if (idx === -1) {
			idx = sorted.reduce((best, v, i) => (Math.abs(v - current) < Math.abs(sorted[best] - current) ? i : best), 0);
		}

		const nextIdx = idx + dir;
		if (nextIdx < 0 || nextIdx >= sorted.length) {
			triggerLimit(dir > 0 ? 'max' : 'min');
			return;
		}
		setDirection(dir > 0 ? 'up' : 'down');
		onChange(String(sorted[nextIdx]));
	}

	function handleInputChange(e) {
		const raw = e.target.value.replace(/\D/g, '');
		setInputVal(raw);
	}

	function handleInputBlur() {
		setFocused(false);
		const num = parseInt(inputVal, 10);
		if (!inputVal || isNaN(num) || num < min) {
			onChange(String(min));
		} else if (num > max) {
			onChange(String(max));
		} else {
			onChange(String(num));
		}
	}

	function handleInputKeyDown(e) {
		if (e.key === 'Enter') e.target.blur();
	}

	const hintText =
		limitSide === 'blocked' ? 'Требуется согласование с производством' :
		limitSide === 'min' ? 'Минимальное значение' :
		limitSide === 'max' ? 'Максимальное значение' : null;

	return (
		<div className={`${styles.stepper}${limitSide ? ` ${styles.stepperLimit}` : ''}`}>
			<div className={`${styles.stepperRow}${modified ? ` ${styles.stepperRowModified}` : ''}`}>
				<button className={styles.stepperBtn} type='button' onClick={() => handleStep(-1)}>
					<svg
						width='15'
						height='15'
						viewBox='0 0 15 15'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
						style={{ transform: 'rotate(180deg)' }}
					>
						<path
							d='M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z'
							fill='currentColor'
							fillRule='evenodd'
							clipRule='evenodd'
						/>
					</svg>
				</button>
				{editable && focused ? (
					<input
						ref={inputRef}
						id={id}
						className={styles.stepperEditInput}
						type='text'
						inputMode='numeric'
						value={inputVal}
						onChange={handleInputChange}
						onBlur={handleInputBlur}
						onKeyDown={handleInputKeyDown}
					/>
				) : (
					<div
						className={styles.stepperDisplay}
						id={id}
						onClick={
							editable
								? () => {
										setFocused(true);
										setInputVal(value);
										setTimeout(() => {
											inputRef.current?.select();
										}, 0);
									}
								: undefined
						}
						style={editable ? { cursor: 'text' } : undefined}
					>
						{value && <SlotCounter value={value} direction={direction} />}
					</div>
				)}
				<button className={styles.stepperBtn} type='button' onClick={() => handleStep(1)}>
					<svg width='15' height='15' viewBox='0 0 15 15' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path
							d='M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z'
							fill='currentColor'
							fillRule='evenodd'
							clipRule='evenodd'
						/>
					</svg>
				</button>
			</div>
			{hintText && <span className={styles.stepperHint}>{hintText}</span>}
		</div>
	);
}
