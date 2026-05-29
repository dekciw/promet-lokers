import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cx } from '../../../../shared/utils/cx';
import styles from './StepperInput.module.css';

const SLOT_SETS = 3;
const SLOT_HIGH = 22;
const SLOT_LOW = 8;
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
	}, [digit]);

	return (
		<span className={styles.slotOuter}>
			<span
				className={cx(styles.slotTrack, instant && styles.slotTrackInstant)}
				style={{ '--slot-pos': pos }}
			>
				{Array.from({ length: SLOT_SETS * 10 }, (_, i) => (
					<span key={i} className={styles.slotCell}>
						{i % 10}
					</span>
				))}
			</span>
		</span>
	);
}

function SlotCounter({ value, direction }) {
	return (
		<span className={styles.slotCounter}>
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
		limitSide === 'blocked' ? 'Требуется согласование' :
		limitSide === 'min' ? 'Минимальное значение' :
		limitSide === 'max' ? 'Максимальное значение' : null;

	return (
		<div className={`${styles.stepper}${limitSide ? ` ${styles.stepperLimit}` : ''}`}>
			<div className={`${styles.stepperRow}${modified ? ` ${styles.stepperRowModified}` : ''}`}>
				<button className={styles.stepperBtn} type='button' onClick={() => handleStep(-1)} aria-label='Уменьшить'>
					<img src='/img/icons/icon-chevron.svg' alt='' width='10' height='8' className={styles.chevronFlipped} />
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
						className={cx(styles.stepperDisplay, editable && styles.stepperDisplayEditable)}
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
					>
						{value && <SlotCounter value={value} direction={direction} />}
					</div>
				)}
				<button className={styles.stepperBtn} type='button' onClick={() => handleStep(1)} aria-label='Увеличить'>
					<img src='/img/icons/icon-chevron.svg' alt='' width='10' height='8' />
				</button>
			</div>
			<AnimatePresence>
				{hintText && (
					<motion.span
						className={styles.stepperHint}
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.18 }}
					>
						{hintText}
					</motion.span>
				)}
			</AnimatePresence>
		</div>
	);
}
