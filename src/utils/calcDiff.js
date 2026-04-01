const SPEC_FIELDS = [
  { key: 'width',         label: 'Ширина:',          format: v => `${v} мм` },
  { key: 'height',        label: 'Высота:',          format: v => `${v} мм` },
  { key: 'thickness',     label: 'Толщина металла:',  format: v => `${v} мм` },
  { key: 'bodyThickness', label: 'Толщина корпуса:',  format: v => `${v} мм` },
  { key: 'doorThickness', label: 'Толщина двери:',    format: v => `${v} мм` },
  { key: 'depth',         label: 'Глубина:',          format: v => `${v} мм` },
  { key: 'lockName',      label: 'Замок:',            format: v => v },
  { key: 'ventilation',   label: 'Вентиляция:',       format: v => (v ? 'Да' : 'Нет') },
  { key: 'bodyColorName', label: 'Цвет корпуса:',     format: v => v },
  { key: 'doorColorName', label: 'Цвет двери:',       format: v => v },
];

/**
 * Возвращает массив изменённых параметров для колонки «Нестандартное исполнение».
 * @param {object} current  - текущие значения конфигурации (human-readable)
 * @param {object} defaults - model.defaultSpecs из STUB_CATALOG
 * @returns {{ label: string, value: string }[]}
 */
export function calcDiff(current, defaults) {
  if (!defaults) return [];

  return SPEC_FIELDS.reduce((acc, field) => {
    const currentVal = current[field.key];
    const defaultVal = defaults[field.key];

    const isDifferent = String(currentVal) !== String(defaultVal);

    if (isDifferent && currentVal !== undefined && currentVal !== null) {
      acc.push({ label: field.label, value: field.format(currentVal) });
    }
    return acc;
  }, []);
}
