// ============================================================
// Промет — синхронизация Google Sheets → Firebase Firestore
// Триггер onEdit: лист «Promet» (модели) + лист «price» (коэффициенты)
// ============================================================

var PROJECT_ID   = 'promet-f4543';
var FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID
                  + '/databases/(default)/documents/catalog/main';

// ── Установить триггер (запустить один раз вручную) ──────────
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onSheetEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  Logger.log('✅ Триггер установлен');
}

// ── Точка входа триггера ─────────────────────────────────────
function onSheetEdit(e) {
  var name = e.source.getActiveSheet().getName();
  if (name === 'Promet') syncModels();
  else if (name === 'price') syncPriceRules();
}

// ============================================================
// Firestore helpers
// ============================================================

function getToken() {
  return ScriptApp.getOAuthToken();
}

function toFs(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean')  return { booleanValue: v };
  if (typeof v === 'number' && v % 1 === 0) return { integerValue: String(v) };
  if (typeof v === 'number')   return { doubleValue: v };
  if (typeof v === 'string')   return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  if (typeof v === 'object') {
    var f = {};
    Object.keys(v).forEach(function(k) { f[k] = toFs(v[k]); });
    return { mapValue: { fields: f } };
  }
  return { nullValue: null };
}

function fromFs(v) {
  if ('nullValue'    in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue'  in v) return v.doubleValue;
  if ('stringValue'  in v) return v.stringValue;
  if ('arrayValue'   in v) return (v.arrayValue.values || []).map(fromFs);
  if ('mapValue'     in v) {
    var obj = {};
    Object.keys(v.mapValue.fields || {}).forEach(function(k) {
      obj[k] = fromFs(v.mapValue.fields[k]);
    });
    return obj;
  }
  return null;
}

function fetchCatalog() {
  var res = UrlFetchApp.fetch(FIRESTORE_URL, {
    headers: { Authorization: 'Bearer ' + getToken() },
    muteHttpExceptions: true,
  });
  var doc = JSON.parse(res.getContentText());
  if (!doc.fields) return {};
  var out = {};
  Object.keys(doc.fields).forEach(function(k) { out[k] = fromFs(doc.fields[k]); });
  return out;
}

function patchFirestore(fields, paths) {
  var mask = paths.map(function(p) { return 'updateMask.fieldPaths=' + p; }).join('&');
  var res = UrlFetchApp.fetch(FIRESTORE_URL + '?' + mask, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + getToken(),
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Firestore ' + res.getResponseCode() + ': ' + res.getContentText());
  }
}

// ============================================================
// Парсеры значений
// ============================================================

function pPct(s) {
  if (s === null || s === undefined) return null;
  // Google Sheets хранит проценты как десятичные (10% → 0.1, 0% → 0)
  if (typeof s === 'number') return s;
  var str = String(s).trim();
  if (!str) return null;
  var n = parseFloat(str.replace('%', '').replace(',', '.'));
  return isNaN(n) ? null : n / 100;
}

function pRub(s) {
  var n = parseInt(String(s || '').replace(/\s/g, ''), 10);
  return isNaN(n) ? null : n;
}

function pWt(s) {
  var n = parseFloat(String(s || '').replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

function pPrice(s) {
  return parseInt(String(s || '').replace(/\s/g, ''), 10);
}

function pThick(s) {
  return String(s || '').replace(',', '.').trim();
}

function cleanVentName(s) {
  return String(s || '').replace(/^\d+\.\d+\.\s*/, '').trim();
}

// ============================================================
// Синхронизация моделей (лист Promet)
// ============================================================

function syncModels() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Promet');
    if (!sheet) { Logger.log('Лист Promet не найден'); return; }

    var catalog = fetchCatalog();
    var models  = catalog.models || {};
    var updated = 0, added = 0;

    sheet.getDataRange().getValues().forEach(function(row) {
      if (!/^\d+$/.test(String(row[0] || '').trim())) return;

      var id = String(row[3] || '').trim();
      if (!id) return;

      var height    = parseInt(row[6], 10);
      var basePrice = pPrice(row[9]);
      if (isNaN(height) || isNaN(basePrice)) return;

      var existing     = models[id] || {};
      var existSpecs   = existing.defaultSpecs || {};

      models[id] = {
        article:      String(row[1] || '').trim(),
        name:         String(row[2] || '').trim(),
        seriesId:     String(row[4] || '').trim().toLowerCase(),
        basePrice:    basePrice,
        cpBezNDS:     pPrice(row[15]),
        totalWeight:  pWt(row[5]),
        lockCount:    pWt(row[12]),
        doorWeight:   pWt(row[13]),
        bodyWeight:   pWt(row[14]),
        doorCount:    parseInt(String(row[16] || '').trim(), 10) || null,
        defaultSpecs: {
          height:        height,
          width:         parseInt(row[7], 10),
          depth:         parseInt(row[8], 10),
          bodyThickness: pThick(row[10]),
          doorThickness: pThick(row[11]),
          lockId:        existSpecs.lockId || 'key_basic',
        },
      };

      if (existing.name) updated++; else added++;
    });

    patchFirestore({ models: toFs(models) }, ['models']);
    Logger.log('✅ Модели: обновлено=' + updated + ' добавлено=' + added);
  } catch(e) {
    Logger.log('❌ syncModels: ' + e.message);
  }
}

// ============================================================
// Синхронизация коэффициентов цен (лист price)
// ============================================================

function syncPriceRules() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('price');
    if (!sheet) { Logger.log('Лист price не найден'); return; }

    function r(row, col) {
      return sheet.getRange(row, col).getValue(); // сырое значение — числа остаются числами
    }
    function rStr(row, col) {
      return String(sheet.getRange(row, col).getValue() || '').trim(); // только для текста
    }

    // ── Толщина (строки 5-7: col D=ML, col E=LS) ──────────────
    var thicknessML = {
      '0.5': pPct(r(5, 4)),
      '0.6': pPct(r(6, 4)),
      '0.7': pPct(r(7, 4)),
    };
    var thicknessLS = {
      '0.5': pPct(r(5, 5)),
      '0.6': pPct(r(6, 5)),
      '0.7': pPct(r(7, 5)),
    };

    // ── Глубина ML (строки 11-13: col C=от10, D=от50, E=от100) ─
    var depthOrder = [450, 400, 300];
    var depthML = {}, depthLS = {};
    depthOrder.forEach(function(d, i) {
      depthML[String(d)] = {
        qty10:  pPct(r(11 + i, 3)),
        qty50:  pPct(r(11 + i, 4)),
        qty100: pPct(r(11 + i, 5)),
      };
    });

    // ── Глубина LS (строки 16-18: col C=от10, D=от50, E=от100) ─
    depthOrder.forEach(function(d, i) {
      depthLS[String(d)] = {
        qty10:  pPct(r(16 + i, 3)),
        qty50:  pPct(r(16 + i, 4)),
        qty100: pPct(r(16 + i, 5)),
      };
    });

    // ── Высота (строки 22-26: col C=ML от100, E=LS от100) ──────
    var heightOrder = [1800, 1850, 1860, 1900, 2000];
    var heightML = {}, heightLS = {};
    heightOrder.forEach(function(h, i) {
      heightML[String(h)] = pPct(r(22 + i, 3));
      heightLS[String(h)] = pPct(r(22 + i, 5));
    });
    // 1830мм — стандартная высота, не в таблице, всегда 0%
    heightML['1830'] = 0;
    heightLS['1830'] = 0;

    // ── Замки (строки 29-32: col A=название, B=₽/секцию) ───────
    var lockDefs = [
      { id: 'd111x',             row: 29 },
      { id: 'euro_locks',        row: 30 },
      { id: 'praktik_el_code',   row: 31 },
      { id: 'praktik_el_mifare', row: 32 },
    ];
    var parsedLocks = {
      key_basic: { name: 'Ключевой (Базовый)', perSection: 0 },
    };
    lockDefs.forEach(function(def) {
      var perSection = pRub(r(def.row, 2));
      parsedLocks[def.id] = {
        name:       rStr(def.row, 1),
        perSection: perSection !== null ? perSection : 0,
      };
    });

    // ── Вентиляция (строки 33/36 и 37/40) ───────────────────────
    var ventRoof = {
      name:   cleanVentName(rStr(33, 1)),
      qty1:   pPct(r(36, 1)),
      qty10:  pPct(r(36, 2)),
      qty50:  pPct(r(36, 3)),
      qty100: pPct(r(36, 4)),
    };
    var ventRoofBottom = {
      name:   cleanVentName(rStr(37, 1)),
      qty1:   pPct(r(40, 1)),
      qty10:  pPct(r(40, 2)),
      qty50:  pPct(r(40, 3)),
      qty100: pPct(r(40, 4)),
    };

    // ── RAL дверей (строки 44, 46, 47) ──────────────────────────
    var colorDoor = {
      cat1: {
        minQty: 30,
        tiers: [
          { minQty: 30, rate: pPct(r(44, 4)) },
          { minQty: 50, rate: pPct(r(44, 6)) },
        ],
      },
      cat2: {
        minQty: 50,
        tiers: [{ minQty: 50, rate: pPct(r(46, 6)) }],
      },
      cat3: {
        minQty: 50,
        tiers: [{ minQty: 50, rate: pPct(r(47, 6)) }],
      },
    };

    // ── RAL корпуса полностью (строки 50-52) ─────────────────────
    var colorFull = {
      cat1: { minQty: 50, tiers: [{ minQty: 50, rate: pPct(r(50, 4)) }] },
      cat2: { minQty: 50, tiers: [{ minQty: 50, rate: pPct(r(51, 4)) }] },
      cat3: { minQty: 50, tiers: [{ minQty: 50, rate: pPct(r(52, 4)) }] },
    };

    // ── Собираем итоговый объект ─────────────────────────────────
    var priceRules = {
      thickness:   { minQty: 100, ml: thicknessML, ls: thicknessLS },
      depth:       { minQty: 10,  ml: depthML,     ls: depthLS     },
      height:      { minQty: 100, ml: heightML,     ls: heightLS    },
      ventilation: { roof: ventRoof, roofBottom: ventRoofBottom     },
      color:       { door: colorDoor, full: colorFull               },
    };

    patchFirestore(
      { priceRules: toFs(priceRules), locks: toFs(parsedLocks) },
      ['priceRules', 'locks']
    );
    Logger.log('✅ Коэффициенты цен синхронизированы');
  } catch(e) {
    Logger.log('❌ syncPriceRules: ' + e.message);
  }
}
