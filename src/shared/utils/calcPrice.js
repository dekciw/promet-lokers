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
  if (qty >= 100) return rule.qty100 ?? null;
  if (qty >= 50) return rule.qty50 ?? null;
  if (qty >= 10) return rule.qty10 ?? null;
  return rule.qty1 ?? null;
}

function getHeightRate(series, height, qty, priceRules) {
  const table = series === 'ls' ? priceRules.height?.ls : priceRules.height?.ml;
  const rule = table?.[String(height)];
  if (!rule) return null;
  if (qty >= 100) return rule.qty100 ?? null;
  if (qty >= 50) return rule.qty50 ?? null;
  if (qty >= 10) return rule.qty10 ?? null;
  return rule.qty1 ?? null;
}

function getThicknessRate(part, series, thicknessStr, qty, priceRules) {
  const table = part === 'body'
    ? (series === 'ls' ? priceRules.thickness?.body?.ls : priceRules.thickness?.body?.ml)
    : (series === 'ls' ? priceRules.thickness?.door?.ls : priceRules.thickness?.door?.ml);
  const rule = table?.[thicknessStr];
  if (!rule) return null;
  if (qty >= 100) return rule.qty100 ?? null;
  if (qty >= 50) return rule.qty50 ?? null;
  if (qty >= 10) return rule.qty10 ?? null;
  return rule.qty1 ?? null;
}

function getColorRate(colorCat, ruleKey, qty, priceRules) {
  const rule = priceRules.color?.[ruleKey]?.[colorCat];
  if (!rule) return null;
  if (qty >= 100) return rule.qty100 ?? null;
  if (qty >= 50) return rule.qty50 ?? null;
  if (qty >= 10) return rule.qty10 ?? null;
  return rule.qty1 ?? null;
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
  const doorColorChanged = !!config.doorColor && config.doorColor.name !== 'RAL 7038';
  const bodyColorChanged = !!config.bodyColor && config.bodyColor.name !== 'RAL 7038';

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
  const breakdown = {};

  function addRate(rate, paramKey = null) {
    if (rate === null || rate === undefined) {
      anyManual = true;
    } else {
      totalRate += rate;
      if (paramKey && rate !== 0) {
        breakdown[paramKey] = { rate, amount: 0 };
      }
    }
  }

  if (thicknessChanged) {
    if (totalW === 0) {
      anyManual = true;
    } else {
      const doorRate = doorThickChanged
        ? getThicknessRate('door', series, config.doorThickness, qty, priceRules)
        : null;
      const bodyRate = bodyThickChanged
        ? getThicknessRate('body', series, config.bodyThickness, qty, priceRules)
        : null;

      if (bodyThickChanged && doorThickChanged && config.bodyThickness === config.doorThickness) {
        // Обе толщины одинаковы - распределяем наценку пропорционально весу
        // (но теперь body и door имеют раздельные таблицы, могут быть разные ставки)
        addRate(doorRate !== null ? doorRate * (doorW / totalW) : null, 'doorThickness');
        addRate(bodyRate !== null ? bodyRate * (bodyW / totalW) : null, 'bodyThickness');
      } else {
        if (doorThickChanged) {
          addRate(doorRate !== null ? doorRate * (doorW / totalW) : null, 'doorThickness');
        }
        if (bodyThickChanged) {
          addRate(bodyRate !== null ? bodyRate * (bodyW / totalW) : null, 'bodyThickness');
        }
      }
    }
  }

  if (depthChanged) {
    addRate(getDepthRate(series, depthVal, qty, priceRules), 'depth');
  }

  if (heightChanged) {
    addRate(getHeightRate(series, heightVal, qty, priceRules), 'height');
  }

  if (ventChanged) {
    addRate(getVentRate(config.ventilationType, qty, priceRules), 'ventilation');
  }

  if (doorColorChanged) {
    addRate(getColorRate(config.doorColor.cat, 'door', qty, priceRules), 'doorColor');
  }

  if (bodyColorChanged) {
    addRate(getColorRate(config.bodyColor.cat, 'full', qty, priceRules), 'bodyColor');
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

  // Calculate amounts for each parameter
  Object.keys(breakdown).forEach(key => {
    breakdown[key].amount = Math.round(priceMin * breakdown[key].rate);
  });

  // Add lock surcharge to breakdown
  if (lockSurcharge > 0) {
    breakdown.lock = { amount: lockSurcharge };
  }

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
    breakdown,
  };
}
