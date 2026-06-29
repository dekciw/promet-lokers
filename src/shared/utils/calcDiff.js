const VENT_FALLBACK = {
  roof: 'Крыша',
  roofBottom: 'Крыша + дно',
  roofBottomPipe: 'Крыша + дно + труба',
};

function buildSpecFields(ventilationCatalog) {
  return [
    { key: 'doorColorName', label: 'Цвет двери:',      format: v => v },
    { key: 'bodyColorName', label: 'Цвет корпуса:', format: v => v },
    { key: 'lockName',        label: 'Замок:',      format: v => v },
    { key: 'width',         label: 'Ширина:',          format: v => `${v} мм` },
    { key: 'height',        label: 'Высота:',          format: v => `${v} мм` },
    { key: 'depth',         label: 'Глубина:',         format: v => `${v} мм` },
    { key: 'bodyThickness', label: 'Толщина корпуса:', format: v => `${v} мм` },
    { key: 'doorThickness', label: 'Толщина двери:',   format: v => `${v} мм` },
    { key: 'ventilationType', label: 'Вентиляция:', format: v => {
      if (ventilationCatalog) return ventilationCatalog[v]?.name ?? VENT_FALLBACK[v] ?? v;
      return VENT_FALLBACK[v] ?? v;
    }},
  ];
}

export function calcDiff(current, defaults, ventilationCatalog) {
  if (!defaults) return [];

  const specFields = buildSpecFields(ventilationCatalog);
  return specFields.reduce((acc, field) => {
    const currentVal = current[field.key];
    const defaultVal = defaults[field.key];

    if (currentVal !== undefined && currentVal !== null && String(currentVal) !== String(defaultVal)) {
      acc.push({ label: field.label, value: field.format(currentVal), key: field.key });
    }
    return acc;
  }, []);
}
