export default function Configurator() {
	return (
		<main className='layout__content'>
			<div className='configurator'>
				{/* Top row: заголовок + артикул */}
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

				{/* Preview — 3D плейсхолдер */}
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

				{/* Config grid — три колонки */}
				<div className='config-grid'>
					{/* Стандартное исполнение */}
					<div className='config-col config-col--default'>
						<span className='config-col__title'>
							Стандартное
							<br />
							исполнение
						</span>
						<ul className='spec-list'>
							<li className='spec-list__item'>
								<span className='spec-list__label'>Ширина:</span>
								<span className='spec-list__value'>400 мм</span>
							</li>
							<li className='spec-list__item'>
								<span className='spec-list__label'>Высота:</span>
								<span className='spec-list__value'>1850 мм</span>
							</li>
							<li className='spec-list__item'>
								<span className='spec-list__label'>Толщина:</span>
								<span className='spec-list__value'>0.5 мм</span>
							</li>
							<li className='spec-list__item'>
								<span className='spec-list__label'>Замок:</span>
								<span className='spec-list__value'>Ключевой</span>
							</li>
							<li className='spec-list__item'>
								<span className='spec-list__label'>Вентиляция:</span>
								<span className='spec-list__value'>Нет</span>
							</li>
							<li className='spec-list__item'>
								<span className='spec-list__label'>Цвет:</span>
								<span className='spec-list__value'>RAL 7038</span>
							</li>
						</ul>
					</div>

					{/* Нестандартное исполнение */}
					<div className='config-col config-col--changed'>
						<span className='config-col__title'>
							Нестандартное
							<br />
							исполнение
						</span>
						<ul className='diff-list'>
							<li className='diff-list__item'>
								<span className='diff-list__label'>Ширина:</span>
								<span className='diff-list__value'>450 мм</span>
							</li>
							<li className='diff-list__item'>
								<span className='diff-list__label'>Толщина:</span>
								<span className='diff-list__value'>0.6 мм</span>
							</li>
							<li className='diff-list__item'>
								<span className='diff-list__label'>Вентиляция:</span>
								<span className='diff-list__value'>Да</span>
							</li>
							<li className='diff-list__item'>
								<span className='diff-list__label'>Цвет:</span>
								<span className='diff-list__value'>5002 шагрень</span>
							</li>
						</ul>
					</div>

					{/* Итоговая конфигурация */}
					<div className='config-col config-col--final'>
						<div className='config-col__top'>
							<span className='config-col__title'>
								Итоговая
								<br />
								конфигурация
							</span>
							<ul className='final-spec'>
								<li className='final-spec__item'>
									<span className='final-spec__label'>Габариты:</span>
									<span className='final-spec__value'>450 × 1850 мм</span>
								</li>
								<li className='final-spec__item'>
									<span className='final-spec__label'>Толщина:</span>
									<span className='final-spec__value'>0.6 мм</span>
								</li>
								<li className='final-spec__item'>
									<span className='final-spec__label'>Замок:</span>
									<span className='final-spec__value'>Ключевой</span>
								</li>
								<li className='final-spec__item'>
									<span className='final-spec__label'>Вентиляция:</span>
									<span className='final-spec__value'>Да</span>
								</li>
								<li className='final-spec__item'>
									<span className='final-spec__label'>Цвет:</span>
									<span className='final-spec__value'>5002 шагрень</span>
								</li>
								<li className='final-spec__item final-spec__item--price'>
									<span className='final-spec__label'>Стоимость:</span>
									<span className='final-spec__value'>14 200 ₽</span>
								</li>
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
