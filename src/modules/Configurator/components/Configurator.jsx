import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react'; // eslint-disable-line no-unused-vars
import Notification from '@/shared/components/Notification/Notification.jsx';
import { getColorHex } from '@/shared/utils/colors';
import { cx } from '@/shared/utils/cx';
import { useAppContext } from '@/shared/context/AppContext';
import { getModelPhoto } from '@/shared/utils/modelPhotos';
import { getLockPhoto } from '@/shared/utils/lockPhotos';
import NonStandardOrderModal from '@/shared/components/NonStandardOrderModal/NonStandardOrderModal.jsx';
import CommercialProposalModal from '@/shared/components/CommercialProposalModal/CommercialProposalModal.jsx';
import styles from './Configurator.module.css';

const DEFAULT_COLOR_NAME = 'RAL 7038';

const rowVariants = {
	hidden: { opacity: 0, x: -8 },
	visible: i => ({
		opacity: 1,
		x: 0,
		transition: { type: 'spring', stiffness: 260, damping: 24, delay: i * 0.04 },
	}),
};

const fadeUp = {
	hidden: { opacity: 0, y: 14 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] } },
};

const stagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

function buildMergedSpecsList(config, defaults, lock, catalog) {
	if (!defaults) return [];
	const ventilation = catalog.priceRules?.ventilation;
	const currentLockName = lock?.name ?? config.lockId;
	const defaultLockName = catalog.locks[defaults.lockId]?.name ?? defaults.lockId;
	const w = config.width !== '' ? String(config.width) : String(defaults.width);
	const h = config.height !== '' ? String(config.height) : String(defaults.height);
	const d = config.depth !== '' ? String(config.depth) : String(defaults.depth);
	const defaultBodyColor = defaults.bodyColorName ?? DEFAULT_COLOR_NAME;
	const defaultDoorColor = defaults.doorColorName ?? DEFAULT_COLOR_NAME;
	const bodyColorName = config.bodyColor?.name ?? defaultBodyColor;
	const doorColorName = config.doorColor?.name ?? defaultDoorColor;

	return [
		{ label: 'Замок', value: currentLockName, defaultValue: defaultLockName, changed: currentLockName !== defaultLockName },
		{ label: 'Ширина', value: `${w} мм`, defaultValue: `${defaults.width} мм`, changed: w !== String(defaults.width) },
		{ label: 'Высота', value: `${h} мм`, defaultValue: `${defaults.height} мм`, changed: h !== String(defaults.height) },
		{ label: 'Глубина', value: `${d} мм`, defaultValue: `${defaults.depth} мм`, changed: d !== String(defaults.depth) },
		{ label: 'Толщина корпуса', value: `${config.bodyThickness} мм`, defaultValue: `${defaults.bodyThickness} мм`, changed: String(config.bodyThickness) !== String(defaults.bodyThickness) },
		{ label: 'Толщина двери', value: `${config.doorThickness} мм`, defaultValue: `${defaults.doorThickness} мм`, changed: String(config.doorThickness) !== String(defaults.doorThickness) },
		{ label: 'Вентиляция', value: config.ventilationType ? (ventilation?.[config.ventilationType]?.name ?? config.ventilationType) : 'Нет', defaultValue: 'Нет', changed: !!config.ventilationType },
		{ label: 'Цвет корпуса', value: bodyColorName, defaultValue: defaultBodyColor, changed: bodyColorName !== defaultBodyColor, colorHex: config.bodyColor?.color ?? getColorHex(bodyColorName) },
		{ label: 'Цвет двери', value: doorColorName, defaultValue: defaultDoorColor, changed: doorColorName !== defaultDoorColor, colorHex: config.doorColor?.color ?? getColorHex(doorColorName) },
	];
}

