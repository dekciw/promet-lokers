import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { calcDiff } from '../../../shared/utils/calcDiff';
import Notification from '../../../shared/components/Notification/Notification.jsx';
import { getColorHex } from '../../../shared/utils/colors';
import { cx } from '../../../shared/utils/cx';
import { useAppContext } from '../../../shared/context/AppContext';
import NZModal from '../../../shared/components/NZModal/NZModal.jsx';
import styles from './Configurator.module.css';

const specItemVariants = {
	hidden: { opacity: 0, x: -10, scale: 0.97 },
	visible: i => ({
		opacity: 1,
		x: 0,
		scale: 1,
		transition: { type: 'spring', stiffness: 240, damping: 22, delay: i * 0.055 },
	}),
};

const diffItemVariants = {
	hidden: { opacity: 0, y: 16, scale: 0.96 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { type: 'spring', stiffness: 220, damping: 20 },
	},
	exit: {
		opacity: 0,
		y: -14,
		scale: 0.96,
		transition: { type: 'spring', stiffness: 220, damping: 20 },
	},
};

const colVariants = {
	hidden: { opacity: 0, y: 20, scale: 0.97 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
	},
};

const gridVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.07, delayChildren: 0.05 },
	},
};

function buildCurrentForDiff(config, lock) {
	return {
		width: config.width !== '' ? Number(config.width) : undefined,
		height: config.height !== '' ? Number(config.height) : undefined,
		depth: config.depth !== '' ? Number(config.depth) : undefined,
		bodyThickness: config.bodyThickness,
		doorThickness: config.doorThickness,
		lockName: lock?.name,
		ventilationType: config.ventilationType ?? undefined,
		bodyColorName: config.bodyColor?.name ?? undefined,
		doorColorName: config.doorColor?.name ?? undefined,
	};
}

