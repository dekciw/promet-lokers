const VENT_LABELS = {
  roof: 'Крыша',
  roofBottom: 'Крыша + дно',
  roofBottomPipe: 'Крыша + дно + труба',
};

function fmtVentilation(type) {
  if (!type) return 'Нет';
  return VENT_LABELS[type] ?? 'Нет';
}

/**
 * Возвращает плоский массив параметров конфигуратора для строки 6 НЗ.
 * Покрывает все 11 параметров (стандартные и нестандартные).
 * isNonStandard=true когда значение отличается от model.defaultSpecs.
 *
 * @param {object} config — текущая конфигурация
 * @param {object} catalog — каталог из Firebase
 * @returns {Array<{label: string, value: string, isNonStandard: boolean}>}
 */
export function buildNonStandardOrderParams(config, catalog) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  if (!model) return [];

  const defaults = model.defaultSpecs ?? {};
  const series = (catalog.series ?? []).find(s => s.id === model.seriesId);
  const lock = catalog.locks?.[config.lockId];

  const widthVal = config.width !== '' && config.width != null ? Number(config.width) : defaults.width;
  const heightVal = config.height !== '' && config.height != null ? Number(config.height) : defaults.height;
  const depthVal = config.depth !== '' && config.depth != null ? Number(config.depth) : defaults.depth;

  return [
    {
      label: 'Серия',
      value: series?.name ?? '—',
      isNonStandard: false,
    },
    {
      label: 'Модель',
      value: model.name ?? '—',
      isNonStandard: false,
    },
    {
      label: 'Ширина',
      value: `${widthVal} мм`,
      isNonStandard: defaults.width != null && widthVal !== Number(defaults.width),
    },
    {
      label: 'Высота',
      value: `${heightVal} мм`,
      isNonStandard: defaults.height != null && heightVal !== Number(defaults.height),
    },
    {
      label: 'Глубина',
      value: `${depthVal} мм`,
      isNonStandard: defaults.depth != null && depthVal !== Number(defaults.depth),
    },
    {
      label: 'Толщина корпуса',
      value: `${config.bodyThickness} мм`,
      isNonStandard: defaults.bodyThickness != null && config.bodyThickness !== defaults.bodyThickness,
    },
    {
      label: 'Толщина двери',
      value: `${config.doorThickness} мм`,
      isNonStandard: defaults.doorThickness != null && config.doorThickness !== defaults.doorThickness,
    },
    {
      label: 'Замок',
      value: lock?.name ?? '—',
      isNonStandard: !!config.lockId && config.lockId !== 'key_basic',
    },
    {
      label: 'Вентиляция',
      value: fmtVentilation(config.ventilationType),
      isNonStandard: !!config.ventilationType,
    },
    {
      label: 'Цвет корпуса',
      value: config.bodyColor?.name ?? 'стандартный',
      isNonStandard: !!config.bodyColor,
    },
    {
      label: 'Цвет двери',
      value: config.doorColor?.name ?? 'стандартный',
      isNonStandard: !!config.doorColor,
    },
  ];
}
