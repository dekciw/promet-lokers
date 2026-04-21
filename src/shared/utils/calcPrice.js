// Коэффициенты прибавки к весу при изменении толщины металла
// База: 0.5мм (стандарт) = множитель 1.0
const WEIGHT_MULT = {
  '0.5': 1.0,
  '0.6': 1 + 1 / 3,   // +33.33%
  '0.7': 1 + 5 / 9,   // +55.56%
};

function getVentRate(ventilationType, qty, priceRules) {
  const rule = priceRules.ventilation?.[ventilationType];
  if (!rule) return null;
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
  const discount = Number(config.discount) || 0;

  const doorW = model.doorWeight ?? 0;
  const bodyW = model.bodyWeight ?? 0;
  const totalW = doorW + bodyW;

  // ── 1. Определяем каждое изменение ──────────────────────────────
  const bodyThickChanged = !!config.bodyThickness && config.bodyThickness !== defaults.bodyThickness;
  const doorThickChanged = !!config.doorThickness && config.doorThickness !== defaults.doorThickness;
  const thicknessChanged = bodyThickChanged || doorThickChanged;

  const heightVal = config.height !== '' ? Number(config.height) : null;
  const heightChanged = heightVal !== null && heightVal !== Number(defaults.height);

  const depthVal = config.depth !== '' ? Number(config.depth) : null;
  const depthChanged = depthVal !== null && depthVal !== Number(defaults.depth);

  const lockChanged = !!config.lockId && config.lockId !== 'key_basic';
  const ventChanged = !!config.ventilationType;
  const doorColorChanged = !!config.doorColor;
  const bodyColorChanged = !!config.bodyColor;

  // Толщина = 1 исполнение даже если изменены оба компонента
  const changeCount = [
    thicknessChanged,
    heightChanged,
    depthChanged,
    lockChanged,
    ventChanged,
    doorColorChanged,
    bodyColorChanged,
  ].filter(Boolean).length;

  // ── 2. Лимит исполнений ─────────────────────────────────────────
  if (changeCount > 2) {
    return { manual: true, changeCount };
  }

  // ── 3. Суммарный процент наценки ────────────────────────────────
  let totalRate = 0;
  let anyManual = false;

  function addRate(rate) {
    if (rate === null || rate === undefined) anyManual = true;
    else totalRate += rate;
  }

  // Толщина (пропорциональный расчёт)
  if (thicknessChanged) {
    if (qty < (priceRules.thickness?.minQty ?? 100)) {
      anyManual = true;
    } else {
      const rates = priceRules.thickness?.rates ?? {};
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

  // ── 4. Наценка за нестандартный замок ───────────────────────────
  let lockSurcharge = 0;
  if (lockChanged) {
    const lock = catalog.locks?.[config.lockId];
    const doorCount = model.doorCount ?? 2;
    if (lock) {
      lockSurcharge = doorCount === 1
        ? (lock.single ?? 0)
        : (lock.dual ?? 0) * (doorCount / 2);
    }
  }

  // ── 5. Цены ─────────────────────────────────────────────────────
  const priceMin = model.basePrice ?? 0;
  const cpBezNDS = model.cpBezNDS ?? 0;

  const clientRaw = priceMin * (1 + totalRate) + lockSurcharge;
  const clientPrice = Math.round(clientRaw * (1 - discount / 100));
  const factoryPrice = Math.round(cpBezNDS * (1 + totalRate) + lockSurcharge);

  // ── 6. Вес ──────────────────────────────────────────────────────
  const effDoor = config.doorThickness || defaults.doorThickness || '0.5';
  const effBody = config.bodyThickness || defaults.bodyThickness || '0.5';
  const weight = Math.round(
    ((doorW * (WEIGHT_MULT[effDoor] ?? 1)) + (bodyW * (WEIGHT_MULT[effBody] ?? 1))) * 100,
  ) / 100;

  // ── 7. Срок изготовления ────────────────────────────────────────
  let leadTime = null;
  if (changeCount === 1) leadTime = '7–14 дней';
  else if (changeCount >= 2 && changeCount <= 4) leadTime = '14–21–30 дней';
  else if (changeCount >= 5) leadTime = 'Более 30 дней';

  return {
    manual: false,
    changeCount,
    totalRate,
    clientPrice,
    factoryPrice,
    weight,
    leadTime,
    lockSurcharge,
  };
}
