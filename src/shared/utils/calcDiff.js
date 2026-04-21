const SPEC_FIELDS = [
  { key: 'width',         label: 'Ширина:',          format: v => `${v} мм` },
  { key: 'height',        label: 'Высота:',          format: v => `${v} мм` },
  { key: 'depth',         label: 'Глубина:',         format: v => `${v} мм` },
  { key: 'bodyThickness', label: 'Толщина корпуса:', format: v => `${v} мм` },
  { key: 'doorThickness', label: 'Толщина двери:',   format: v => `${v} мм` },
  { key: 'lockName',        label: 'Замок:',      format: v => v },
  { key: 'ventilationType', label: 'Вентиляция:', format: v => {
    if (v === 'roof') return 'Крыша';
    if (v === 'roofBottom') return 'Крыша + дно';
    if (v === 'roofBottomPipe') return 'Крыша + дно + труба';
    return 'Нет';
  }},
  { key: 'bodyColorName', label: 'Цвет корпуса:', format: v => v },
  { key: 'doorColorName', label: 'Цвет двери:',      format: v => v },
];

export function calcDiff(current, defaults) {
  if (!defaults) return [];

  return SPEC_FIELDS.reduce((acc, field) => {
    const currentVal = current[field.key];
    const defaultVal = defaults[field.key];

    if (currentVal !== undefined && currentVal !== null && String(currentVal) !== String(defaultVal)) {
      acc.push({ label: field.label, value: field.format(currentVal) });
    }
    return acc;
  }, []);
}
