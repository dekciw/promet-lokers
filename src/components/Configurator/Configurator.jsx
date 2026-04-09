import { useState, useLayoutEffect, useRef } from 'react';
import { calcDiff } from '../../utils/calcDiff';
import { getColorHex } from '../../utils/colors';
import styles from './Configurator.module.css';

function buildCurrentForDiff(config, lock) {
	// width/height/depth → Number, чтобы '400' !== 400 не давало ложный диф
	return {
		width: config.width !== '' ? Number(config.width) : undefined,
		height: config.height !== '' ? Number(config.height) : undefined,
		depth: config.depth !== '' ? Number(config.depth) : undefined,
		bodyThickness: config.bodyThickness,
		doorThickness: config.doorThickness,
		lockName: lock?.name,
		ventilation: config.ventilation,
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
		{ label: 'Вентиляция:', value: defaults.ventilation ? 'Да' : 'Нет' },
		{ label: 'Цвет корпуса:', value: defaults.bodyColorName, colorHex: getColorHex(defaults.bodyColorName) },
		{ label: 'Цвет двери:', value: defaults.doorColorName, colorHex: getColorHex(defaults.doorColorName) },
	];
}

function buildFinalSpecsList(config, defaults, lock) {
	if (!defaults) return [];
	return [
		{
			label: 'Габариты:',
			value: `${config.width || defaults.width} × ${config.height || defaults.height} × ${config.depth || defaults.depth} мм`,
		},
		{ label: 'Толщина корпуса:', value: `${config.bodyThickness} мм` },
		{ label: 'Толщина двери:', value: `${config.doorThickness} мм` },
		{ label: 'Замок:', value: lock?.name ?? config.lockId },
		{ label: 'Вентиляция:', value: config.ventilation ? 'Да' : 'Нет' },
		...(config.bodyColor ? [{ label: 'Цвет корпуса:', value: config.bodyColor.name }] : []),
		...(config.doorColor ? [{ label: 'Цвет двери:', value: config.doorColor.name }] : []),
	];
}

export default function Configurator({ config, price, catalog, isResetting, resetKey }) {
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const series = model ? catalog.series.find(s => s.id === model.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const defaultsForDiff = defaults ? { ...defaults, lockName: catalog.locks[defaults.lockId]?.name } : null;
	const changedSpecs = calcDiff(buildCurrentForDiff(config, lock), defaultsForDiff);
	const defaultSpecsList = buildDefaultSpecsList(defaults, catalog);
	const finalSpecsList = buildFinalSpecsList(config, defaults, lock);

	// Отслеживаем элементы которые уходят из нестандартного заказа — держим их в DOM пока анимация не закончится
	// Каждый элемент хранит modelId — чтобы при смене модели старые не появлялись в новой карточке
	const [leavingItems, setLeavingItems] = useState([]);
	const prevSpecsRef = useRef([]);
	const prevModelIdRef = useRef(config.modelId);

	useLayoutEffect(() => {
		// При смене модели — обновляем ref и выходим без setState
		// Старые leaving-элементы отфильтруются в рендере по modelId
		if (prevModelIdRef.current !== config.modelId) {
			prevModelIdRef.current = config.modelId;
			prevSpecsRef.current = changedSpecs;
			return;
		}

		const prev = prevSpecsRef.current;
		const removed = prev.filter(p => !changedSpecs.some(c => c.label === p.label));
		prevSpecsRef.current = changedSpecs;

		if (removed.length === 0) return;

		const withModel = removed.map(r => ({ ...r, modelId: config.modelId }));

		setLeavingItems(curr => [...curr.filter(c => !removed.some(r => r.label === c.label)), ...withModel]);

		const timer = setTimeout(() => {
			setLeavingItems(curr => curr.filter(c => !removed.some(r => r.label === c.label)));
		}, 400);

		return () => clearTimeout(timer);
	}, [changedSpecs, config.modelId]);

	// Для рендера: текущие + уходящие только текущей модели (старые отфильтровываются автоматически)
	const diffItemsToRender = [
		...changedSpecs.map(item => ({ ...item, leaving: false })),
		...leavingItems
			.filter(l => l.modelId === config.modelId && !changedSpecs.some(c => c.label === l.label))
			.map(item => ({ ...item, leaving: true })),
	];

	const priceDisplay = price !== null ? `${price.toLocaleString('ru-RU')} ₽` : '—';
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

					<div className={styles.articleBadge}>
						<span className={styles.badgeLabel}>Артикул</span>
						<span className={styles.badgeCode}>{model?.article ?? '—'}</span>
					</div>
				</div>

				{/* 3D Предпросмотр — скрыт до реализации (Фаза 3) */}

				<div className={`${styles.configGrid}${isResetting ? ` ${styles.configGridLeaving}` : ''}`}>
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
								{defaultSpecsList.map(({ label, value, colorHex }) => (
									<li key={label} className={styles.specItem}>
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
								{diffItemsToRender.map(({ label, value, leaving }) => (
									<li key={label} className={`${styles.diffItem}${leaving ? ` ${styles.diffItemLeaving}` : ''}`}>
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
							<ul className={styles.finalSpec} key={`${config.modelId}-${resetKey}`}>
								{finalSpecsList.map(({ label, value }) => (
									<li key={label} className={styles.finalItem}>
										<span className={styles.finalLabel}>{label}</span>
										<span className={styles.finalValue}>{value}</span>
									</li>
								))}
								<li className={`${styles.finalItem} ${styles.finalItemPrice}`}>
									<span className={styles.finalLabel}>Стоимость:</span>
									<span key={priceDisplay} className={styles.finalValue}>
										{priceDisplay}
									</span>
								</li>
							</ul>
						</div>

						<div className={styles.actions}>
							<div data-tooltip={!config.seriesId ? 'Выберите серию шкафа' : !model ? 'Выберите модель шкафа' : undefined}>
								<button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!model}>
									КП для клиента
								</button>
							</div>
							<div data-tooltip={!config.seriesId ? 'Выберите серию шкафа' : !model ? 'Выберите модель шкафа' : undefined}>
								<button className={`${styles.btn} ${styles.btnSecondary}`} disabled={!model}>
									Бланк НЗ
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
