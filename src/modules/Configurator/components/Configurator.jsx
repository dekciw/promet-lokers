import { useState, useLayoutEffect, useRef } from 'react';
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
		{ label: 'Ширина:', value: `${defaults.width} мм` },
		{ label: 'Высота:', value: `${defaults.height} мм` },
		{ label: 'Глубина:', value: `${defaults.depth} мм` },
		{ label: 'Толщина корпуса:', value: `${defaults.bodyThickness} мм` },
		{ label: 'Толщина двери:', value: `${defaults.doorThickness} мм` },
		{ label: 'Замок:', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
		{ label: 'Цвет корпуса:', value: defaults.bodyColorName, colorHex: getColorHex(defaults.bodyColorName) },
		{ label: 'Цвет двери:', value: defaults.doorColorName, colorHex: getColorHex(defaults.doorColorName) },
	];
}

function buildFinalSpecsList(config, defaults, lock, ventilation) {
	if (!defaults) return [];
	return [
		{ label: 'Количество:', value: `${config.quantity ?? 10} шт.` },
		{
			label: 'Габариты:',
			value: `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`,
		},
		{ label: 'Толщина корпуса:', value: `${config.bodyThickness} мм` },
		{ label: 'Толщина двери:', value: `${config.doorThickness} мм` },
		{ label: 'Замок:', value: lock?.name ?? config.lockId },
		...(config.ventilationType ? [{ label: 'Вентиляция:', value: ventilation?.[config.ventilationType]?.name ?? config.ventilationType }] : []),
		...(config.bodyColor ? [{ label: 'Цвет корпуса:', value: config.bodyColor.name, colorHex: config.bodyColor.color }] : []),
		...(config.doorColor ? [{ label: 'Цвет двери:', value: config.doorColor.name, colorHex: config.doorColor.color }] : []),
	];
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

	const [copied, setCopied] = useState(false);

	const [isNZOpen, setIsNZOpen] = useState(false);

	function openNZModal() {
		setIsNZOpen(true);
	}

	function closeNZModal() {
		setIsNZOpen(false);
	}

	async function handleNZSubmit({ managerName, clientName }) {
		try {
			const { generateNZ } = await import('../../../pdf/generateNZ.js');
			await generateNZ({ config, catalog, managerName, clientName, price });
			setIsNZOpen(false);
		} catch (err) {
			console.error('Ошибка генерации НЗ:', err);
			alert(`Не удалось создать PDF: ${err?.message ?? err}`);
		}
	}

	function handleCopyArticle() {
		if (!model?.article) return;
		navigator.clipboard.writeText(model.article).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}

	const qty = config.quantity ?? 10;
	const totalClientPrice = price && !price.manual ? price.clientPrice * qty : null;
	const totalFactoryPrice = price && !price.manual ? price.factoryPrice * qty : null;

	const priceDisplay = !price || !config.modelId
		? '—'
		: price.manual
			? 'По согласованию'
			: `${totalClientPrice.toLocaleString('ru-RU')} ₽`;
	const modelDisplay = series && model ? `${series.name} — ${model.name}` : 'Модель не выбрана';

	return (
		<main className='layout__content'>
			<div className={styles.configurator}>
				<div className={styles.topRow}>
					<div className={styles.heading}>
						<h1 className={styles.title}>Конфигурация</h1>
						<div className={styles.model}>
							<span className={styles.modelLabel}>Текущая модель:</span>
							<span className={styles.modelValue}>{modelDisplay}</span>
						</div>
					</div>

					<button
						className={cx(styles.articleBadge, model?.article && styles.articleBadgeClickable)}
						onClick={handleCopyArticle}
						disabled={!model?.article}
						type='button'
					>
						<span className={styles.badgeLabel}>{copied ? 'Скопировано!' : 'Артикул'}</span>
						<span className={styles.badgeCode}>{model?.article ?? '—'}</span>
					</button>
				</div>

				<div className={cx(styles.configGrid, isResetting && styles.configGridLeaving)}>
					<div className={`${styles.configCol} ${styles.configColDefault}`}>
						<span className={styles.colTitle}>
							Стандартное
							<br />
							исполнение
						</span>
						{defaultSpecsList.length === 0 ? (
							<p className={styles.noChanges}>
								{!config.seriesId ? 'Выберите серию и модель' : 'Выберите модель шкафа'}
							</p>
						) : (
							<ul className={styles.specList} key={`${config.modelId}-${resetKey}`}>
								{defaultSpecsList.map(({ label, value, colorHex }, i) => (
									<li key={label} className={styles.specItem} style={{ animationDelay: `${i * 0.1}s` }}>
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
							</ul>
						)}
					</div>

					<div className={`${styles.configCol} ${styles.configColChanged}`}>
						<span className={styles.colTitle}>
							Нестандартное
							<br />
							исполнение
						</span>
						{diffItemsToRender.length === 0 ? (
							<p className={styles.noChanges}>Нет изменений</p>
						) : (
							<ul className={styles.diffList}>
								{diffItemsToRender.map(({ label, value, leaving, entering }, i) => (
									<li
										key={label}
										className={cx(styles.diffItem, leaving && styles.diffItemLeaving, entering && styles.diffItemEntering)}
										style={entering ? { animationDelay: `${i * 0.1}s` } : undefined}
									>
										<span className={styles.diffLabel}>{label}</span>
										<span className={styles.diffValue}>{value}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className={`${styles.configCol} ${styles.configColFinal}`}>
						<div className={styles.colTop}>
							<span className={styles.colTitle}>
								Итоговая
								<br />
								конфигурация
							</span>
							{model && (
								<ul className={styles.finalSpec} key={`${config.modelId}-${resetKey}`}>
									{finalSpecsList.map(({ label, value, colorHex }, i) => (
										<li key={label} className={styles.finalItem} style={{ animationDelay: `${i * 0.1}s` }}>
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
											<span className={styles.finalLabel}>Вес:</span>
											<span className={styles.finalValue}>{price.weight} кг</span>
										</li>
									)}
									{price && !price.manual && (
										<li className={styles.finalItem}>
											<span className={styles.finalLabel}>Цена за 1 шт.:</span>
											<span className={styles.finalValue}>{price.clientPrice.toLocaleString('ru-RU')} ₽</span>
										</li>
									)}
									{price && !price.manual && (
										<li className={styles.finalItem}>
											<span className={styles.finalLabel}>Завод за 1 шт.:</span>
											<span className={styles.finalValue}>{price.factoryPrice.toLocaleString('ru-RU')} ₽</span>
										</li>
									)}
									<li className={`${styles.finalItem} ${styles.finalItemPrice}`}>
										<span className={styles.finalLabel}>Итого ({qty} шт.):</span>
										<span key={priceDisplay} className={styles.finalValue}>
											{priceDisplay}
										</span>
									</li>
									{price && !price.manual && (
										<li className={styles.finalItem}>
											<span className={styles.finalLabel}>Завод итого:</span>
											<span className={styles.finalValue}>{totalFactoryPrice.toLocaleString('ru-RU')} ₽</span>
										</li>
									)}
									{price && !price.manual && price.leadTime && (
										<li className={styles.finalItem}>
											<span className={styles.finalLabel}>Срок:</span>
											<span className={styles.finalValue}>{price.leadTime}</span>
										</li>
									)}
								</ul>
							)}
						</div>

						<div className={styles.actions}>
							<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : undefined}>
								<button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!model}>
									КП для клиента
								</button>
							</div>
							<div data-tooltip={!config.seriesId ? 'Не выбрана серия шкафа' : !model ? 'Не выбрана модель шкафа' : undefined}>
								<button
									className={`${styles.btn} ${styles.btnSecondary}`}
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
