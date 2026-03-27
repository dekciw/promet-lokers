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
				<div className='configurator__top-row'>
					<div className='configurator__heading'>
						<h1 className='configurator__title'>Конфигурация</h1>
						<div className='configurator__model'>
							<span className='configurator__model-label'>Текущая модель:</span>
							<span className='configurator__model-value'>Серия «ML» + Шкаф металлический усиленный</span>
						</div>
					</div>

					<div className='article-badge'>
						<span className='article-badge__label'>Артикул</span>
						<span className='article-badge__code'>SAFE-IND-2024-XP-450</span>
					</div>
				</div>

				{/* 3D Предпросмотр модели — скрыт до реализации 3D
				<div className='preview'>
					<div className='preview__gradient'></div>

					<div className='preview__controls'>
						<button className='preview__btn' title='Увеличить'>
							<img src='/img/zoom.svg' alt='Увеличить' />
						</button>
						<button className='preview__btn' title='Обновить'>
							<img src='/img/refresh.svg' alt='Обновить' />
						</button>
					</div>

					<div className='preview__body'>
						<div className='locker__cabinet'>
							<div className='locker__handle'></div>
							<div className='locker__shelf'>
								<div className='locker__line'></div>
								<div className='locker__line'></div>
							</div>
						</div>
						<span className='preview__caption'>3D Предпросмотр модели</span>
					</div>
				</div>
				*/}

				<div className='config-grid'>
					<div className='config-col config-col--default'>
						<span className='config-col__title'>
							Стандартное
							<br />
							исполнение
						</span>
						<ul className='spec-list'>
							{DEFAULT_SPECS.map(({ label, value }) => (
								<li key={label} className='spec-list__item'>
									<span className='spec-list__label'>{label}</span>
									<span className='spec-list__value'>{value}</span>
								</li>
							))}
						</ul>
					</div>

					<div className='config-col config-col--changed'>
						<span className='config-col__title'>
							Нестандартное
							<br />
							исполнение
						</span>
						<ul className='diff-list'>
							{CHANGED_SPECS.map(({ label, value }) => (
								<li key={label} className='diff-list__item'>
									<span className='diff-list__label'>{label}</span>
									<span className='diff-list__value'>{value}</span>
								</li>
							))}
						</ul>
					</div>

					<div className='config-col config-col--final'>
						<div className='config-col__top'>
							<span className='config-col__title'>
								Итоговая
								<br />
								конфигурация
							</span>
							<ul className='final-spec'>
								{FINAL_SPECS.map(({ label, value, modifier }) => (
									<li
										key={label}
										className={`final-spec__item${modifier ? ` final-spec__item--${modifier}` : ''}`}
									>
										<span className='final-spec__label'>{label}</span>
										<span className='final-spec__value'>{value}</span>
									</li>
								))}
							</ul>
						</div>

						<div className='config-col__actions'>
							<button className='btn btn--primary'>КП для клиента</button>
							<button className='btn btn--secondary'>Бланк НЗ</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
