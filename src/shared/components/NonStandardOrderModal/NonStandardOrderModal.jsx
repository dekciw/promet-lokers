import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { cx } from '../../utils/cx.js';
import styles from './NonStandardOrderModal.module.css';

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
};

const modalVariants = {
	hidden: { opacity: 0, y: 16, scale: 0.97 },
	visible: { opacity: 1, y: 0, scale: 1 },
	exit: { opacity: 0, y: 8, scale: 0.98 },
};

function IconClose() {
	return (
		<svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
			<path d='M12 4L4 12M4 4l8 8' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
		</svg>
	);
}

function IconChevron() {
	return (
		<svg width='14' height='14' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
			<path d='M4 6l4 4 4-4' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

function IconPrint() {
	return (
		<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
			<polyline points='6 9 6 2 18 2 18 9' />
			<path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' />
			<rect x='6' y='14' width='12' height='8' />
		</svg>
	);
}

function SummaryRow({ label, value, colorHex }) {
	return (
		<div className={styles.summaryItem}>
			<span className={styles.summaryLabel}>{label}</span>
			<span className={styles.summaryValue}>
				{colorHex && (
					<span
						className={cx(styles.colorSwatch, colorHex === '#ffffff' && styles.colorSwatchLight)}
						style={{ '--swatch-bg': colorHex }}
					/>
				)}
				{value}
			</span>
		</div>
	);
}

export default function NonStandardOrderModal({ isOpen, onClose, onSubmit, onPrint, summary, initialValues }) {
	const titleId = useId();
	const [summaryOpen, setSummaryOpen] = useState(false);
	const [isPrinting, setIsPrinting] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		trigger,
		getValues,
		formState: { errors, isSubmitting, isValid },
	} = useForm({
		mode: 'onChange',
		defaultValues: { managerName: '', clientName: '', nzNumber: '', calcNumber: '' },
	});

	useEffect(() => {
		if (!isOpen) {
			reset();
			setSummaryOpen(false);
			setIsPrinting(false);
		} else if (initialValues) {
			reset({
				managerName: initialValues.managerName ?? '',
				clientName: initialValues.clientName ?? '',
				nzNumber: initialValues.nzNumber ?? '',
				calcNumber: initialValues.calcNumber ?? '',
			});
			trigger();
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = ''; };
	}, [isOpen]);

	const busy = isSubmitting || isPrinting;

	useEffect(() => {
		if (!isOpen) return;
		function onKey(e) {
			if (e.key === 'Escape' && !busy) onClose();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, busy, onClose]);

	async function handleFormSubmit(data) {
		await onSubmit({
			managerName: data.managerName.trim(),
			clientName: data.clientName.trim(),
			nzNumber: data.nzNumber.trim(),
			calcNumber: data.calcNumber.trim(),
		});
	}

	async function handlePrint() {
		const valid = await trigger();
		if (!valid) return;
		const data = getValues();
		setIsPrinting(true);
		try {
			await onPrint?.({
				managerName: data.managerName.trim(),
				clientName: data.clientName.trim(),
				nzNumber: data.nzNumber.trim(),
				calcNumber: data.calcNumber.trim(),
			});
		} finally {
			setIsPrinting(false);
		}
	}

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className={styles.overlay}
					onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
					role='presentation'
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					transition={{ duration: 0.18 }}
				>
					<motion.div
						className={styles.modal}
						onMouseDown={e => e.stopPropagation()}
						onClick={e => e.stopPropagation()}
						role='dialog'
						aria-modal='true'
						aria-labelledby={titleId}
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
					>

						<div className={styles.header}>
							<div className={styles.headerLeft}>
								<p className={styles.headerEyebrow}>Документ</p>
								<h2 id={titleId} className={styles.title}>Бланк нестандартного заказа</h2>
							</div>
							<button
								type='button'
								className={styles.closeBtn}
								onClick={onClose}
								disabled={busy}
								aria-label='Закрыть'
							>
								<IconClose />
							</button>
						</div>

						{summary && (
							<div className={styles.totalStrip}>
								<div className={styles.totalItem}>
									<span className={styles.totalLabel}>Количество</span>
									<span className={styles.totalValue}>{summary.qty}</span>
								</div>
								<div className={styles.totalDivider} />
								<div className={styles.totalItem}>
									<span className={styles.totalLabel}>Итого</span>
									<span className={styles.totalPrice}>{summary.price}</span>
								</div>
							</div>
						)}

						{summary && (
							<div className={styles.summary}>
								<button
									type='button'
									className={styles.summaryToggle}
									onClick={() => setSummaryOpen(v => !v)}
									aria-expanded={summaryOpen}
								>
									<span>Конфигурация заказа</span>
									<span className={cx(styles.chevron, summaryOpen && styles.chevronOpen)}>
										<IconChevron />
									</span>
								</button>
								<AnimatePresence initial={false}>
									{summaryOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
											className={styles.accordionContent}
										>
											<div className={styles.summaryGrid}>
												<SummaryRow label='Модель' value={summary.model} />
												<SummaryRow label='Габариты' value={summary.dims} />
												<SummaryRow label='Толщина корпус / дверь' value={summary.thickness} />
												<SummaryRow label='Замок' value={summary.lock} />
												<SummaryRow label='Цвет корпуса' value={summary.bodyColor} colorHex={summary.bodyColorHex} />
												<SummaryRow label='Цвет двери' value={summary.doorColor} colorHex={summary.doorColorHex} />
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}

						<form id='nz-form' className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
							<div className={styles.field}>
								<label className={styles.fieldLabel} htmlFor='nz-manager'>
									Менеджер по продажам
									<span className={styles.required} aria-hidden='true'> *</span>
								</label>
								<input
									id='nz-manager'
									type='text'
									placeholder='Введите Ф.И.О.'
									autoComplete='name'
									disabled={busy}
									className={cx(styles.input, errors.managerName && styles.inputError)}
									aria-invalid={errors.managerName ? 'true' : 'false'}
									aria-describedby='nz-manager-err'
									{...register('managerName', {
										required: 'Заполните Ф.И.О. менеджера',
										pattern: { value: /^[а-яёА-ЯЁa-zA-Z\s\-.]+$/, message: 'Только буквы' },
										validate: v => v.trim().length > 0 || 'Заполните Ф.И.О. менеджера',
									})}
								/>
								<span id='nz-manager-err' className={styles.errorMsg}>{errors.managerName?.message ?? ''}</span>
							</div>

							<div className={styles.field}>
								<label className={styles.fieldLabel} htmlFor='nz-client'>
									Название клиента
									<span className={styles.required} aria-hidden='true'> *</span>
								</label>
								<input
									id='nz-client'
									type='text'
									placeholder='Введите название'
									autoComplete='organization'
									disabled={busy}
									className={cx(styles.input, errors.clientName && styles.inputError)}
									aria-invalid={errors.clientName ? 'true' : 'false'}
									aria-describedby='nz-client-err'
									{...register('clientName', {
										required: 'Заполните название клиента',
										pattern: { value: /^[а-яёА-ЯЁa-zA-Z0-9\s\-.,«»"'()]+$/, message: 'Буквы и цифры' },
										validate: v => v.trim().length > 0 || 'Заполните название клиента',
									})}
								/>
								<span id='nz-client-err' className={styles.errorMsg}>{errors.clientName?.message ?? ''}</span>
							</div>

							<div className={styles.optionalGrid}>
								<div className={styles.field}>
									<label className={styles.fieldLabel} htmlFor='nz-number'>№ листа НЗ</label>
									<input
										id='nz-number'
										type='text'
										placeholder='Например, 123'
										autoComplete='off'
										disabled={busy}
										className={cx(styles.input, errors.nzNumber && styles.inputError)}
										aria-invalid={errors.nzNumber ? 'true' : 'false'}
										aria-describedby='nz-number-err'
										{...register('nzNumber', {
											validate: v => !v.trim() || /^[\d\-/.\s]+$/.test(v.trim()) || 'Только цифры и знаки',
										})}
									/>
									<span id='nz-number-err' className={styles.errorMsg}>{errors.nzNumber?.message ?? ''}</span>
								</div>

								<div className={styles.field}>
									<label className={styles.fieldLabel} htmlFor='nz-calc'>Номер расчёта</label>
									<input
										id='nz-calc'
										type='text'
										placeholder='Например, 456'
										autoComplete='off'
										disabled={busy}
										className={cx(styles.input, errors.calcNumber && styles.inputError)}
										aria-invalid={errors.calcNumber ? 'true' : 'false'}
										aria-describedby='nz-calc-err'
										{...register('calcNumber', {
											validate: v => !v.trim() || /^[\d\-/.\s]+$/.test(v.trim()) || 'Только цифры и знаки',
										})}
									/>
									<span id='nz-calc-err' className={styles.errorMsg}>{errors.calcNumber?.message ?? ''}</span>
								</div>
							</div>
						</form>

						<div className={styles.actions}>
							<button
								type='button'
								className={cx(styles.btn, styles.btnSecondary)}
								onClick={onClose}
								disabled={busy}
							>
								Отмена
							</button>
							{onPrint && (
								<button
									type='button'
									className={cx(styles.btn, styles.btnPrint)}
									onClick={handlePrint}
									disabled={busy || !isValid}
								>
									{isPrinting ? (
										<>
											<svg className={styles.spinner} viewBox='0 0 20 20' fill='none' aria-hidden='true' width='14' height='14'>
												<circle cx='10' cy='10' r='7' stroke='currentColor' strokeWidth='2.5' strokeOpacity='0.25' />
												<path d='M10 3a7 7 0 0 1 7 7' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
											</svg>
											Генерация…
										</>
									) : (
										<>
											<IconPrint />
											Распечатать
										</>
									)}
								</button>
							)}
							<button
								type='submit'
								form='nz-form'
								className={cx(styles.btn, styles.btnPrimary)}
								disabled={busy || !isValid}
							>
								{isSubmitting ? (
									<>
										<svg className={styles.spinner} viewBox='0 0 20 20' fill='none' aria-hidden='true' width='14' height='14'>
											<circle cx='10' cy='10' r='7' stroke='currentColor' strokeWidth='2.5' strokeOpacity='0.25' />
											<path d='M10 3a7 7 0 0 1 7 7' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
										</svg>
										Генерация…
									</>
								) : 'Скачать'}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	);
}