export default function Configurator() {
	const { config, price, catalog, isResetting, resetKey, parametersUnlocked } = useAppContext();
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const series = model ? (catalog.series ?? []).find(s => s.id === model.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const mergedSpecsList = buildMergedSpecsList(config, defaults, lock, catalog);
	const changesCount = mergedSpecsList.filter(s => s.changed).length;
	const heroPhoto = model?.image || getModelPhoto(model?.name) || null;

	const lockPhoto = getLockPhoto(lock?.name);
	const [photoMode, setPhotoMode] = useState('locker');

	useEffect(() => { setPhotoMode('locker'); }, [config.modelId]);

	const [isOrderOpen, setIsOrderOpen] = useState(false);
	const [isProposalOpen, setIsProposalOpen] = useState(false);
	const [notify, setNotify] = useState({ visible: false, status: 'ok', title: '', message: '' });

	function closeNotify() { setNotify(n => ({ ...n, visible: false })); }
	function openOrderModal() { setIsOrderOpen(true); }
	function closeOrderModal() { setIsOrderOpen(false); }

	async function handleProposalSubmit({ price: enteredPrice }) {
		try {
			const { generateCommercialProposal } = await import('@/pdf/kp/generateCommercialProposal.js');
			await generateCommercialProposal({ config, catalog, price: enteredPrice });
			setIsProposalOpen(false);
			setNotify({ visible: true, status: 'ok', title: 'КП скачано', message: 'Коммерческое предложение успешно сохранено' });
		} catch (err) {
			console.error('Ошибка генерации КП:', err);
			setNotify({ visible: true, status: 'error', title: 'Не удалось создать PDF', message: err?.message ?? String(err) });
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

	const qty = config.quantity ?? 10;
	const totalClientPrice = price && !price.manual ? price.clientPrice * qty : null;
	const unitPriceDisplay = !price || !config.modelId
		? '—'
		: price.manual ? 'По согласованию' : `${price.clientPrice.toLocaleString('ru-RU')} ₽`;

	const modelDisplay = series && model ? `${series.name} — ${model.name}` : null;
	const dims = defaults
		? `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`
		: '';

	const canAction = !!model && parametersUnlocked;
	const tooltipMsg = !config.seriesId
		? 'Не выбрана серия шкафа'
		: !model ? 'Не выбрана модель шкафа'
		: !parametersUnlocked ? 'Перейдите к параметрам'
		: undefined;

	const orderSummary = model && defaults ? {
		model: modelDisplay,
		dims,
		thickness: `${config.bodyThickness} / ${config.doorThickness} мм`,
		lock: lock?.name ?? '—',
		qty: `${qty} шт.`,
		price: unitPriceDisplay,
		bodyColor: config.bodyColor?.name ?? defaults.bodyColorName ?? DEFAULT_COLOR_NAME,
		doorColor: config.doorColor?.name ?? defaults.doorColorName ?? DEFAULT_COLOR_NAME,
	} : null;

	const proposalSummary = model && defaults ? {
		model: modelDisplay,
		dims,
		bodyThickness: `${config.bodyThickness} мм`,
		doorThickness: `${config.doorThickness} мм`,
		lock: lock?.name ?? '—',
		ventilation: config.ventilationType ? (catalog.priceRules?.ventilation?.[config.ventilationType]?.name ?? config.ventilationType) : null,
		qty: `${qty} шт.`,
		doorColor: config.doorColor?.name ?? defaults.doorColorName ?? DEFAULT_COLOR_NAME,
		bodyColor: config.bodyColor?.name ?? defaults.bodyColorName ?? DEFAULT_COLOR_NAME,
	} : null;

	const changesLabel = changesCount === 1 ? '1 изменение' : changesCount < 5 ? `${changesCount} изменения` : `${changesCount} изменений`;

	return (
		<main className='layout__content'>
			<div className={styles.configurator}>

				{/* Верхняя строка */}
				<div className={styles.topRow}>
					<h1 className={styles.title}>Конфигурация</h1>
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

				<AnimatePresence mode='wait'>
					{!model ? (
						/* ── Пустое состояние ── */
						<motion.div
							key='empty'
							initial={{ opacity: 0, scale: 0.98 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.97 }}
							transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
						>
							<div className={styles.emptyHero}>
								<svg className={styles.emptyIcon} width='58' height='76' viewBox='0 0 60 80' fill='none' stroke='rgba(255,255,255,0.22)' strokeWidth='1.4' strokeLinecap='round' strokeLinejoin='round'>
									<rect x='2' y='72' width='56' height='6' rx='1.5' />
									<rect x='2' y='2' width='56' height='70' rx='2' />
									<line x1='20.7' y1='2' x2='20.7' y2='72' />
									<line x1='39.3' y1='2' x2='39.3' y2='72' />
									<line x1='6' y1='9' x2='17' y2='9' /><line x1='6' y1='13' x2='17' y2='13' /><line x1='6' y1='17' x2='17' y2='17' />
									<circle cx='11.5' cy='40' r='3.2' />
									<line x1='6' y1='58' x2='17' y2='58' /><line x1='6' y1='62' x2='17' y2='62' /><line x1='6' y1='66' x2='17' y2='66' />
									<line x1='24.7' y1='9' x2='35.7' y2='9' /><line x1='24.7' y1='13' x2='35.7' y2='13' /><line x1='24.7' y1='17' x2='35.7' y2='17' />
									<circle cx='30' cy='40' r='3.2' />
									<line x1='24.7' y1='58' x2='35.7' y2='58' /><line x1='24.7' y1='62' x2='35.7' y2='62' /><line x1='24.7' y1='66' x2='35.7' y2='66' />
									<line x1='43.3' y1='9' x2='54.3' y2='9' /><line x1='43.3' y1='13' x2='54.3' y2='13' /><line x1='43.3' y1='17' x2='54.3' y2='17' />
									<circle cx='48.5' cy='40' r='3.2' />
									<line x1='43.3' y1='58' x2='54.3' y2='58' /><line x1='43.3' y1='62' x2='54.3' y2='62' /><line x1='43.3' y1='66' x2='54.3' y2='66' />
								</svg>
								<div className={styles.emptyHeroText}>
									<p className={styles.emptyTitle}>Конфигурация не задана</p>
									<p className={styles.emptyHint}>
										{!config.seriesId
											? 'Выберите серию шкафа в панели справа'
											: 'Выберите модель и нажмите «Перейти к параметрам»'}
									</p>
								</div>
							</div>
						</motion.div>
					) : (
						/* ── Основной контент ── */
						<motion.div
							key={config.modelId}
							className={cx(styles.content, isResetting && styles.contentLeaving)}
							variants={stagger}
							initial='hidden'
							animate='visible'
						>
							{/* Hero — статичный баннер */}
							<motion.div className={styles.modelHero} variants={fadeUp}>
								<img src='/img/brand/product.png' alt='' className={styles.heroPlaceholderImg} />
								<div className={styles.heroOverlay}>
									<div className={styles.heroTop}>
										{series && <span className={styles.heroBadge}>{series.name}</span>}
										<AnimatePresence>
											{changesCount > 0 && (
												<motion.span
													className={styles.heroChangeBadge}
													initial={{ opacity: 0, scale: 0.75 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.75 }}
													transition={{ type: 'spring', stiffness: 300, damping: 22 }}
												>
													<svg width='6' height='6' viewBox='0 0 6 6' fill='currentColor' aria-hidden='true'><circle cx='3' cy='3' r='3'/></svg>
													{changesLabel}
												</motion.span>
											)}
										</AnimatePresence>
									</div>
									<div className={styles.heroBottom}>
										<h2 className={styles.heroName}>{model.name}</h2>
										{dims && <span className={styles.heroDims}>{dims}</span>}
									</div>
								</div>
							</motion.div>

							{/* Сетка: спецификация | фото | КП */}
							<div className={styles.contentGrid}>

								{/* 1. Спецификация */}
								<motion.div className={styles.specsCard} variants={fadeUp}>
									<div className={styles.specsHeader}>
										<span className={styles.specsTitle}>Спецификация</span>
										<AnimatePresence>
											{changesCount > 0 && (
												<motion.span
													className={styles.changesBadge}
													initial={{ opacity: 0, scale: 0.7 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.7 }}
													transition={{ type: 'spring', stiffness: 300, damping: 22 }}
												>
													{changesCount} изм.
												</motion.span>
											)}
										</AnimatePresence>
									</div>

									<motion.ul
										className={styles.specRows}
										key={`${config.modelId}-${resetKey}`}
										variants={stagger}
										initial='hidden'
										animate='visible'
									>
										{mergedSpecsList.map(({ label, value, defaultValue, changed, colorHex }, i) => (
											<motion.li
												key={label}
												className={cx(styles.specRow, changed && styles.specRowChanged)}
												custom={i}
												variants={rowVariants}
											>
												<span className={styles.specLabel}>
													{changed && <span className={styles.changedDot} aria-hidden='true' />}
													{label}
												</span>
												<span className={styles.specValue}>
													{changed && <span className={styles.oldValue}>{defaultValue}</span>}
													{colorHex && (
														<span
															className={styles.colorSwatch}
															style={{
																background: colorHex,
																border: colorHex === '#ffffff' ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.1)',
															}}
														/>
													)}
													<span className={cx(changed && styles.newValue)}>{value}</span>
												</span>
											</motion.li>
										))}
									</motion.ul>

									<div className={styles.specsFooter}>
										<span className={styles.specsFooterLabel}>Базовая цена</span>
										<span className={styles.specsFooterValue}>{model.basePrice?.toLocaleString('ru-RU')} ₽</span>
									</div>
								</motion.div>

								{/* 2. Фото модели */}
								<motion.div className={styles.photoCard} variants={fadeUp}>
									<div className={styles.photoCardHeader}>
										<span className={styles.specsTitle}>{photoMode === 'lock' ? 'Замок' : 'Фото'}</span>
									</div>
									<div className={styles.photoCardBody}>
										<AnimatePresence mode='wait' initial={false}>
											{photoMode === 'lock' && lockPhoto ? (
												<motion.img
													key='lock'
													src={lockPhoto}
													alt={lock?.name}
													className={cx(styles.photoCardImg, styles.photoCardImgLock)}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ duration: 0.18 }}
												/>
											) : heroPhoto ? (
												<motion.img
													key='locker'
													src={heroPhoto}
													alt={model.name}
													className={cx(styles.photoCardImg, styles.photoCardImgLocker)}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ duration: 0.18 }}
												/>
											) : (
												<motion.div
													key='empty'
													className={styles.photoCardEmpty}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ duration: 0.18 }}
												>
													<svg width='48' height='64' viewBox='0 0 60 80' fill='none' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' strokeLinejoin='round'>
														<rect x='2' y='72' width='56' height='6' rx='1.5' />
														<rect x='2' y='2' width='56' height='70' rx='2' />
														<line x1='20.7' y1='2' x2='20.7' y2='72' /><line x1='39.3' y1='2' x2='39.3' y2='72' />
														<circle cx='30' cy='40' r='3.2' />
													</svg>
													<span>Фото появится скоро</span>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
									{(heroPhoto || lockPhoto) && (
										<div className={styles.photoToggle}>
											<button
												type='button'
												className={cx(styles.photoToggleBtn, photoMode === 'locker' && styles.photoToggleBtnActive)}
												onClick={() => setPhotoMode('locker')}
												title='Фото шкафа'
											>
												<svg width='14' height='14' viewBox='0 0 60 80' fill='none' stroke='currentColor' strokeWidth='4.5' strokeLinecap='round' strokeLinejoin='round'>
													<rect x='2' y='72' width='56' height='6' rx='1.5' />
													<rect x='2' y='2' width='56' height='70' rx='2' />
													<line x1='20.7' y1='2' x2='20.7' y2='72' />
													<line x1='39.3' y1='2' x2='39.3' y2='72' />
													<circle cx='30' cy='40' r='4' />
												</svg>
												Шкаф
											</button>
											<button
												type='button'
												className={cx(styles.photoToggleBtn, photoMode === 'lock' && styles.photoToggleBtnActive)}
												onClick={() => setPhotoMode('lock')}
												title='Фото замка'
											>
												<svg width='13' height='13' viewBox='0 0 12 12' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
													<rect x='2' y='5.5' width='8' height='5.5' rx='1.2'/>
													<path d='M4 5.5V3.5a2 2 0 1 1 4 0v2'/>
												</svg>
												Замок
											</button>
										</div>
									)}
									<div className={styles.photoCardFooter}>
										<p className={styles.photoCardName}>{model.name}</p>
										<div className={styles.photoCardChips}>
											{dims && (
												<span className={styles.photoChip}>
													<svg width='11' height='11' viewBox='0 0 12 12' fill='none' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round'><rect x='1' y='1' width='10' height='10' rx='1.5'/><line x1='1' y1='5' x2='11' y2='5'/></svg>
													{dims}
												</span>
											)}
											{(() => {
												const colorName = config.bodyColor?.name ?? defaults?.bodyColorName ?? 'RAL 7038';
												const colorHex = config.bodyColor?.color ?? getColorHex(colorName);
												return (
													<span className={styles.photoChip}>
														<span className={styles.photoChipSwatch} style={{ background: colorHex, border: colorHex === '#ffffff' ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.12)' }} />
														{colorName}
													</span>
												);
											})()}
											{lock && (
												<span className={styles.photoChip}>
													<svg width='11' height='11' viewBox='0 0 12 12' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
														<rect x='2' y='5.5' width='8' height='5.5' rx='1.2'/>
														<path d='M4 5.5V3.5a2 2 0 1 1 4 0v2'/>
													</svg>
													{lock.name.replace(/^Замок\s+/i, '')}
												</span>
											)}
										</div>
									</div>
								</motion.div>

								{/* 3. КП — цена + действия */}
								<motion.div className={styles.priceCard} variants={fadeUp}>
									<div className={styles.priceCardBody}>
										<div className={styles.priceRow}>
											<span className={styles.priceRowLabel}>Количество</span>
											<span className={styles.priceRowVal}>{qty} шт.</span>
										</div>
										<div className={styles.priceSep} />
										<div className={styles.priceMain}>
											<span className={styles.pricePerLabel}>за 1 шт.</span>
											<AnimatePresence mode='wait' initial={false}>
												<motion.div
													key={unitPriceDisplay}
													className={styles.priceValue}
													initial={{ opacity: 0, y: -8 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: 8 }}
													transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
												>
													{unitPriceDisplay}
												</motion.div>
											</AnimatePresence>
										</div>
										{totalClientPrice && (
											<>
												<div className={styles.priceSep} />
												<div className={styles.priceRow}>
													<span className={styles.priceRowLabel}>Итого</span>
													<span className={styles.priceTotalVal}>{totalClientPrice.toLocaleString('ru-RU')} ₽</span>
												</div>
												{price && !price.manual && (
													<span className={styles.priceMeta}>{qty} × {price.clientPrice.toLocaleString('ru-RU')} ₽</span>
												)}
											</>
										)}
									</div>

									<div className={styles.priceCardActions}>
										<div data-tooltip={tooltipMsg}>
											<motion.button
												className={cx(styles.btn, styles.btnKP)}
												disabled={!canAction}
												onClick={() => setIsProposalOpen(true)}
												type='button'
												whileTap={{ scale: 0.96 }}
												transition={{ duration: 0.1 }}
											>
												КП для клиента
											</motion.button>
										</div>
										<div data-tooltip={tooltipMsg}>
											<motion.button
												className={cx(styles.btn, styles.btnGhost)}
												disabled={!canAction || isOrderOpen}
												onClick={openOrderModal}
												type='button'
												whileTap={{ scale: 0.96 }}
												transition={{ duration: 0.1 }}
											>
												Бланк нестандартного заказа
											</motion.button>
										</div>
									</div>
								</motion.div>

							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<NonStandardOrderModal isOpen={isOrderOpen} onClose={closeOrderModal} onSubmit={handleOrderSubmit} summary={orderSummary} />
			<CommercialProposalModal
				isOpen={isProposalOpen}
				onClose={() => setIsProposalOpen(false)}
				onSubmit={handleProposalSubmit}
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
