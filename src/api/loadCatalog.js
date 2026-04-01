const SHEET_URL =
  'https://opensheet.elk.sh/1KA88nZDnMX00kQ0RglYgan24Zl8LJV6lei5NM9X3auc/Promet';

const SERIES_MAP = {
  'ML':       { id: 'ml', name: 'Серия «ML»' },
  'LS-серия': { id: 'ls', name: 'Серия «LS»' },
};

function parsePrice(str) {
  return Number(String(str).replace(/\s/g, '').replace(',', '.')) || 0;
}

function parseThickness(str) {
  return String(str).replace(',', '.').trim();
}

export async function loadCatalog() {
  const res = await fetch(SHEET_URL);
  const rows = await res.json();

  const seriesMap = new Map();
  const models = {};

  rows.forEach(row => {
    const series = SERIES_MAP[row['Серия шкафа']];
    if (!series) return;

    if (!seriesMap.has(series.id)) seriesMap.set(series.id, series);

    const id = String(row['ID']);
    const bodyThickness = parseThickness(row['Толщина металла \nКорпуса шкафа']);
    const doorThickness = parseThickness(row['Толщина металла Двери \nШкафа']);

    models[id] = {
      name: row['Наименование шкафа'],
      seriesId: series.id,
      basePrice: parsePrice(row['Цена шкафа']),
      article: row['Артикул'],
      defaultSpecs: {
        width: Number(row['Ширина']),
        height: Number(row['Высота']),
        depth: Number(row['Глубина']),
        bodyThickness,
        doorThickness,
        thickness: bodyThickness,
        lockId: 'key_basic',
        ventilation: false,
        bodyColorName: 'RAL 7038',
        doorColorName: 'RAL 7038',
      },
    };
  });

  return {
    series: Array.from(seriesMap.values()),
    models,
    locks: {
      'key_basic': { name: 'Ключевой (Базовый)', surcharge: 0 },
      'lock_2':    { name: 'Замок навесной',     surcharge: 800 },
      'lock_3':    { name: 'Замок кодовый',      surcharge: 1200 },
      'lock_4':    { name: 'Замок сувальдный',   surcharge: 1500 },
      'lock_5':    { name: 'Замок электронный',  surcharge: 2100 },
    },
    thicknessSurcharges: { '0.6': 800, '0.7': 1500 },
    ventSurcharge: 500,
  };
}
