import './Configurator.css';

const DEFAULT_SPECS = [
	{ label: 'Ширина:', value: '400 мм' },
	{ label: 'Высота:', value: '1850 мм' },
	{ label: 'Толщина:', value: '0.5 мм' },
	{ label: 'Замок:', value: 'Ключевой' },
	{ label: 'Вентиляция:', value: 'Нет' },
	{ label: 'Цвет:', value: 'RAL 7038' },
];

const CHANGED_SPECS = [
	{ label: 'Ширина:', value: '450 мм' },
	{ label: 'Толщина:', value: '0.6 мм' },
	{ label: 'Вентиляция:', value: 'Да' },
	{ label: 'Цвет:', value: '5002 шагрень' },
];

const FINAL_SPECS = [
	{ label: 'Габариты:', value: '450 × 1850 мм' },
	{ label: 'Толщина:', value: '0.6 мм' },
	{ label: 'Замок:', value: 'Ключевой' },
	{ label: 'Вентиляция:', value: 'Да' },
	{ label: 'Цвет:', value: '5002 шагрень' },
	{ label: 'Стоимость:', value: '14 200 ₽', modifier: 'price' },
];

export default function Configurator() {
	return (
		<main className='layout__content'>
			<div className='configurator'>
				<div className='top-row'>
					<div className='heading'>
						<h1 className='title'>Конфигурация</h1>
						<div className='model'>
							<span className='model-label'>Текущая модель:</span>
							<span className='model-value'>Серия «ML» + Шкаф металлический усиленный</span>
						</div>
					</div>

					<div className='article-badge'>
						<span className='badge-label'>Артикул</span>
						<span className='badge-code'>SAFE-IND-2024-XP-450</span>
					</div>
				</div>

				{/* 3D Предпросмотр модели — скрыт до реализации 3D
				<div className='preview'>
					<div className='preview-gradient'></div>

					<div className='preview-controls'>
						<button className='preview-btn' title='Увеличить'>
							<img src='/img/zoom.svg' alt='Увеличить' />
						</button>
						<button className='preview-btn' title='Обновить'>
							<img src='/img/refresh.svg' alt='Обновить' />
						</button>
					</div>

					<div className='preview-body'>
						<div className='locker-cabinet'>
							<div className='locker-handle'></div>
							<div className='locker-shelf'>
								<div className='locker-line'></div>
								<div className='locker-line'></div>
							</div>
						</div>
						<span className='preview-caption'>3D Предпросмотр модели</span>
					</div>
				</div>
				*/}

				<div className='config-grid'>
					<div className='config-col config-col--default'>
						<span className='col-title'>
							Стандартное
							<br />
							исполнение
						</span>
						<ul className='spec-list'>
							{DEFAULT_SPECS.map(({ label, value }) => (
								<li key={label} className='spec-item'>
									<span className='spec-label'>{label}</span>
									<span className='spec-value'>{value}</span>
								</li>
							))}
						</ul>
					</div>

					<div className='config-col config-col--changed'>
						<span className='col-title'>
							Нестандартное
							<br />
							исполнение
						</span>
						<ul className='diff-list'>
							{CHANGED_SPECS.map(({ label, value }) => (
								<li key={label} className='diff-item'>
									<span className='diff-label'>{label}</span>
									<span className='diff-value'>{value}</span>
								</li>
							))}
						</ul>
					</div>

					<div className='config-col config-col--final'>
						<div className='col-top'>
							<span className='col-title'>
								Итоговая
								<br />
								конфигурация
							</span>
							<ul className='final-spec'>
								{FINAL_SPECS.map(({ label, value, modifier }) => (
									<li key={label} className={`final-item${modifier ? ` final-item--${modifier}` : ''}`}>
										<span className='final-label'>{label}</span>
										<span className='final-value'>{value}</span>
									</li>
								))}
							</ul>
						</div>

						<div className='actions'>
							<button className='btn btn--primary'>КП для клиента</button>
							<button className='btn btn--secondary'>Бланк НЗ</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
