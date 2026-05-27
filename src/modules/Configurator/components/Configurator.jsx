import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calcDiff } from '@/shared/utils/calcDiff';
import Notification from '@/shared/components/Notification/Notification.jsx';
import { getColorHex } from '@/shared/utils/colors';
import { cx } from '@/shared/utils/cx';
import { useAppContext } from '@/shared/context/AppContext';
import { useHistory } from '@/shared/hooks/useHistory';
import NonStandardOrderModal from '@/shared/components/NonStandardOrderModal/NonStandardOrderModal.jsx';
import CommercialProposalModal from '@/shared/components/CommercialProposalModal/CommercialProposalModal.jsx';
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

const DEFAULT_COLOR_NAME = 'RAL 7038';

function buildDefaultSpecsList(defaults, catalog) {
	if (!defaults) return [];
	const bodyColor = defaults.bodyColorName ?? DEFAULT_COLOR_NAME;
	const doorColor = defaults.doorColorName ?? DEFAULT_COLOR_NAME;
	return [
		{ label: 'Замок', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
		{ label: 'Ширина', value: `${defaults.width} мм` },
		{ label: 'Высота', value: `${defaults.height} мм` },
		{ label: 'Глубина', value: `${defaults.depth} мм` },
		{ label: 'Толщина корпуса', value: `${defaults.bodyThickness} мм` },
		{ label: 'Толщина двери', value: `${defaults.doorThickness} мм` },
		{ label: 'Вентиляция', value: 'Нет' },
		{ label: 'Цвет корпуса', value: bodyColor, colorHex: getColorHex(bodyColor) },
		{ label: 'Цвет двери', value: doorColor, colorHex: getColorHex(doorColor) },
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
	const { config, price, catalog, isResetting, resetKey, parametersUnlocked, uid } = useAppContext();
	const { saveToHistory } = useHistory(uid);
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const modelName = model?.name ?? config.modelId ?? 'Неизвестная модель';
	const article = model?.article ?? config.modelId ?? '';
	const series = config.seriesId ? (catalog.series ?? []).find(s => s.id === config.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const defaultsForDiff = defaults ? {
		...defaults,
		lockName: catalog.locks[defaults.lockId]?.name,
		bodyColorName: defaults.bodyColorName ?? DEFAULT_COLOR_NAME,
		doorColorName: defaults.doorColorName ?? DEFAULT_COLOR_NAME,
	} : null;
	// DEBUG: remove after fix verified
	console.log('[DEBUG calcDiff] ventilationType:', config.ventilationType, 'ventilationCatalog:', catalog.priceRules?.ventilation, 'entry:', catalog.priceRules?.ventilation?.[config.ventilationType]);
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

	async function handleOrderSubmit({ managerName, clientName, nzNumber, calcNumber }) {
		try {
			const { generateNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
			await generateNonStandardOrder({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
			setIsOrderOpen(false);
			setNotify({ visible: true, status: 'ok', title: 'Бланк скачан', message: 'Бланк нестандартного заказа успешно сохранён' });
		} catch (err) {
			console.error('Ошибка генерации НЗ:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось создать PDF', message: err?.message ?? String(err) });
		}
	}

	async function handleOrderPrint({ managerName, clientName, nzNumber, calcNumber }) {
		try {
			const { printNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
			await printNonStandardOrder({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
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

				<div className={styles.modelHero}>
					<img src='/img/brand/product.png' alt='' className={styles.heroPlaceholderImg} />
					<div className={styles.heroOverlay}>
						<div className={styles.heroTop}>
							{series && <span className={styles.heroBadge}>{series.name}</span>}
						</div>
						{model && (
							<div className={styles.heroBottom}>
								<h2 className={styles.heroName}>{model.name}</h2>
							</div>
						)}
					</div>
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
									<div className={styles.cardInfoBar}>
										<div className={styles.cardInfoBarItem}>
											<span className={styles.cardInfoBarLabel}>Базовая цена</span>
											<span className={styles.cardInfoBarValue}>{model.basePrice?.toLocaleString('ru-RU')} ₽</span>
										</div>
									</div>
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
											{changedSpecs.map(({ label, value, colorHex }) => (
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
										</AnimatePresence>
									</motion.ul>
									<div className={styles.cardInfoBar}>
										<div className={styles.cardInfoBarItem}>
											<span className={styles.cardInfoBarLabel}>
												{changedSpecs.length === 0
													? 'Все параметры стандартные'
													: `Изменено ${changedSpecs.length} из 9 параметров`}
											</span>
										</div>
									</div>
								</div>
							</motion.div>

							{/* ── Итоговая конфигурация ── */}
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
									</motion.ul>
								</div>

								{/* ── Блок цены ── */}
								<div className={styles.priceBlock}>
									<div className={styles.priceBlockTop}>
										<span className={styles.priceBlockLabel}>за 1 шт.</span>
										<AnimatePresence mode='wait' initial={false}>
											<motion.div
												key={unitPriceDisplay}
												className={styles.priceBlockValue}
												initial={{ opacity: 0, y: -8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 8 }}
												transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
											>
												{unitPriceDisplay}
											</motion.div>
										</AnimatePresence>
										{price && !price.manual && (
											<span className={styles.priceBlockUnit}>
												Общая сумма: {totalClientPrice.toLocaleString('ru-RU')} = {price.clientPrice.toLocaleString('ru-RU')} × {qty} шт.
											</span>
										)}
										<span className={styles.priceBlockLeadTime}>
											Итого: {qty} шт.
										</span>
										{price && !price.manual && price.leadTime && (
											<span className={styles.priceBlockLeadTime}>{price.leadTime}</span>
										)}
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


			<NonStandardOrderModal isOpen={isOrderOpen} onClose={closeOrderModal} onSubmit={handleOrderSubmit} onPrint={handleOrderPrint} summary={orderSummary} />
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
