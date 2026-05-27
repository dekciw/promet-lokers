// Коэффициенты прибавки к весу относительно базового веса из таблицы
const WEIGHT_MULT = {
  '0.5': 1.125,        // +12.5%
  '0.6': 1 + 1 / 3,   // +33.33%
  '0.7': 1 + 5 / 9,   // +55.56%
};

function getVentRate(ventilationType, qty, priceRules) {
  const rule = priceRules.ventilation?.[ventilationType];
  if (!rule) return null;
  if (qty >= 100) return rule.qty100;
  if (qty >= 50) return rule.qty50;
  if (qty >= 10) return rule.qty10;
  return rule.qty1;
}

function getDepthRate(series, depth, qty, priceRules) {
  const table = series === 'ls' ? priceRules.depth?.ls : priceRules.depth?.ml;
  const rule = table?.[String(depth)];
  if (!rule) return null;
  if (qty >= 100) return rule.qty100;
  if (qty >= 50) return rule.qty50;
  if (qty >= 10) return rule.qty10;
  return null; // < 10 шт — ПСС по запросу
}

function getHeightRate(series, height, qty, priceRules) {
  if (qty < 100) return null; // ПСС по запросу
  const table = series === 'ls' ? priceRules.height?.ls : priceRules.height?.ml;
  return table?.[String(height)] ?? null;
}

function getColorRate(colorCat, ruleKey, qty, priceRules) {
  const catRule = priceRules.color?.[ruleKey]?.[colorCat];
  if (!catRule || qty < catRule.minQty) return null;
  const tiers = [...catRule.tiers].sort((a, b) => b.minQty - a.minQty);
  return tiers.find(t => qty >= t.minQty)?.rate ?? null;
}

export function calcPrice(config, catalog) {
  const model = config.modelId ? catalog.models[config.modelId] : null;
  if (!model) return null;

  const priceRules = catalog.priceRules ?? {};
  const defaults = model.defaultSpecs ?? {};
  const series = model.seriesId; // 'ml' | 'ls'
  const qty = Number(config.quantity) || 1;

  const doorW = model.doorWeight ?? 0;
  const bodyW = model.bodyWeight ?? 0;
  const totalW = doorW + bodyW;

  // ── 1. Определяем каждое изменение ──────────────────────────────
  const bodyThickChanged = defaults.bodyThickness != null && Number(config.bodyThickness) !== (Number(defaults.bodyThickness) || 0.5);
  const doorThickChanged = defaults.doorThickness != null && Number(config.doorThickness) !== (Number(defaults.doorThickness) || 0.5);
  const thicknessChanged = bodyThickChanged || doorThickChanged;

  const heightVal = config.height !== '' ? Number(config.height) : null;
  const heightChanged = heightVal !== null && heightVal !== Number(defaults.height);

  const depthVal = config.depth !== '' ? Number(config.depth) : null;
  const depthChanged = depthVal !== null && depthVal !== Number(defaults.depth);

  const widthVal = config.width !== '' ? Number(config.width) : null;
  const widthChanged = widthVal !== null && widthVal !== Number(defaults.width);

  const lockChanged = !!config.lockId && config.lockId !== 'key_basic';
  const ventChanged = !!config.ventilationType;
  const doorColorChanged = !!config.doorColor;
  const bodyColorChanged = !!config.bodyColor;

  // Толщина = 1 исполнение даже если изменены оба компонента
  // ВАЖНО: каждый новый параметр должен добавляться сюда, иначе changeCount будет занижен
  const changeCount = [
    thicknessChanged,
    heightChanged,
    depthChanged,
    widthChanged,
    lockChanged,
    ventChanged,
    doorColorChanged,
    bodyColorChanged,
  ].filter(Boolean).length;

  // ── 2. Нестандартная ширина — всегда ПСС по запросу ─────────────
  if (widthChanged) {
    return { manual: true, changeCount };
  }

  // ── 3. Лимит исполнений ─────────────────────────────────────────
  if (changeCount > 2) {
    return { manual: true, changeCount };
  }

  // ── 4. Суммарный процент наценки ────────────────────────────────
  let totalRate = 0;
  let anyManual = false;

  // ВАЖНО: каждый параметр должен вызывать addRate() — null означает ПСС по запросу
  function addRate(rate) {
    if (rate === null || rate === undefined) anyManual = true;
    else totalRate += rate;
  }

  // Толщина (пропорциональный расчёт)
  if (thicknessChanged) {
    if (qty < (priceRules.thickness?.minQty ?? 100)) {
      anyManual = true;
    } else {
      const rates = series === 'ls'
        ? priceRules.thickness?.ls ?? {}
        : priceRules.thickness?.ml ?? {};
      if (bodyThickChanged && doorThickChanged && config.bodyThickness === config.doorThickness) {
        // Весь шкаф одинаково — полный процент
        addRate(rates[config.bodyThickness] ?? null);
      } else {
        // Пропорционально по весу
        if (doorThickChanged && totalW > 0) {
          const r = rates[config.doorThickness] ?? null;
          addRate(r !== null ? r * (doorW / totalW) : null);
        }
        if (bodyThickChanged && totalW > 0) {
          const r = rates[config.bodyThickness] ?? null;
          addRate(r !== null ? r * (bodyW / totalW) : null);
        }
      }
    }
  }

  // Глубина
  if (depthChanged) {
    addRate(getDepthRate(series, depthVal, qty, priceRules));
  }

  // Высота
  if (heightChanged) {
    addRate(getHeightRate(series, heightVal, qty, priceRules));
  }

  // Вентиляция
  if (ventChanged) {
    addRate(getVentRate(config.ventilationType, qty, priceRules));
  }

  // Цвет двери
  if (doorColorChanged) {
    addRate(getColorRate(config.doorColor.cat, 'door', qty, priceRules));
  }

  // Цвет корпуса
  if (bodyColorChanged) {
    addRate(getColorRate(config.bodyColor.cat, 'full', qty, priceRules));
  }

  if (anyManual) {
    return { manual: true, changeCount };
  }

  // ── 5. Наценка за нестандартный замок ───────────────────────────
  let lockSurcharge = 0;
  if (lockChanged) {
    const lock = catalog.locks?.[config.lockId];
    const doorCount = model.doorCount ?? 2;
    if (lock) {
      lockSurcharge = (lock.perSection ?? 0) * doorCount;
    }
  }

  // ── 6. Цены ─────────────────────────────────────────────────────
  const priceMin = model.basePrice ?? 0;

  const clientPrice = Math.round(priceMin * (1 + totalRate) + lockSurcharge);

  // ── 7. Вес ──────────────────────────────────────────────────────
  const effDoor = config.doorThickness || defaults.doorThickness || '0.5';
  const effBody = config.bodyThickness || defaults.bodyThickness || '0.5';
  const weight = Math.round(
    ((doorW * (WEIGHT_MULT[effDoor] ?? 1)) + (bodyW * (WEIGHT_MULT[effBody] ?? 1))) * 100,
  ) / 100;

  // ── 8. Срок изготовления ────────────────────────────────────────
  let leadTime = null;
  if (changeCount === 1) leadTime = '7–14 дней';
  else if (changeCount >= 2 && changeCount <= 4) leadTime = '14–21–30 дней';
  else if (changeCount >= 5) leadTime = 'Более 30 дней';

  return {
    manual: false,
    changeCount,
    totalRate,
    clientPrice,
    weight,
    leadTime,
    lockSurcharge,
  };
}
