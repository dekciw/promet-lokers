import { useState, useLayoutEffect, useRef } from 'react';
import { toast } from 'sonner';
import { calcDiff } from '../../../shared/utils/calcDiff';
import { getColorHex } from '../../../shared/utils/colors';
import { cx } from '../../../shared/utils/cx';
import { useAppContext } from '../../../shared/context/AppContext';
import NZModal from '../../../shared/components/NZModal/NZModal.jsx';
import styles from './Configurator.module.css';

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
		{ label: 'Ширина', value: `${defaults.width} мм` },
		{ label: 'Высота', value: `${defaults.height} мм` },
		{ label: 'Глубина', value: `${defaults.depth} мм` },
		{ label: 'Толщина корпуса', value: `${defaults.bodyThickness} мм` },
		{ label: 'Толщина двери', value: `${defaults.doorThickness} мм` },
		{ label: 'Замок', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
		{ label: 'Вентиляция', value: 'Нет' },
		{ label: 'Цвет корпуса', value: defaults.bodyColorName, colorHex: getColorHex(defaults.bodyColorName) },
		{ label: 'Цвет двери', value: defaults.doorColorName, colorHex: getColorHex(defaults.doorColorName) },
	];
}

function buildFinalSpecsList(config, defaults, lock, ventilation) {
	if (!defaults) return [];
	return [
		{ label: 'Количество', value: `${config.quantity ?? 10} шт.` },
		{
			label: 'Габариты',
			value: `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`,
		},
		{ label: 'Толщина корпуса', value: `${config.bodyThickness} мм` },
		{ label: 'Толщина двери', value: `${config.doorThickness} мм` },
		{ label: 'Замок', value: lock?.name ?? config.lockId },
		...(config.ventilationType ? [{ label: 'Вентиляция', value: ventilation?.[config.ventilationType]?.name ?? config.ventilationType }] : []),
		...(config.bodyColor ? [{ label: 'Цвет корпуса', value: config.bodyColor.name, colorHex: config.bodyColor.color }] : []),
		...(config.doorColor ? [{ label: 'Цвет двери', value: config.doorColor.name, colorHex: config.doorColor.color }] : []),
	];
}

