import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, Controller } from 'react-hook-form';
import { cx } from '../../utils/cx.js';
import styles from './CommercialProposalModal.module.css';

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
		<svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden='true'>
			<path d='M3 5l4 4 4-4' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

export default function CommercialProposalModal({ isOpen, onClose, onSubmit, summary, initialPrice }) {
	const titleId = useId();
	const [summaryOpen, setSummaryOpen] = useState(true);
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		mode: 'onSubmit',
		defaultValues: { price: '' },
	});

	useEffect(() => {
		if (!isOpen) {
			reset({ price: '' });
			setSummaryOpen(true);
		} else {
			reset({ price: initialPrice != null ? String(initialPrice) : '' });
		}
	}, [isOpen, reset, initialPrice]);

	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = ''; };
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		function onKey(e) {
			if (e.key === 'Escape' && !isSubmitting) onClose();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, isSubmitting, onClose]);

	async function handleFormSubmit(data) {
		await onSubmit({ price: Number(data.price.replace(/\D/g, '')) });
	}

	const summaryItems = summary ? [
		{ label: 'Модель', value: summary.model },
		{ label: 'Габариты', value: summary.dims },
		{ label: 'Толщина корпуса', value: summary.bodyThickness },
		{ label: 'Толщина двери', value: summary.doorThickness },
		{ label: 'Замок', value: summary.lock },
		{ label: 'Вентиляция', value: summary.ventilation },
		{ label: 'Количество', value: summary.qty },
		{ label: 'Цвет двери', value: summary.doorColor },
		{ label: 'Цвет корпуса', value: summary.bodyColor },
	].filter(i => i.value) : [];

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className={styles.overlay}
					onClick={() => { if (!isSubmitting) onClose(); }}
					role='presentation'
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					transition={{ duration: 0.18 }}
				>
					<motion.div
						className={styles.modal}
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
								<h2 id={titleId} className={styles.title}>Коммерческое предложение</h2>
							</div>
							<button
								type='button'
								className={styles.closeBtn}
								onClick={onClose}
								disabled={isSubmitting}
								aria-label='Закрыть'
							>
								<IconClose />
							</button>
						</div>

						{summaryItems.length > 0 && (
							<div className={styles.summary}>
								<button
									type='button'
									className={styles.summaryToggle}
									onClick={() => setSummaryOpen(v => !v)}
								>
									<span>Конфигурация</span>
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
											style={{ overflow: 'hidden' }}
										>
											<div className={styles.summaryGrid}>
												{summaryItems.map(({ label, value }) => (
													<div key={label} className={styles.summaryItem}>
														<span className={styles.summaryLabel}>{label}</span>
														<span className={styles.summaryValue}>{value}</span>
													</div>
												))}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}

						<form id='proposal-form' className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
							<div className={styles.field}>
								<label className={styles.fieldLabel} htmlFor='proposal-price'>
									Цена за 1 шт.
									<span className={styles.required} aria-hidden='true'> *</span>
								</label>
								<Controller
									name='price'
									control={control}
									rules={{
										required: 'Введите цену',
										validate: v => Number(v.replace(/\D/g, '')) >= 1 || 'Цена должна быть больше 0',
									}}
									render={({ field }) => (
										<input
											id='proposal-price'
											type='text'
											inputMode='numeric'
											placeholder='Цена от экономиста'
											disabled={isSubmitting}
											readOnly={initialPrice != null}
											value={field.value ? parseInt(field.value.replace(/\D/g, '') || '0', 10).toLocaleString('ru-RU') : ''}
											onChange={e => {
												if (initialPrice != null) return;
												field.onChange(e.target.value.replace(/\D/g, ''));
											}}
											onBlur={field.onBlur}
											ref={field.ref}
											className={cx(styles.input, errors.price && styles.inputError, initialPrice != null && styles.inputReadonly)}
											aria-invalid={errors.price ? 'true' : 'false'}
											aria-describedby='proposal-price-err'
										/>
									)}
								/>
								<span id='proposal-price-err' className={styles.errorMsg}>{errors.price?.message ?? ''}</span>
							</div>
						</form>

						<div className={styles.actions}>
							<button
								type='button'
								className={cx(styles.btn, styles.btnSecondary)}
								onClick={onClose}
								disabled={isSubmitting}
							>
								Отмена
							</button>
							<button
								type='submit'
								form='proposal-form'
								className={cx(styles.btn, styles.btnPrimary)}
								disabled={isSubmitting}
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
