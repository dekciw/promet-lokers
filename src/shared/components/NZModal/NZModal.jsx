import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { cx } from '../../utils/cx.js';
import styles from './NZModal.module.css';

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
};

const modalVariants = {
	hidden: { opacity: 0, y: 12, scale: 0.97 },
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

export default function NZModal({ isOpen, onClose, onSubmit }) {
	const titleId = useId();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		mode: 'onChange',
		defaultValues: { managerName: '', clientName: '', nzNumber: '', calcNumber: '' },
	});

	useEffect(() => {
		if (!isOpen) reset();
	}, [isOpen, reset]);

	useEffect(() => {
		if (!isOpen) return;
		function stopWheel(e) { e.preventDefault(); }
		document.addEventListener('wheel', stopWheel, { passive: false });
		document.addEventListener('touchmove', stopWheel, { passive: false });
		return () => {
			document.removeEventListener('wheel', stopWheel);
			document.removeEventListener('touchmove', stopWheel);
		};
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
		const payload = {
			managerName: data.managerName.trim(),
			clientName: data.clientName.trim(),
			nzNumber: data.nzNumber.trim(),
			calcNumber: data.calcNumber.trim(),
		};
		await onSubmit(payload);
	}

	function handleOverlayClick() {
		if (!isSubmitting) onClose();
	}

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className={styles.overlay}
					onClick={handleOverlayClick}
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
							<h2 id={titleId} className={styles.title}>Бланк нестандартного заказа</h2>
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

						<form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
							<div className={styles.field}>
								<div className={styles.inputGroup}>
									<input
										id='nz-manager'
										type='text'
										placeholder='Введите Ф.И.О.'
										autoComplete='name'
										autoFocus
										disabled={isSubmitting}
										className={cx(styles.input, errors.managerName && styles.inputError)}
										aria-invalid={errors.managerName ? 'true' : 'false'}
										aria-describedby='nz-manager-err'
										{...register('managerName', {
											required: 'Заполните Ф.И.О. менеджера',
											validate: v => v.trim().length > 0 || 'Заполните Ф.И.О. менеджера',
										})}
									/>
									<label className={styles.label} htmlFor='nz-manager'>
										Менеджер по продажам
										<span className={styles.required} aria-hidden='true'>*</span>
									</label>
								</div>
								<span id='nz-manager-err' className={styles.errorMsg}>
									{errors.managerName?.message ?? ''}
								</span>
							</div>

							<div className={styles.field}>
								<div className={styles.inputGroup}>
									<input
										id='nz-client'
										type='text'
										placeholder='Введите название'
										autoComplete='organization'
										disabled={isSubmitting}
										className={cx(styles.input, errors.clientName && styles.inputError)}
										aria-invalid={errors.clientName ? 'true' : 'false'}
										aria-describedby='nz-client-err'
										{...register('clientName', {
											required: 'Заполните название клиента',
											validate: v => v.trim().length > 0 || 'Заполните название клиента',
										})}
									/>
									<label className={styles.label} htmlFor='nz-client'>
										Название клиента
										<span className={styles.required} aria-hidden='true'>*</span>
									</label>
								</div>
								<span id='nz-client-err' className={styles.errorMsg}>
									{errors.clientName?.message ?? ''}
								</span>
							</div>

							<div className={styles.field}>
								<div className={styles.inputGroup}>
									<input
										id='nz-number'
										type='text'
										placeholder='Например, 123'
										autoComplete='off'
										disabled={isSubmitting}
										className={styles.input}
										{...register('nzNumber')}
									/>
									<label className={styles.label} htmlFor='nz-number'>
										№ листа нестандартного заказа
									</label>
								</div>
								<span className={styles.errorMsg} />
							</div>

							<div className={styles.field}>
								<div className={styles.inputGroup}>
									<input
										id='nz-calc'
										type='text'
										placeholder='Например, 456'
										autoComplete='off'
										disabled={isSubmitting}
										className={styles.input}
										{...register('calcNumber')}
									/>
									<label className={styles.label} htmlFor='nz-calc'>
										Номер расчёта
									</label>
								</div>
								<span className={styles.errorMsg} />
							</div>

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
									className={cx(styles.btn, styles.btnPrimary)}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<svg className={styles.spinner} viewBox='0 0 20 20' fill='none' aria-hidden='true' width='14' height='14'>
												<circle cx='10' cy='10' r='7' stroke='currentColor' strokeWidth='2.5' strokeOpacity='0.25' />
												<path d='M10 3a7 7 0 0 1 7 7' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
											</svg>
											Генерация...
										</>
									) : 'Скачать'}
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	);
}
