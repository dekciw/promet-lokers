import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calcDiff } from '@/shared/utils/calcDiff';
import Notification from '@/shared/components/Notification/Notification.jsx';
import { getColorHex } from '@/shared/utils/colors';
import { cx } from '@/shared/utils/cx';
import { useAppContext } from '@/shared/context/AppContext';
import { useHistory } from '@/shared/hooks/useHistory';
import NonStandardOrderModal from '@/shared/components/NonStandardOrderModal/NonStandardOrderModal.jsx';
import CommercialProposalModal from '@/shared/components/CommercialProposalModal/CommercialProposalModal.jsx';
import { formatRub, calcPriceBreakdown } from '@/shared/utils/formatPrice.js';
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
		lockName: config.lockId !== 'key_basic' ? lock?.name : undefined,
		ventilationType: config.ventilationType ?? undefined,
		bodyColorName: config.bodyColor?.name !== DEFAULT_COLOR_NAME ? config.bodyColor?.name : undefined,
		doorColorName: config.doorColor?.name !== DEFAULT_COLOR_NAME ? config.doorColor?.name : undefined,
	};
}

const DEFAULT_COLOR_NAME = 'RAL 7038';

function buildDefaultSpecsList(defaults, catalog) {
	if (!defaults) return [];
	const bodyColor = defaults.bodyColorName ?? DEFAULT_COLOR_NAME;
	const doorColor = defaults.doorColorName ?? DEFAULT_COLOR_NAME;
	return [
		{ label: 'Цвет двери', value: doorColor, colorHex: getColorHex(doorColor) },
		{ label: 'Цвет корпуса', value: bodyColor, colorHex: getColorHex(bodyColor) },
		{ label: 'Замок', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
		{ label: 'Ширина', value: `${defaults.width} мм` },
		{ label: 'Высота', value: `${defaults.height} мм` },
		{ label: 'Глубина', value: `${defaults.depth} мм` },
		{ label: 'Толщина корпуса', value: `${defaults.bodyThickness} мм` },
		{ label: 'Толщина двери', value: `${defaults.doorThickness} мм` },
		{ label: 'Вентиляция', value: 'Нет' },
	];
}

function buildFinalSpecsList(config, defaults, lock, ventilation) {
	if (!defaults) return [];
	const doorColor = config.doorColor?.name ?? defaults.doorColorName ?? DEFAULT_COLOR_NAME;
	const bodyColor = config.bodyColor?.name ?? defaults.bodyColorName ?? DEFAULT_COLOR_NAME;
	const ventValue = config.ventilationType
		? (ventilation?.[config.ventilationType]?.name ?? config.ventilationType)
		: 'Нет';

	// Check if each parameter is changed from default
	const doorColorChanged = config.doorColor?.name && config.doorColor.name !== (defaults.doorColorName ?? DEFAULT_COLOR_NAME);
	const bodyColorChanged = config.bodyColor?.name && config.bodyColor.name !== (defaults.bodyColorName ?? DEFAULT_COLOR_NAME);
	const lockChanged = config.lockId !== defaults.lockId;
	const widthChanged = config.width !== '' && Number(config.width) !== Number(defaults.width);
	const heightChanged = config.height !== '' && Number(config.height) !== Number(defaults.height);
	const depthChanged = config.depth !== '' && Number(config.depth) !== Number(defaults.depth);
	const bodyThickChanged = Number(config.bodyThickness) !== Number(defaults.bodyThickness || 0.5);
	const doorThickChanged = Number(config.doorThickness) !== Number(defaults.doorThickness || 0.5);
	const ventChanged = !!config.ventilationType;

	return [
		{ label: 'Цвет двери', value: doorColor, colorHex: getColorHex(doorColor), isChanged: doorColorChanged },
		{ label: 'Цвет корпуса', value: bodyColor, colorHex: getColorHex(bodyColor), isChanged: bodyColorChanged },
		{ label: 'Замок', value: lock?.name ?? config.lockId, isChanged: lockChanged },
		{ label: 'Ширина', value: `${config.width || defaults.width} мм`, isChanged: widthChanged },
		{ label: 'Высота', value: `${config.height || defaults.height} мм`, isChanged: heightChanged },
		{ label: 'Глубина', value: `${config.depth || defaults.depth} мм`, isChanged: depthChanged },
		{ label: 'Толщина корпуса', value: `${config.bodyThickness} мм`, isChanged: bodyThickChanged },
		{ label: 'Толщина двери', value: `${config.doorThickness} мм`, isChanged: doorThickChanged },
		{ label: 'Вентиляция', value: ventValue, isChanged: ventChanged },
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
	const { config, price, catalog, isResetting, resetKey, parametersUnlocked, uid, pendingNzRestore, clearPendingNzRestore } = useAppContext();
	const { saveToHistory } = useHistory(uid);
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const modelName = model?.name ?? config.modelId ?? 'Неизвестная модель';
	const article = model?.article ?? config.modelId ?? '';
	const series = config.seriesId ? (catalog.series ?? []).find(s => s.id === config.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const defaultsForDiff = defaults ? {
		...defaults,
		bodyThickness: String(Number(defaults.bodyThickness) || 0.5),
		doorThickness: String(Number(defaults.doorThickness) || 0.5),
		lockName: catalog.locks[defaults.lockId]?.name,
		bodyColorName: defaults.bodyColorName ?? DEFAULT_COLOR_NAME,
		doorColorName: defaults.doorColorName ?? DEFAULT_COLOR_NAME,
	} : null;
	const changedSpecs = calcDiff(buildCurrentForDiff(config, lock), defaultsForDiff, catalog.priceRules?.ventilation).map(spec => {
		if (spec.label === 'Цвет корпуса:') return { ...spec, colorHex: config.bodyColor?.color ?? getColorHex(spec.value) };
		if (spec.label === 'Цвет двери:') return { ...spec, colorHex: config.doorColor?.color ?? getColorHex(spec.value) };
		return spec;
	});

	const defaultSpecsList = buildDefaultSpecsList(defaults, catalog);
	const finalSpecsList = buildFinalSpecsList(config, defaults, lock, catalog.priceRules?.ventilation);

	const [isOrderOpen, setIsOrderOpen] = useState(false);
	const [isProposalOpen, setIsProposalOpen] = useState(false);
	const [notify, setNotify] = useState({ visible: false, status: 'ok', title: '', message: '' });

	useEffect(() => {
		if (pendingNzRestore) {
			setIsOrderOpen(true);
			clearPendingNzRestore?.();
		}
	}, [pendingNzRestore]);

	function openOrderModal() { setIsOrderOpen(true); }
	function closeOrderModal() { setIsOrderOpen(false); }

	function closeNotify() { setNotify(n => ({ ...n, visible: false })); }

	function handleProposalClick() {
		setIsProposalOpen(true);
	}

	async function handleProposalSubmit({ price: enteredPrice }) {
		try {
			const { generateCommercialProposal } = await import('@/pdf/kp/generateCommercialProposal.js');
			await generateCommercialProposal({ config, catalog, price: enteredPrice });
			saveToHistory(uid, config, modelName, article, enteredPrice).catch((err) => {
				console.warn('[history] save failed:', err?.message ?? err);
			});
			setIsProposalOpen(false);
			setNotify({ visible: true, status: 'ok', title: 'КП скачано', message: 'Коммерческое предложение успешно сохранено' });
		} catch (err) {
			console.error('Ошибка генерации КП:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось создать PDF', message: err?.message ?? String(err) });
		}
	}

	async function handleProposalPrint({ price: enteredPrice }) {
		try {
			const { printCommercialProposal } = await import('@/pdf/kp/generateCommercialProposal.js');
			await printCommercialProposal({ config, catalog, price: enteredPrice });
			saveToHistory(uid, config, modelName, article, enteredPrice).catch((err) => {
				console.warn('[history] save failed:', err?.message ?? err);
			});
		} catch (err) {
			console.error('Ошибка печати КП:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось напечатать PDF', message: err?.message ?? String(err) });
		}
	}

	async function handleOrderSubmit({ managerName, branch, phone, clientName, nzNumber, calcNumber }) {
		try {
			const { generateNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
			await generateNonStandardOrder({ config, catalog, managerName, branch, phone, clientName, price, nzNumber, calcNumber });
			saveToHistory(uid, config, modelName, article, price?.clientPrice ?? 0, {
				type: 'nz',
				nzFormData: { managerName, branch, phone, clientName, nzNumber, calcNumber },
			}).catch((err) => { console.warn('[history] nz save failed:', err?.message ?? err); });
			setIsOrderOpen(false);
			setNotify({ visible: true, status: 'ok', title: 'Бланк скачан', message: 'Бланк нестандартного заказа успешно сохранён' });
		} catch (err) {
			console.error('Ошибка генерации НЗ:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось создать PDF', message: err?.message ?? String(err) });
		}
	}

	async function handleOrderPrint({ managerName, branch, phone, clientName, nzNumber, calcNumber }) {
		try {
			const { printNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
			await printNonStandardOrder({ config, catalog, managerName, branch, phone, clientName, price, nzNumber, calcNumber });
		} catch (err) {
			console.error('Ошибка печати НЗ:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось напечатать PDF', message: err?.message ?? String(err) });
		}
	}

	const qty = config.quantity ?? 10;
	const totalClientPrice = price && !price.manual ? price.clientPrice * qty : null;
	const unitPriceDisplay = !price || !config.modelId
		? '—'
		: price.manual
			? 'По согласованию'
			: `${price.clientPrice.toLocaleString('ru-RU')} ₽`;

	const modelDisplay = series && model ? `${series.name} — ${model.name}` : null;

	const bodyColorName = config.bodyColor?.name ?? defaults?.bodyColorName ?? 'RAL 7038';
	const doorColorName = config.doorColor?.name ?? defaults?.doorColorName ?? 'RAL 7038';
	const bodyColorHex = config.bodyColor?.color ?? getColorHex(bodyColorName);
	const doorColorHex = config.doorColor?.color ?? getColorHex(doorColorName);

	const orderSummary = model && defaults ? {
		model: modelDisplay,
		dims: `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`,
		thickness: `${config.bodyThickness} / ${config.doorThickness} мм`,
		lock: lock?.name ?? '—',
		qty: `${qty} шт.`,
		price: unitPriceDisplay,
		bodyColor: bodyColorName,
		bodyColorHex,
		doorColor: doorColorName,
		doorColorHex,
	} : null;

	const proposalSummary = model && defaults ? {
		model: modelDisplay,
		dims: `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`,
		bodyThickness: `${config.bodyThickness} мм`,
		doorThickness: `${config.doorThickness} мм`,
		lock: lock?.name ?? '—',
		ventilation: config.ventilationType
			? (catalog.priceRules?.ventilation?.[config.ventilationType]?.name ?? config.ventilationType)
			: null,
		qty: `${qty} шт.`,
		doorColor: doorColorName,
		doorColorHex,
		bodyColor: bodyColorName,
		bodyColorHex,
	} : null;

	return (
		<main className='layout__content'>
			<div className={styles.configurator}>
				<div className={styles.topRow}>
					<div className={styles.heading}>
						<div className={styles.titleLine}>
							<h1 className={styles.title}>Конфигурация</h1>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{series && (
						<motion.div
							className={styles.modelBar}
							initial={{ opacity: 0, y: -8, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -6, scale: 0.98 }}
							transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
						>
							<span className={styles.modelBarBadge}>{series.name}</span>
							{model && (
								<>
									<span className={styles.modelBarDivider} />
									<span className={styles.modelBarName}>{model.name}</span>
									{model.article && (
										<span className={styles.modelBarArticle}>{model.article}</span>
									)}
								</>
							)}
						</motion.div>
					)}
				</AnimatePresence>

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

							<motion.div className={styles.configColWrapper} variants={colVariants}>
								<div className={`${styles.configCol} ${styles.configColDefault}`}>
									<div className={styles.colHeader}>
										<span className={styles.colIcon}><IconDefault /></span>
										<div className={styles.colHeaderContent}>
											<div className={styles.colTitleRow}>
												<span className={styles.colTitle}>Стандартное исполнение</span>
											</div>
											{model?.basePrice && (
												<div className={styles.colSubtitle}>
													Базовая стоимость: <span className={styles.colSubtitleValue}>{model.basePrice.toLocaleString('ru-RU')} ₽</span>
												</div>
											)}
										</div>
									</div>
									<motion.ul
										className={styles.specList}
										key={config.modelId}
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
															className={cx(styles.colorSwatch, colorHex === '#ffffff' && styles.colorSwatchLight)}
															style={{ '--swatch-bg': colorHex }}
														/>
													)}
													{value}
												</span>
											</motion.li>
										))}
									</motion.ul>
								</div>
							</motion.div>

							<motion.div className={styles.configColWrapper} variants={colVariants}>
								<div className={`${styles.configCol} ${styles.configColChanged}`}>
									<div className={styles.colHeader}>
										<span className={styles.colIcon}><IconNonStandard /></span>
										<div className={styles.colHeaderContent}>
											<div className={styles.colTitleRow}>
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
											<div className={styles.colSubtitle}>
												{changedSpecs.length === 0
													? 'Все параметры стандартные'
													: `Изменено ${changedSpecs.length} из 9 параметров`}
											</div>
										</div>
									</div>
									<motion.ul className={styles.diffList}>
										<AnimatePresence initial={false} mode='popLayout' key={config.modelId}>
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
											{changedSpecs.map(({ label, value, colorHex, key }) => {
												// Map calcDiff key to breakdown key
												const breakdownKey = key === 'lockName' ? 'lock'
													: key === 'bodyColorName' ? 'bodyColor'
													: key === 'doorColorName' ? 'doorColor'
													: key === 'ventilationType' ? 'ventilation'
													: key;

												const surcharge = price?.breakdown?.[breakdownKey]?.amount;
												const rate = price?.breakdown?.[breakdownKey]?.rate;

												return (
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
														<span className={styles.diffValue}>
															{colorHex && (
																<span
																	className={cx(styles.colorSwatch, colorHex === '#ffffff' && styles.colorSwatchLight)}
																	style={{ '--swatch-bg': colorHex }}
																/>
															)}
															{value}
														</span>
														<span className={styles.diffRate}>
															{rate !== undefined && rate !== null
																? `${Math.round(rate * 100)}%`
																: '—'}
														</span>
														<span className={styles.diffSurcharge}>
															{surcharge !== undefined && surcharge !== null
																? `+${surcharge.toLocaleString('ru-RU')} ₽`
																: '—'}
														</span>
													</motion.li>
												);
											})}
										</AnimatePresence>
									</motion.ul>
								</div>
							</motion.div>

							<motion.div className={styles.configColWrapper} variants={colVariants}>
								<div className={`${styles.configCol} ${styles.configColFinal}`}>
									<div className={styles.colHeader}>
										<span className={styles.colIcon}><IconFinal /></span>
										<span className={styles.colTitle}>Итоговая конфигурация</span>
									</div>
									<motion.ul
										className={styles.finalSpec}
										key={config.modelId}
										initial='hidden'
										animate='visible'
									>
										{finalSpecsList.map(({ label, value, colorHex, isChanged }, i) => (
											<motion.li
												key={label}
												className={styles.finalItem}
												custom={i}
												variants={specItemVariants}
											>
												<span className={styles.finalLabel}>{label}</span>
												<span className={cx(styles.finalValue, isChanged && styles.finalValueChanged)}>
													{colorHex && (
														<span
															className={cx(styles.colorSwatch, colorHex === '#ffffff' ? styles.colorSwatchFinalLight : styles.colorSwatchFinal)}
															style={{ '--swatch-bg': colorHex }}
														/>
													)}
													{value}
												</span>
											</motion.li>
										))}
									</motion.ul>
								</div>
							</motion.div>

							<motion.div className={styles.priceBlockWrapper} variants={colVariants}>
								<div className={styles.priceBlock}>
									{(() => {
										const basePrice = model?.basePrice;
										const breakdown = price && !price.manual ? calcPriceBreakdown(price.clientPrice, qty) : null;
										return (
											<div className={styles.priceMain}>
												<div className={styles.priceMainBlock}>
													<div className={styles.priceMainLabel}>БАЗОВАЯ СТОИМОСТЬ</div>
													<div className={styles.priceMainValue}>
														{basePrice ? formatRub(basePrice) : 'По согласованию'}
													</div>
												</div>
												<div className={styles.priceMainTitle}>ИТОГОВАЯ СТОИМОСТЬ</div>
											</div>
										);
									})()}
									<div className={styles.priceBreakdown}>
										{(() => {
											const breakdown = price && !price.manual ? calcPriceBreakdown(price.clientPrice, qty) : null;
											return (
												<>
													<div className={styles.priceBreakdownCol}>
														<div className={styles.priceBreakdownColTitle}>За 1 шт</div>
														<div className={styles.priceBreakdownRow}>
															<span className={styles.priceBreakdownLabel}>Без НДС</span>
															<span className={styles.priceBreakdownValue}>
																{breakdown ? formatRub(breakdown.unitNoVat) : 'По согласованию'}
															</span>
														</div>
														<div className={styles.priceBreakdownRow}>
															<span className={styles.priceBreakdownLabel}>С НДС (22%)</span>
															<span className={styles.priceBreakdownValue}>
																{breakdown ? formatRub(breakdown.unitWithVat) : 'По согласованию'}
															</span>
														</div>
													</div>
													<div className={styles.priceBreakdownCol}>
														<div className={styles.priceBreakdownColTitle}>За {qty} шт</div>
														<div className={styles.priceBreakdownRow}>
															<span className={styles.priceBreakdownLabel}>Без НДС</span>
															<span className={styles.priceBreakdownValue}>
																{breakdown ? formatRub(breakdown.totalNoVat) : 'По согласованию'}
															</span>
														</div>
														<div className={styles.priceBreakdownRow}>
															<span className={styles.priceBreakdownLabel}>С НДС (22%)</span>
															<span className={styles.priceBreakdownValue}>
																{breakdown ? formatRub(breakdown.totalWithVat) : 'По согласованию'}
															</span>
														</div>
													</div>
												</>
											);
										})()}
									</div>
									<div className={styles.priceBlockActions}>
										<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : !parametersUnlocked ? 'Перейдите к параметрам' : undefined}>
											<motion.button
												className={`${styles.btn} ${styles.btnKP}`}
												disabled={!model || !parametersUnlocked}
												onClick={handleProposalClick}
												type='button'
												whileTap={{ scale: 0.96 }}
												transition={{ duration: 0.1 }}
											>
												КП для клиента
											</motion.button>
										</div>
										<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : !parametersUnlocked ? 'Перейдите к параметрам' : undefined}>
											<motion.button
												className={`${styles.btn} ${styles.btnGhost} ${styles.btnNoAnim}`}
												disabled={!model || !parametersUnlocked || isOrderOpen}
												onClick={openOrderModal}
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

			<NonStandardOrderModal isOpen={isOrderOpen} onClose={closeOrderModal} onSubmit={handleOrderSubmit} onPrint={handleOrderPrint} summary={orderSummary} initialValues={pendingNzRestore} />
			<CommercialProposalModal
				isOpen={isProposalOpen}
				onClose={() => setIsProposalOpen(false)}
				onSubmit={handleProposalSubmit}
				onPrint={handleProposalPrint}
				summary={proposalSummary}
				initialPrice={price && !price.manual ? price.clientPrice : null}
			/>

			<Notification
				visible={notify.visible}
				status={notify.status}
				title={notify.title}
				onCloseTimeout={closeNotify}
				onCloserClick={closeNotify}
			>
				{notify.message}
			</Notification>
		</main>
	);
}
