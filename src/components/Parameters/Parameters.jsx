import ColorPicker from '../ColorPicker/ColorPicker';
import './Parameters.css';

const THICKNESS_OPTIONS = ['0.5', '0.6', '0.7'];

export default function Parameters({
  config,
  catalog,
  setSeriesId,
  onModelChange,
  setThickness,
  setWidth,
  setHeight,
  setLockId,
  setVentilation,
  setBodyColor,
  setDoorColor,
}) {
  const { seriesId, modelId, thickness, width, height, lockId, ventilation, bodyColor, doorColor } =
    config;

  const modelEntries = Object.entries(catalog.models).filter(
    ([, m]) => !seriesId || m.seriesId === seriesId
  );

  const lockEntries = Object.entries(catalog.locks);

  return (
    <aside className='parameters'>
      <h2 className='title'>Параметры</h2>

      <div className='param-group'>
        <label className='group-label' htmlFor='series'>
          Серия шкафа
        </label>
        <div className='select-wrap'>
          <select
            className='select'
            id='series'
            value={seriesId}
            onChange={e => setSeriesId(e.target.value)}
          >
            <option value=''>Выберите серию</option>
            {catalog.series.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <img className='arrow' src='/img/arrow-down.svg' alt='' />
        </div>
      </div>

      <div className='param-group'>
        <label className='group-label' htmlFor='model'>
          Модель шкафа
        </label>
        <div className='select-wrap'>
          <select
            className='select'
            id='model'
            value={modelId}
            onChange={e => onModelChange(e.target.value)}
          >
            <option value=''>Выберите модель шкафа</option>
            {modelEntries.map(([id, m]) => (
              <option key={id} value={id}>
                {m.name}
              </option>
            ))}
          </select>
          <img className='arrow' src='/img/arrow-down.svg' alt='' />
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение толщины металла (мм)</span>
        <div className='toggle-group'>
          {THICKNESS_OPTIONS.map(t => (
            <button
              key={t}
              className={`toggle-btn${thickness === t ? ' toggle-btn--active' : ''}`}
              onClick={() => setThickness(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение габаритов</span>
        <div className='dim-fields'>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='width'>
              Ширина (мм)
            </label>
            <input
              className='group-input'
              type='number'
              id='width'
              value={width}
              onChange={e => setWidth(e.target.value)}
            />
          </div>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='height'>
              Высота (мм)
            </label>
            <input
              className='group-input'
              type='number'
              id='height'
              value={height}
              onChange={e => setHeight(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Выбор замка</span>
        <ul className='lock-list'>
          {lockEntries.map(([id, lock]) => (
            <li key={id}>
              <button
                className={`lock-item${lockId === id ? ' lock-item--active' : ''}`}
                onClick={() => setLockId(id)}
              >
                <span className='lock-name'>{lock.name}</span>
                {lock.surcharge > 0 && (
                  <span className='lock-price'>+{lock.surcharge.toLocaleString('ru-RU')} ₽</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className='param-group'>
        <span className='group-label'>Дополнительная вентиляция шкафа</span>
        <div className='vent-toggle'>
          <button
            className={`vent-btn${ventilation ? ' vent-btn--active' : ''}`}
            onClick={() => setVentilation(true)}
          >
            Да
          </button>
          <button
            className={`vent-btn${!ventilation ? ' vent-btn--active' : ''}`}
            onClick={() => setVentilation(false)}
          >
            Нет
          </button>
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета корпуса</span>
        <ColorPicker
          placeholder='Выберите цвет корпуса'
          selected={bodyColor}
          onSelect={setBodyColor}
        />
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета двери</span>
        <ColorPicker
          placeholder='Выберите цвет двери'
          selected={doorColor}
          onSelect={setDoorColor}
        />
      </div>
    </aside>
  );
}
