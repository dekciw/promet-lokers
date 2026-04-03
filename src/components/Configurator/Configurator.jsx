import { useState, useLayoutEffect, useRef } from 'react';
import { calcDiff } from '../../utils/calcDiff';
import './Configurator.css';

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
		{ label: 'Цвет корпуса:', value: defaults.bodyColorName },
		{ label: 'Цвет двери:', value: defaults.doorColorName },
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

export default function Configurator({ config, price, catalog }) {
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const series = model ? catalog.series.find(s => s.id === model.seriesId) : null;
	const lock = catalog.locks[config.lockId];
	const defaults = model?.defaultSpecs ?? null;

	const defaultsForDiff = defaults
		? { ...defaults, lockName: catalog.locks[defaults.lockId]?.name }
		: null;
	const changedSpecs = calcDiff(buildCurrentForDiff(config, lock), defaultsForDiff);
	const defaultSpecsList = buildDefaultSpecsList(defaults, catalog);
	const finalSpecsList = buildFinalSpecsList(config, defaults, lock);

	// Отслеживаем элементы которые уходят из нестандартного заказа — держим их в DOM пока анимация не закончится
	const [leavingItems, setLeavingItems] = useState([]);
	const prevSpecsRef = useRef([]);

	useLayoutEffect(() => {
		const prev = prevSpecsRef.current;
		const removed = prev.filter(p => !changedSpecs.some(c => c.label === p.label));
		prevSpecsRef.current = changedSpecs;

		if (removed.length === 0) return;

		setLeavingItems(curr => [
			...curr.filter(c => !removed.some(r => r.label === c.label)),
			...removed,
		]);

		const timer = setTimeout(() => {
			setLeavingItems(curr => curr.filter(c => !removed.some(r => r.label === c.label)));
		}, 400);

		return () => clearTimeout(timer);
	}, [changedSpecs]);

	// Для рендера: текущие + уходящие (уходящие помечены флагом)
	const diffItemsToRender = [
		...changedSpecs.map(item => ({ ...item, leaving: false })),
		...leavingItems
			.filter(l => !changedSpecs.some(c => c.label === l.label))
			.map(item => ({ ...item, leaving: true })),
	];

	const priceDisplay = price !== null ? `${price.toLocaleString('ru-RU')} ₽` : '—';
	const modelDisplay = series && model ? `${series.name} — ${model.name}` : 'Модель не выбрана';

	return (
		<main className='layout__content'>
			<div className='configurator'>
				<div className='top-row'>
					<div className='heading'>
						<h1 className='title'>Конфигурация</h1>
						<div className='model'>
							<span className='model-label'>Текущая модель:</span>
							<span className='model-value'>{modelDisplay}</span>
						</div>
					</div>

					<div className='article-badge'>
						<span className='badge-label'>Артикул</span>
						<span className='badge-code'>{model?.article ?? '—'}</span>
					</div>
				</div>

				{/* 3D Предпросмотр — скрыт до реализации (Фаза 3) */}

				<div className='config-grid'>
					<div className='config-col config-col--default'>
						<span className='col-title'>
							Стандартное
							<br />
							исполнение
						</span>
						{defaultSpecsList.length === 0 ? (
							<p className='no-changes'>Выберите модель</p>
						) : (
							<ul className='spec-list'>
								{defaultSpecsList.map(({ label, value }) => (
									<li key={label} className='spec-item'>
										<span className='spec-label'>{label}</span>
										<span className='spec-value'>{value}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className='config-col config-col--changed'>
						<span className='col-title'>
							Нестандартное
							<br />
							исполнение
						</span>
						{diffItemsToRender.length === 0 ? (
							<p className='no-changes'>Нет изменений</p>
						) : (
							<ul className='diff-list'>
								{diffItemsToRender.map(({ label, value, leaving }) => (
									<li
										key={label}
										className={`diff-item${leaving ? ' diff-item--leaving' : ''}`}
									>
										<span className='diff-label'>{label}</span>
										<span className='diff-value'>{value}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className='config-col config-col--final'>
						<div className='col-top'>
							<span className='col-title'>
								Итоговая
								<br />
								конфигурация
							</span>
							<ul className='final-spec'>
								{finalSpecsList.map(({ label, value }) => (
									<li key={label} className='final-item'>
										<span className='final-label'>{label}</span>
										<span className='final-value'>{value}</span>
									</li>
								))}
								<li className='final-item final-item--price'>
									<span className='final-label'>Стоимость:</span>
									<span className='final-value'>{priceDisplay}</span>
								</li>
							</ul>
						</div>

						<div className='actions'>
							<button className='btn btn--primary' disabled={!model}>
								КП для клиента
							</button>
							<button className='btn btn--secondary' disabled={!model}>
								Бланк НЗ
							</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