function buildDefaultSpecsList(defaults, catalog) {
	if (!defaults) return [];
	return [
		{ label: 'Замок', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
		{ label: 'Ширина', value: `${defaults.width} мм` },
		{ label: 'Высота', value: `${defaults.height} мм` },
		{ label: 'Глубина', value: `${defaults.depth} мм` },
		{ label: 'Толщина корпуса', value: `${defaults.bodyThickness} мм` },
		{ label: 'Толщина двери', value: `${defaults.doorThickness} мм` },
		{ label: 'Вентиляция', value: 'Нет' },
		{ label: 'Цвет корпуса', value: defaults.bodyColorName, colorHex: getColorHex(defaults.bodyColorName) },
		{ label: 'Цвет двери', value: defaults.doorColorName, colorHex: getColorHex(defaults.doorColorName) },
	];
}

function buildFinalSpecsList(config, defaults, lock, ventilation) {
	if (!defaults) return [];
	return [
		{ label: 'Замок', value: lock?.name ?? config.lockId },
		{ label: 'Количество', value: `${config.quantity ?? 10} шт.` },
		{
			label: 'Габариты',
			value: `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`,
		},
		{ label: 'Толщина корпуса', value: `${config.bodyThickness} мм` },
		{ label: 'Толщина двери', value: `${config.doorThickness} мм` },
		...(config.ventilationType ? [{ label: 'Вентиляция', value: ventilation?.[config.ventilationType]?.name ?? config.ventilationType }] : []),
		...(config.bodyColor ? [{ label: 'Цвет корпуса', value: config.bodyColor.name, colorHex: config.bodyColor.color }] : []),
		...(config.doorColor ? [{ label: 'Цвет двери', value: config.doorColor.name, colorHex: config.doorColor.color }] : []),
	];
}

function IconDefault() {
	return (
		<svg width='28' height='28' viewBox='0 0 42 43' fill='none'>
			<path opacity='0.5' d='M0.899132 8.3989V34.8989L20.8991 41.3989L40.3991 34.8989L39.8991 8.3989L20.8991 0.898895L0.899132 8.3989Z' fill='white' />
			<path d='M0.899132 8.15912V34.9571L20.6747 41.3489V14.4562L0.899132 8.15912Z' stroke='#888888' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M40.4502 8.15912L20.6747 14.4562V41.3489L40.4502 34.8152V8.15912Z' stroke='#888888' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M0.899132 8.15915L20.6924 0.898895L40.4502 8.15915' stroke='#888888' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M13.3889 4.01044L32.1237 10.5338V14.3822' stroke='#888888' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

function IconNonStandard() {
	return (
		<svg width='28' height='28' viewBox='0 0 41 41' fill='none'>
			<path d='M0.8992 6.98373V34.0051L20.1677 40.4501V13.3333L0.8992 6.98373Z' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M40.4503 6.98373L20.1677 13.3333V40.4501L40.4503 33.862V6.98373Z' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M0.899139 6.98368L20.6924 0.898895L40.4502 6.98368' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M11.0406 3.94131L31.3232 9.98972V13.0685' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

function IconFinal() {
	return (
		<svg width='28' height='28' viewBox='0 0 41 41' fill='none'>
			<path d='M0.8992 6.98373V34.0051L20.1677 40.4501V13.3333L0.8992 6.98373Z' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M40.4503 6.98373L20.1677 13.3333V40.4501L40.4503 33.862V6.98373Z' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M0.899139 6.98368L20.6924 0.898895L40.4502 6.98368' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M11.0406 3.94131L31.3232 9.98972V13.0685' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

export default function Configurator() {
	const { config, price, catalog, isResetting, resetKey, parametersUnlocked } = useAppContext();
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const series = model ? (catalog.series ?? []).find(s => s.id === model.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const defaultsForDiff = defaults ? { ...defaults, lockName: catalog.locks[defaults.lockId]?.name } : null;
	const changedSpecs = calcDiff(buildCurrentForDiff(config, lock), defaultsForDiff);
	const defaultSpecsList = buildDefaultSpecsList(defaults, catalog);
	const finalSpecsList = buildFinalSpecsList(config, defaults, lock, catalog.priceRules?.ventilation);

	const [isNZOpen, setIsNZOpen] = useState(false);
	const [notify, setNotify] = useState({ visible: false, status: 'ok', title: '', message: '' });

	function openNZModal() { setIsNZOpen(true); }
	function closeNZModal() { setIsNZOpen(false); }
	function closeNotify() { setNotify(n => ({ ...n, visible: false })); }

	async function handleNZSubmit({ managerName, clientName, nzNumber, calcNumber }) {
		try {
			const { generateNZ } = await import('../../../pdf/generateNZ.js');
			await generateNZ({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
			setIsNZOpen(false);
			setNotify({ visible: true, status: 'ok', title: 'Бланк скачан', message: 'Бланк нестандартного заказа успешно сохранён' });
		} catch (err) {
			console.error('Ошибка генерации НЗ:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось создать PDF', message: err?.message ?? String(err) });
		}
	}

	const qty = config.quantity ?? 10;
	const totalClientPrice = price && !price.manual ? price.clientPrice * qty : null;
	const priceDisplay = !price || !config.modelId
		? '—'
		: price.manual
			? 'По согласованию'
			: `${totalClientPrice.toLocaleString('ru-RU')} ₽`;

	const modelDisplay = series && model ? `${series.name} — ${model.name}` : null;

	return (
		<main className='layout__content'>
			<div className={styles.configurator}>
				<div className={styles.topRow}>
					<div className={styles.heading}>
						<div className={styles.titleLine}>
							<h1 className={styles.title}>Конфигурация</h1>
						</div>
					</div>
					<AnimatePresence mode='wait'>
						{modelDisplay && (
							<motion.div
								key={modelDisplay}
								className={styles.currentModel}
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -6 }}
								transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
							>
								<span className={styles.currentModelLabel}>Текущая модель:</span>
								<span className={styles.currentModelValue}>{modelDisplay}</span>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<div className={styles.productImage}>
					<img src='/img/brand/product.png' alt='Шкафы ПРОМЕТ' className={styles.productImg} />
				</div>

				<AnimatePresence mode='wait'>
					{!model ? (
						<motion.div
							key='empty'
							className={styles.emptyState}
							initial={{ opacity: 0, scale: 0.98 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
						>
							<svg className={styles.emptyIcon} width='72' height='96' viewBox='0 0 60 80' fill='none' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' strokeLinejoin='round'>
								<rect x='2' y='72' width='56' height='6' rx='1.5' />
								<rect x='2' y='2' width='56' height='70' rx='2' />
								<line x1='20.7' y1='2' x2='20.7' y2='72' />
								<line x1='39.3' y1='2' x2='39.3' y2='72' />
								<line x1='6' y1='9' x2='17' y2='9' />
								<line x1='6' y1='13' x2='17' y2='13' />
								<line x1='6' y1='17' x2='17' y2='17' />
								<circle cx='11.5' cy='40' r='3.2' />
								<line x1='6' y1='58' x2='17' y2='58' />
								<line x1='6' y1='62' x2='17' y2='62' />
								<line x1='6' y1='66' x2='17' y2='66' />
								<line x1='24.7' y1='9' x2='35.7' y2='9' />
								<line x1='24.7' y1='13' x2='35.7' y2='13' />
								<line x1='24.7' y1='17' x2='35.7' y2='17' />
								<circle cx='30' cy='40' r='3.2' />
								<line x1='24.7' y1='58' x2='35.7' y2='58' />
								<line x1='24.7' y1='62' x2='35.7' y2='62' />
								<line x1='24.7' y1='66' x2='35.7' y2='66' />
								<line x1='43.3' y1='9' x2='54.3' y2='9' />
								<line x1='43.3' y1='13' x2='54.3' y2='13' />
								<line x1='43.3' y1='17' x2='54.3' y2='17' />
								<circle cx='48.5' cy='40' r='3.2' />
								<line x1='43.3' y1='58' x2='54.3' y2='58' />
								<line x1='43.3' y1='62' x2='54.3' y2='62' />
								<line x1='43.3' y1='66' x2='54.3' y2='66' />
							</svg>
							<p className={styles.emptyTitle}>Конфигурация не задана</p>
							<p className={styles.emptyHint}>
								{!config.seriesId
									? 'Выберите серию шкафа в панели справа'
									: 'Выберите модель и нажмите «Перейти к параметрам»'}
							</p>
						</motion.div>
					) : (
						<motion.div
							key='grid'
							className={cx(styles.configGrid, isResetting && styles.configGridLeaving)}
							variants={gridVariants}
							initial='hidden'
							animate='visible'
						>
							{/* ── Стандартное исполнение ── */}
							<motion.div className={styles.configColWrapper} variants={colVariants}>
								<div className={`${styles.configCol} ${styles.configColDefault}`}>
									<div className={styles.colHeader}>
										<span className={styles.colIcon}><IconDefault /></span>
										<span className={styles.colTitle}>Стандартное исполнение</span>
									</div>
									<motion.ul
										className={styles.specList}
										key={`${config.modelId}-${resetKey}`}
										initial='hidden'
										animate='visible'
									>
										{defaultSpecsList.map(({ label, value, colorHex }, i) => (
											<motion.li
												key={label}
												className={styles.specItem}
												custom={i}
												variants={specItemVariants}
											>
												<span className={styles.specLabel}>{label}</span>
												<span className={styles.specValue}>
													{colorHex && (
														<span
															className={styles.colorSwatch}
															style={{
																background: colorHex,
																border: colorHex === '#ffffff' ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.12)',
															}}
														/>
													)}
													{value}
												</span>
											</motion.li>
										))}
									</motion.ul>
								</div>
							</motion.div>

							{/* ── Нестандартное исполнение ── */}
							<motion.div className={styles.configColWrapper} variants={colVariants}>
								<div className={`${styles.configCol} ${styles.configColChanged}`}>
									<div className={styles.colHeader}>
										<span className={styles.colIcon}><IconNonStandard /></span>
										<span className={styles.colTitle}>Нестандартное исполнение</span>
										<AnimatePresence>
											{changedSpecs.length > 0 && (
												<motion.span
													className={styles.changeBadge}
													initial={{ opacity: 0, scale: 0.7 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.7 }}
													transition={{ type: 'spring', stiffness: 300, damping: 22 }}
												>
													{changedSpecs.length}
												</motion.span>
											)}
										</AnimatePresence>
									</div>
									<motion.ul className={styles.diffList} layout>
										<AnimatePresence initial={false} mode='popLayout' key={`${config.modelId}-${resetKey}`}>
											{changedSpecs.length === 0 && (
												<motion.li
													key='empty-diff'
													layout
													className={styles.emptyDiffMsg}
													initial={{ opacity: 0, y: 10, scale: 0.97 }}
													animate={{ opacity: 1, y: 0, scale: 1 }}
													exit={{ opacity: 0, y: -10, scale: 0.97 }}
													transition={{ type: 'spring', stiffness: 220, damping: 20 }}
												>
													Изменений нет — параметры стандартные
												</motion.li>
											)}
											{changedSpecs.map(({ label, value }) => (
												<motion.li
													key={label}
													layout
													className={styles.diffItem}
													variants={diffItemVariants}
													initial='hidden'
													animate='visible'
													exit='exit'
												>
													<span className={styles.diffLabel}>{label}</span>
													<span className={styles.diffValue}>{value}</span>
												</motion.li>
											))}
										</AnimatePresence>
									</motion.ul>
								</div>
							</motion.div>

							{/* ── Итоговая конфигурация ── */}
							<motion.div className={styles.configColWrapper} variants={colVariants}>
								<div className={`${styles.configCol} ${styles.configColFinal}`}>
									<div className={styles.colHeader}>
										<span className={styles.colIcon}><IconFinal /></span>
										<span className={styles.colTitle}>Итоговая конфигурация</span>
									</div>
									<div className={styles.colTop}>
										<motion.ul
											className={styles.finalSpec}
											key={`${config.modelId}-${resetKey}`}
											initial='hidden'
											animate='visible'
										>
											{finalSpecsList.map(({ label, value, colorHex }, i) => (
												<motion.li
													key={label}
													className={styles.finalItem}
													custom={i}
													variants={specItemVariants}
												>
													<span className={styles.finalLabel}>{label}</span>
													<span className={styles.finalValue}>
														{colorHex && (
															<span
																className={styles.colorSwatch}
																style={{
																	background: colorHex,
																	border: colorHex === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.2)',
																}}
															/>
														)}
														{value}
													</span>
												</motion.li>
											))}
											{price && !price.manual && (
												<li className={styles.finalItem}>
													<span className={styles.finalLabel}>Цена за 1 шт.</span>
													<span className={styles.finalValue}>{price.clientPrice.toLocaleString('ru-RU')} ₽</span>
												</li>
											)}
											<li className={`${styles.finalItem} ${styles.finalItemPrice}`}>
												<span className={styles.finalLabel}>Итого ({qty} шт.)</span>
												<AnimatePresence mode='wait' initial={false}>
													<motion.span
														key={priceDisplay}
														className={styles.finalValue}
														initial={{ opacity: 0, y: -7 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 7 }}
														transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
													>
														{priceDisplay}
													</motion.span>
												</AnimatePresence>
											</li>
											{price && !price.manual && price.leadTime && (
												<li className={styles.finalItem}>
													<span className={styles.finalLabel}>Срок</span>
													<span className={styles.finalValue}>{price.leadTime}</span>
												</li>
											)}
										</motion.ul>
									</div>

									<div className={styles.actions}>
										<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : !parametersUnlocked ? 'Перейдите к параметрам' : undefined}>
											<motion.button
												className={`${styles.btn} ${styles.btnKP}`}
												disabled={!model || !parametersUnlocked}
												whileTap={{ scale: 0.96 }}
												transition={{ duration: 0.1 }}
											>
												Коммерческое предложение для клиента
											</motion.button>
										</div>
										<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : !parametersUnlocked ? 'Перейдите к параметрам' : undefined}>
											<motion.button
												className={`${styles.btn} ${styles.btnPrimary} ${styles.btnNoAnim}`}
												disabled={!model || !parametersUnlocked || isNZOpen}
												onClick={openNZModal}
												type='button'
												whileTap={{ scale: 0.96 }}
												transition={{ duration: 0.1 }}
											>
												Бланк нестандартного заказа
											</motion.button>
										</div>
									</div>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{createPortal(
				<AnimatePresence>
					{model && (
						<motion.div
							className={styles.stickyBar}
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
						>
							<div className={styles.stickyPrice}>
								<span className={styles.stickyPriceLabel}>Итого</span>
								<AnimatePresence mode='wait' initial={false}>
									<motion.span
										key={priceDisplay}
										className={styles.stickyPriceValue}
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 5 }}
										transition={{ duration: 0.16 }}
									>
										{priceDisplay}
									</motion.span>
								</AnimatePresence>
							</div>
							<div className={styles.stickyActions}>
								<motion.button
									className={`${styles.btn} ${styles.btnSecondary} ${styles.stickyBtn} ${styles.btnNoAnim}`}
									disabled={!model || !parametersUnlocked || isNZOpen}
									onClick={openNZModal}
									type='button'
									whileTap={{ scale: 0.96 }}
									transition={{ duration: 0.1 }}
								>
									Бланк нестандартного заказа
								</motion.button>
								<motion.button
									className={`${styles.btn} ${styles.btnPrimary} ${styles.stickyBtn}`}
									disabled={!model || !parametersUnlocked}
									whileTap={{ scale: 0.96 }}
									transition={{ duration: 0.1 }}
								>
									Коммерческое предложение для клиента
								</motion.button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}

			<NZModal isOpen={isNZOpen} onClose={closeNZModal} onSubmit={handleNZSubmit} />

			<Notification
				visible={notify.visible}
				status={notify.status}
				title={notify.title}
				stickTo='left'
				offset={20}
				onCloserClick={closeNotify}
			>
				{notify.message}
			</Notification>
		</main>
	);
}
