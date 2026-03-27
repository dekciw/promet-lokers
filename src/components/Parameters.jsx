import { useState } from 'react';
import ColorPicker from './ColorPicker';

const SERIES_OPTIONS = ['Серия «ML»', 'Серия «SL»', 'Серия «Pro»'];

const MODEL_OPTIONS = [
	'Шкаф металлический усиленный',
	'Шкаф металлический стандартный',
	'Шкаф металлический lite',
];

const THICKNESS_OPTIONS = ['0.5', '0.6', '0.7'];

const LOCK_OPTIONS = [
	{ name: 'Ключевой (Базовый)', price: null },
	{ name: 'Замок 2', price: '+800 ₽' },
	{ name: 'Замок 3', price: '+1 200 ₽' },
	{ name: 'Замок 4', price: '+1 500 ₽' },
	{ name: 'Замок 5', price: '+2 100 ₽' },
];

export default function Parameters() {
	const [series, setSeries] = useState('');
	const [model, setModel] = useState('');
	const [thickness, setThickness] = useState('0.5');
	const [width, setWidth] = useState('450');
	const [height, setHeight] = useState('1850');
	const [lockIndex, setLockIndex] = useState(0);
	const [ventilation, setVentilation] = useState(false);
	const [bodyColor, setBodyColor] = useState(null);
	const [doorColor, setDoorColor] = useState(null);

	return (
		<aside className='parameters'>
			<h2 className='parameters__title'>Параметры</h2>

			<div className='param-group'>
				<label className='param-group__label' htmlFor='series'>
					Серия шкафа
				</label>
				<div className='select-wrap'>
					<select className='select-wrap__select' id='series' value={series} onChange={e => setSeries(e.target.value)}>
						<option value='' disabled>Выберите серию</option>
						{SERIES_OPTIONS.map(option => (
							<option key={option}>{option}</option>
						))}
					</select>
					<img className='select-wrap__arrow' src='/img/arrow-down.svg' alt='' />
				</div>
			</div>

			<div className='param-group'>
				<label className='param-group__label' htmlFor='model'>
					Модель шкафа
				</label>
				<div className='select-wrap'>
					<select className='select-wrap__select' id='model' value={model} onChange={e => setModel(e.target.value)}>
						<option value='' disabled>Выберите модель шкафа</option>
						{MODEL_OPTIONS.map(option => (
							<option key={option}>{option}</option>
						))}
					</select>
					<img className='select-wrap__arrow' src='/img/arrow-down.svg' alt='' />
				</div>
			</div>

			<div className='param-group'>
				<span className='param-group__label'>Изменение толщины металла (мм)</span>
				<div className='toggle-group'>
					{THICKNESS_OPTIONS.map(t => (
						<button
							key={t}
							className={`toggle-group__btn${thickness === t ? ' toggle-group__btn--active' : ''}`}
							onClick={() => setThickness(t)}
						>
							{t}
						</button>
					))}
				</div>
			</div>

			<div className='param-group'>
				<span className='param-group__label'>Изменение габаритов</span>
				<div className='dim-fields'>
					<div className='param-group'>
						<label className='param-group__label param-group__label--sm' htmlFor='width'>
							Ширина (мм)
						</label>
						<input
							className='param-group__input'
							type='number'
							id='width'
							value={width}
							onChange={e => setWidth(e.target.value)}
						/>
					</div>
					<div className='param-group'>
						<label className='param-group__label param-group__label--sm' htmlFor='height'>
							Высота (мм)
						</label>
						<input
							className='param-group__input'
							type='number'
							id='height'
							value={height}
							onChange={e => setHeight(e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div className='param-group'>
				<span className='param-group__label'>Выбор замка</span>
				<ul className='lock-list'>
					{LOCK_OPTIONS.map((lock, i) => (
						<li key={lock.name}>
							<button
								className={`lock-list__item${lockIndex === i ? ' lock-list__item--active' : ''}`}
								onClick={() => setLockIndex(i)}
							>
								<span className='lock-list__name'>{lock.name}</span>
								{lock.price && <span className='lock-list__price'>{lock.price}</span>}
							</button>
						</li>
					))}
				</ul>
			</div>

			<div className='param-group'>
				<span className='param-group__label'>Дополнительная вентиляция шкафа</span>
				<div className='vent-toggle'>
					<button
						className={`vent-toggle__btn${ventilation ? ' vent-toggle__btn--active' : ''}`}
						onClick={() => setVentilation(true)}
					>
						Да
					</button>
					<button
						className={`vent-toggle__btn${!ventilation ? ' vent-toggle__btn--active' : ''}`}
						onClick={() => setVentilation(false)}
					>
						Нет
					</button>
				</div>
			</div>

			<div className='param-group'>
				<span className='param-group__label'>Изменение цвета корпуса</span>
				<ColorPicker placeholder='Выберите цвет корпуса' selected={bodyColor} onSelect={setBodyColor} />
			</div>

			<div className='param-group'>
				<span className='param-group__label'>Изменение цвета двери</span>
				<ColorPicker placeholder='Выберите цвет двери' selected={doorColor} onSelect={setDoorColor} />
			</div>
		</aside>
	);
}
