const DEFAULT_SPECS = {
  depth: 500,
  thickness: '0.5',
  bodyThickness: '0.5',
  doorThickness: '0.5',
  lockId: 'key_basic',
  ventilation: false,
  bodyColorName: 'RAL 7038',
  doorColorName: 'RAL 7038',
};

export const STUB_CATALOG = {
  series: [
    { id: 'ml', name: 'Серия «ML»' },
    { id: 'sl', name: 'Серия «SL»' },
  ],

  models: {
    'ml-usi': {
      name: 'Шкаф металлический усиленный',
      seriesId: 'ml',
      basePrice: 12000,
      article: 'SHL-ML-USI',
      defaultSpecs: { width: 400, height: 1850, ...DEFAULT_SPECS },
    },
    'ml-std': {
      name: 'Шкаф металлический стандартный',
      seriesId: 'ml',
      basePrice: 9500,
      article: 'SHL-ML-STD',
      defaultSpecs: { width: 400, height: 1800, ...DEFAULT_SPECS },
    },
    'sl-lite': {
      name: 'Шкаф металлический lite',
      seriesId: 'sl',
      basePrice: 7200,
      article: 'SHL-SL-LITE',
      defaultSpecs: { width: 300, height: 1800, ...DEFAULT_SPECS },
    },
  },

  locks: {
    'key_basic': { name: 'Ключевой (Базовый)', surcharge: 0 },
    'lock_2':    { name: 'Замок навесной', surcharge: 800 },
    'lock_3':    { name: 'Замок кодовый', surcharge: 1200 },
    'lock_4':    { name: 'Замок сувальдный', surcharge: 1500 },
    'lock_5':    { name: 'Замок электронный', surcharge: 2100 },
  },

  thicknessSurcharges: {
    '0.6': 800,
    '0.7': 1500,
  },

  ventSurcharge: 500,
};