function IconDefault() {
	return (
		<svg width='40' height='40' viewBox='0 0 42 43' fill='none'>
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
		<svg width='40' height='40' viewBox='0 0 41 41' fill='none'>
			<path d='M0.8992 6.98373V34.0051L20.1677 40.4501V13.3333L0.8992 6.98373Z' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M40.4503 6.98373L20.1677 13.3333V40.4501L40.4503 33.862V6.98373Z' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M0.899139 6.98368L20.6924 0.898895L40.4502 6.98368' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M11.0406 3.94131L31.3232 9.98972V13.0685' stroke='#E69718' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

function IconFinal() {
	return (
		<svg width='40' height='40' viewBox='0 0 41 41' fill='none'>
			<path d='M0.8992 6.98373V34.0051L20.1677 40.4501V13.3333L0.8992 6.98373Z' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M40.4503 6.98373L20.1677 13.3333V40.4501L40.4503 33.862V6.98373Z' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M0.899139 6.98368L20.6924 0.898895L40.4502 6.98368' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
			<path d='M11.0406 3.94131L31.3232 9.98972V13.0685' stroke='#33A258' strokeWidth='1.79778' strokeMiterlimit='10' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	);
}

export default function Configurator() {
	const { config, price, catalog, isResetting, resetKey } = useAppContext();
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const series = model ? (catalog.series ?? []).find(s => s.id === model.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const defaultsForDiff = defaults ? { ...defaults, lockName: catalog.locks[defaults.lockId]?.name } : null;
	const changedSpecs = calcDiff(buildCurrentForDiff(config, lock), defaultsForDiff);
	const defaultSpecsList = buildDefaultSpecsList(defaults, catalog);
	const finalSpecsList = buildFinalSpecsList(config, defaults, lock, catalog.priceRules?.ventilation);

	const [leavingItems, setLeavingItems] = useState([]);
	const [enteringLabels, setEnteringLabels] = useState(new Set());
	const prevSpecsRef = useRef([]);
	const prevModelIdRef = useRef(config.modelId);
	const prevResetKeyRef = useRef(resetKey);

	useLayoutEffect(() => {
		if (prevResetKeyRef.current !== resetKey) {
			prevResetKeyRef.current = resetKey;
			prevSpecsRef.current = changedSpecs;
			return;
		}

		if (prevModelIdRef.current !== config.modelId) {
			prevModelIdRef.current = config.modelId;
			prevSpecsRef.current = changedSpecs;
			return;
		}

		const prev = prevSpecsRef.current;
		const removed = prev.filter(p => !changedSpecs.some(c => c.label === p.label));
		const added = changedSpecs.filter(c => !prev.some(p => p.label === c.label));
		prevSpecsRef.current = changedSpecs;

		if (removed.length > 0) {
			const withModel = removed.map(r => ({ ...r, modelId: config.modelId, resetKey }));
			setLeavingItems(curr => [...curr.filter(c => !removed.some(r => r.label === c.label)), ...withModel]);

			const timer = setTimeout(() => {
				setLeavingItems(curr => curr.filter(c => !removed.some(r => r.label === c.label)));
			}, 400);

			return () => clearTimeout(timer);
		}

		if (added.length > 0) {
			const addedLabels = new Set(added.map(a => a.label));
			setEnteringLabels(addedLabels);

			const timer = setTimeout(() => {
				setEnteringLabels(new Set());
			}, 400);

			return () => clearTimeout(timer);
		}
	}, [changedSpecs, config.modelId, resetKey]);

	const diffItemsToRender = [
		...changedSpecs.map(item => ({ ...item, leaving: false, entering: enteringLabels.has(item.label) })),
		...leavingItems
			.filter(l => l.modelId === config.modelId && l.resetKey === resetKey && !changedSpecs.some(c => c.label === l.label))
			.map(item => ({ ...item, leaving: true, entering: false })),
	];

	const [isNZOpen, setIsNZOpen] = useState(false);

	function openNZModal() {
		setIsNZOpen(true);
	}

	function closeNZModal() {
		setIsNZOpen(false);
	}

	async function handleNZSubmit({ managerName, clientName, nzNumber, calcNumber }) {
		try {
			const { generateNZ } = await import('../../../pdf/generateNZ.js');
			await generateNZ({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
			setIsNZOpen(false);
			toast.success('Бланк НЗ скачан');
		} catch (err) {
			console.error('Ошибка генерации НЗ:', err);
			toast.error('Не удалось создать PDF', { description: err?.message ?? String(err) });
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
					{modelDisplay && (
						<div className={styles.currentModel}>
							<span className={styles.currentModelLabel}>Текущая модель:</span>
							<span className={styles.currentModelValue}>{modelDisplay}</span>
						</div>
					)}
				</div>

				<div className={styles.productImage}>
					<img src='/img/header_logo.png' alt='Шкафы ПРОМЕТ' className={styles.productImg} />
				</div>

			{!model ? (
					<div className={styles.emptyState}>
						<svg className={styles.emptyIcon} width='72' height='96' viewBox='0 0 60 80' fill='none' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' strokeLinejoin='round'>
							{/* Plinth */}
							<rect x='2' y='72' width='56' height='6' rx='1.5' />
							{/* Cabinet body */}
							<rect x='2' y='2' width='56' height='70' rx='2' />
							{/* Door dividers */}
							<line x1='20.7' y1='2' x2='20.7' y2='72' />
							<line x1='39.3' y1='2' x2='39.3' y2='72' />
							{/* Door 1 — top vents */}
							<line x1='6' y1='9' x2='17' y2='9' />
							<line x1='6' y1='13' x2='17' y2='13' />
							<line x1='6' y1='17' x2='17' y2='17' />
							{/* Door 1 — lock */}
							<circle cx='11.5' cy='40' r='3.2' />
							{/* Door 1 — bottom vents */}
							<line x1='6' y1='58' x2='17' y2='58' />
							<line x1='6' y1='62' x2='17' y2='62' />
							<line x1='6' y1='66' x2='17' y2='66' />
							{/* Door 2 — top vents */}
							<line x1='24.7' y1='9' x2='35.7' y2='9' />
							<line x1='24.7' y1='13' x2='35.7' y2='13' />
							<line x1='24.7' y1='17' x2='35.7' y2='17' />
							{/* Door 2 — lock */}
							<circle cx='30' cy='40' r='3.2' />
							{/* Door 2 — bottom vents */}
							<line x1='24.7' y1='58' x2='35.7' y2='58' />
							<line x1='24.7' y1='62' x2='35.7' y2='62' />
							<line x1='24.7' y1='66' x2='35.7' y2='66' />
							{/* Door 3 — top vents */}
							<line x1='43.3' y1='9' x2='54.3' y2='9' />
							<line x1='43.3' y1='13' x2='54.3' y2='13' />
							<line x1='43.3' y1='17' x2='54.3' y2='17' />
							{/* Door 3 — lock */}
							<circle cx='48.5' cy='40' r='3.2' />
							{/* Door 3 — bottom vents */}
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
					</div>
				) : (
					<div className={cx(styles.configGrid, isResetting && styles.configGridLeaving)}>

						{/* Стандартное исполнение */}
						<div className={styles.configColWrapper}>
							<div className={styles.colHeader}>
								<span className={styles.colIcon}><IconDefault /></span>
								<span className={styles.colTitle}>Стандартное<br/>исполнение</span>
							</div>
							<div className={`${styles.configCol} ${styles.configColDefault}`}>
								<div className={styles.tableWrap}>
									<div className={styles.tableHead}>
										<span>Показатель</span>
										<span>Значение</span>
									</div>
									<ul className={styles.specList} key={`${config.modelId}-${resetKey}`}>
										{defaultSpecsList.map(({ label, value, colorHex }, i) => (
											<li key={label} className={styles.specItem} style={{ animationDelay: `${i * 0.05}s` }}>
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
											</li>
										))}
										{Array.from({ length: 3 }).map((_, i) => (
											<li key={`empty-${i}`} className={styles.specItem} />
										))}
									</ul>
								</div>
							</div>
						</div>

						{/* Нестандартное исполнение */}
						<div className={styles.configColWrapper}>
							<div className={styles.colHeader}>
								<span className={styles.colIcon}><IconNonStandard /></span>
								<span className={styles.colTitle}>Нестандартное<br/>исполнение</span>
							</div>
							<div className={`${styles.configCol} ${styles.configColChanged}`}>
								<div className={styles.tableWrap}>
									<div className={styles.tableHead}>
										<span>Показатель</span>
										<span>Значение</span>
									</div>
									<ul className={styles.diffList}>
										{diffItemsToRender.map(({ label, value, leaving, entering }, i) => (
											<li
												key={label}
												className={cx(styles.diffItem, leaving && styles.diffItemLeaving, entering && styles.diffItemEntering)}
												style={entering ? { animationDelay: `${i * 0.05}s` } : undefined}
											>
												<span className={styles.diffLabel}>{label}</span>
												<span className={styles.diffValue}>{value}</span>
											</li>
										))}
										{Array.from({ length: Math.max(0, defaultSpecsList.length + 3 - diffItemsToRender.length) }).map((_, i) => (
											<li key={`empty-${i}`} className={styles.diffItem} />
										))}
									</ul>
								</div>
							</div>
						</div>

						{/* Итоговая конфигурация */}
						<div className={styles.configColWrapper}>
							<div className={styles.colHeader}>
								<span className={styles.colIcon}><IconFinal /></span>
								<span className={styles.colTitle}>Итоговая<br/>конфигурация</span>
							</div>
							<div className={`${styles.configCol} ${styles.configColFinal}`}>
							<div className={styles.colTop}>
								<div className={styles.tableWrap}>
									<div className={styles.tableHead}>
										<span>Показатель</span>
										<span>Значение</span>
									</div>
									<ul className={styles.finalSpec} key={`${config.modelId}-${resetKey}`}>
										{finalSpecsList.map(({ label, value, colorHex }, i) => (
											<li key={label} className={styles.finalItem} style={{ animationDelay: `${i * 0.05}s` }}>
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
											</li>
										))}
										{price && !price.manual && (
											<li className={styles.finalItem}>
												<span className={styles.finalLabel}>Цена за 1 шт.</span>
												<span className={styles.finalValue}>{price.clientPrice.toLocaleString('ru-RU')} ₽</span>
											</li>
										)}
										<li className={`${styles.finalItem} ${styles.finalItemPrice}`}>
											<span className={styles.finalLabel}>Итого ({qty} шт.)</span>
											<span key={priceDisplay} className={styles.finalValue}>
												{priceDisplay}
											</span>
										</li>
										{price && !price.manual && price.leadTime && (
											<li className={styles.finalItem}>
												<span className={styles.finalLabel}>Срок</span>
												<span className={styles.finalValue}>{price.leadTime}</span>
											</li>
										)}
									</ul>
								</div>
							</div>

							<div className={styles.actions}>
								<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : undefined}>
									<button className={`${styles.btn} ${styles.btnKP}`} disabled={!model}>
										КП для клиента
									</button>
								</div>
								<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : undefined}>
									<button
										className={`${styles.btn} ${styles.btnNZ}`}
										disabled={!model || isNZOpen}
										onClick={openNZModal}
										type='button'
									>
										Бланк НЗ
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				)}
			</div>

			<div className={cx(styles.stickyBar, model && styles.stickyBarVisible)}>
				<div className={styles.stickyPrice}>
					<span className={styles.stickyPriceLabel}>Итого</span>
					<span className={styles.stickyPriceValue}>{priceDisplay}</span>
				</div>
				<div className={styles.stickyActions}>
					<button
						className={`${styles.btn} ${styles.btnSecondary} ${styles.stickyBtn}`}
						disabled={!model || isNZOpen}
						onClick={openNZModal}
						type='button'
					>
						Бланк НЗ
					</button>
					<button className={`${styles.btn} ${styles.btnPrimary} ${styles.stickyBtn}`} disabled={!model}>
						КП для клиента
					</button>
				</div>
			</div>

			<NZModal isOpen={isNZOpen} onClose={closeNZModal} onSubmit={handleNZSubmit} />
		</main>
	);
}
