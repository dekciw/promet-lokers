import { calcDiff } from '../../utils/calcDiff';
import './Configurator.css';

export default function Configurator({ config, price, catalog }) {
	const model = config.modelId ? catalog.models[config.modelId] : null;
	const series = model ? catalog.series.find(s => s.id === model.seriesId) : null;
	const lock = catalog.locks[config.lockId];

	// Человекочитаемый объект для calcDiff
	// width/height приводим к Number, чтобы избежать ложных дифов '400' !== 400
	const currentForDiff = {
		width: config.width !== '' ? Number(config.width) : undefined,
		height: config.height !== '' ? Number(config.height) : undefined,
		thickness: config.thickness,
		lockName: lock?.name,
		ventilation: config.ventilation,
		bodyColorName: config.bodyColor?.name ?? undefined,
		doorColorName: config.doorColor?.name ?? undefined,
	};

	const defaults = model?.defaultSpecs ?? null;
	const changedSpecs = calcDiff(currentForDiff, defaults);

	// Левая колонка: стандартные характеристики модели
	const defaultSpecsList = defaults
		? [
				{ label: 'Ширина:', value: `${defaults.width} мм` },
				{ label: 'Высота:', value: `${defaults.height} мм` },
				{ label: 'Толщина:', value: `${defaults.thickness} мм` },
				{ label: 'Замок:', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
				{ label: 'Вентиляция:', value: defaults.ventilation ? 'Да' : 'Нет' },
				{ label: 'Цвет корпуса:', value: defaults.bodyColorName },
				{ label: 'Цвет двери:', value: defaults.doorColorName },
			]
		: [];

	// Правая колонка: текущая конфигурация пользователя
	const finalSpecsList = model
		? [
				{
					label: 'Габариты:',
					value: `${config.width || defaults.width} × ${config.height || defaults.height} мм`,
				},
				{ label: 'Толщина:', value: `${config.thickness} мм` },
				{ label: 'Замок:', value: lock?.name ?? config.lockId },
				{ label: 'Вентиляция:', value: config.ventilation ? 'Да' : 'Нет' },
				...(config.bodyColor ? [{ label: 'Цвет корпуса:', value: config.bodyColor.name }] : []),
				...(config.doorColor ? [{ label: 'Цвет двери:', value: config.doorColor.name }] : []),
			]
		: [];

	const priceDisplay = price !== null ? `${price.toLocaleString('ru-RU')} ₽` : '—';
	const modelDisplay = series && model ? `${series.name} — ${model.name}` : 'Модель не выбрана';
	const articleDisplay = model?.article ?? '—';

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
						<span className='badge-code'>{articleDisplay}</span>
					</div>
				</div>

				{/* 3D Предпросмотр модели — скрыт до реализации 3D
				<div className='preview'>
					...
				</div>
				*/}

				<div className='config-grid'>
					{/* Левая: стандартное исполнение */}
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

					{/* Средняя: только изменённые параметры */}
					<div className='config-col config-col--changed'>
						<span className='col-title'>
							Нестандартное
							<br />
							исполнение
						</span>
						{changedSpecs.length === 0 ? (
							<p className='no-changes'>Нет изменений</p>
						) : (
							<ul className='diff-list'>
								{changedSpecs.map(({ label, value }) => (
									<li key={label} className='diff-item'>
										<span className='diff-label'>{label}</span>
										<span className='diff-value'>{value}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Правая: итоговая конфигурация + цена + кнопки */}
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
