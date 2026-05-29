const WEIGHT_MULT = {
  '0.5': 1.125,
  '0.6': 1 + 1 / 3,
  '0.7': 1 + 5 / 9,
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
  return null;
}

function getHeightRate(series, height, qty, priceRules) {
  if (qty < 100) return null;
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
  const series = model.seriesId;
  const qty = Number(config.quantity) || 1;

  const doorW = model.doorWeight ?? 0;
  const bodyW = model.bodyWeight ?? 0;
  const totalW = doorW + bodyW;

  const bodyThickChanged = defaults.bodyThickness != null && Number(config.bodyThickness) !== (Number(defaults.bodyThickness) || 0.5);
  const doorThickChanged = defaults.doorThickness != null && Number(config.doorThickness) !== (Number(defaults.doorThickness) || 0.5);
  const thicknessChanged = bodyThickChanged || doorThickChanged;

  const heightVal = config.height !== '' ? Number(config.height) : null;
  const heightChanged = heightVal !== null && heightVal !== Number(defaults.height);

  const depthVal = config.depth !== '' ? Number(config.depth) : null;
  const depthChanged = depthVal !== null && depthVal !== Number(defaults.depth);

  const widthVal = config.width !== '' ? Number(config.width) : null;
  const widthChanged = widthVal !== null && widthVal !== Number(defaults.width);

  const lockChanged = !!config.lockId && config.lockId !== (defaults.lockId ?? 'key_basic');
  const ventChanged = !!config.ventilationType;
  const doorColorChanged = !!config.doorColor;
  const bodyColorChanged = !!config.bodyColor;

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

  if (widthChanged) {
    return { manual: true, changeCount };
  }

  if (changeCount > 2) {
    return { manual: true, changeCount };
  }

  let totalRate = 0;
  let anyManual = false;

  function addRate(rate) {
    if (rate === null || rate === undefined) anyManual = true;
    else totalRate += rate;
  }

  if (thicknessChanged) {
    if (qty < (priceRules.thickness?.minQty ?? 100)) {
      anyManual = true;
    } else {
      const rates = series === 'ls'
        ? priceRules.thickness?.ls ?? {}
        : priceRules.thickness?.ml ?? {};
      if (bodyThickChanged && doorThickChanged && config.bodyThickness === config.doorThickness) {

        addRate(rates[config.bodyThickness] ?? null);
      } else {

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

  if (depthChanged) {
    addRate(getDepthRate(series, depthVal, qty, priceRules));
  }

  if (heightChanged) {
    addRate(getHeightRate(series, heightVal, qty, priceRules));
  }

  if (ventChanged) {
    addRate(getVentRate(config.ventilationType, qty, priceRules));
  }

  if (doorColorChanged) {
    addRate(getColorRate(config.doorColor.cat, 'door', qty, priceRules));
  }

  if (bodyColorChanged) {
    addRate(getColorRate(config.bodyColor.cat, 'full', qty, priceRules));
  }

  if (anyManual) {
    return { manual: true, changeCount };
  }

  let lockSurcharge = 0;
  if (lockChanged) {
    const lock = catalog.locks?.[config.lockId];
    const doorCount = model.doorCount ?? 1;
    if (lock) {
      lockSurcharge = (lock.perSection ?? 0) * doorCount;
    }
  }

  const priceMin = model.basePrice ?? 0;

  const clientPrice = Math.round(priceMin * (1 + totalRate) + lockSurcharge);

  const effDoor = config.doorThickness || defaults.doorThickness || '0.5';
  const effBody = config.bodyThickness || defaults.bodyThickness || '0.5';
  const defaultDoor = String(Number(defaults.doorThickness) || 0.5);
  const defaultBody = String(Number(defaults.bodyThickness) || 0.5);
  const doorMult = effDoor !== defaultDoor ? (WEIGHT_MULT[effDoor] ?? 1) : 1;
  const bodyMult = effBody !== defaultBody ? (WEIGHT_MULT[effBody] ?? 1) : 1;
  const weight = Math.round(((doorW * doorMult) + (bodyW * bodyMult)) * 100) / 100;

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
