#!/usr/bin/env node
/**
 * Синхронизация данных из Google Sheets → Firebase Firestore
 * Запуск: node scripts/sync-sheets.js
 *
 * Лист 1 (gid=0) — модели шкафов:
 * A=0:п/п  B=1:Артикул  C=2:Наименование  D=3:ID   E=4:Серия
 * F=5:Вес шкафа  G=6:Высота  H=7:Ширина  I=8:Глубина  J=9:Цена
 * K=10:Толщина корпуса  L=11:Толщина двери  M=12:Кол-во замков
 * N=13:Вес дверей  O=14:Вес корпуса
 *
 * Лист 2 (sheet=price) — коэффициенты цен:
 * Строки 1-based (как в Google Sheets):
 *  1-6   : Толщина металла корпуса
 *  7-12  : Толщина металла двери
 *  13-18 : Глубина ML
 *  19-23 : Глубина LS
 *  24-31 : Высота (ML и LS)
 *  32-37 : Замки (фиксированная стоимость)
 *  38-41 : Вентиляция
 *  46-57 : Нестандартный RAL (цвет двери + корпуса полностью)
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SHEET_ID   = '1KA88nZDnMX00kQ0RglYgan24Zl8LJV6lei5NM9X3auc';
const PROJECT_ID = 'promet-f4543';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog/main`;

const FIREBASE_CLIENT_ID     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

// ── 1. OAuth токен ────────────────────────────────────────────────
async function getAccessToken() {
  const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) throw new Error('Нет refresh_token в firebase-tools.json');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FIREBASE_CLIENT_ID,
      client_secret: FIREBASE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`OAuth error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── 2. Firestore ──────────────────────────────────────────────────
function fromFirestore(v) {
  if ('nullValue'    in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue'  in v) return v.doubleValue;
  if ('stringValue'  in v) return v.stringValue;
  if ('arrayValue'   in v) return (v.arrayValue.values || []).map(fromFirestore);
  if ('mapValue'     in v) {
    const obj = {};
    Object.entries(v.mapValue.fields || {}).forEach(([k, val]) => { obj[k] = fromFirestore(val); });
    return obj;
  }
  return null;
}

async function fetchCurrentCatalog() {
  const res = await fetch(FIRESTORE_URL);
  if (!res.ok) throw new Error(`Ошибка чтения Firestore: ${res.status}`);
  const { fields } = await res.json();
  const catalog = {};
  Object.entries(fields).forEach(([k, v]) => { catalog[k] = fromFirestore(v); });
  return catalog;
}

function toFirestore(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number' && Number.isInteger(v)) return { integerValue: String(v) };
  if (typeof v === 'number') return { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestore) } };
  if (typeof v === 'object') {
    const fields = {};
    Object.entries(v).forEach(([k, val]) => { fields[k] = toFirestore(val); });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

// ── 3. CSV парсер ─────────────────────────────────────────────────
function parseCSVFull(text) {
  const rows = [];
  let row = [], field = '', inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { field += ch; }
    } else {
      if      (ch === '"')  { inQuote = true; }
      else if (ch === ',')  { row.push(field); field = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else { field += ch; }
    }
  }
  if (row.length > 0 || field) { row.push(field); rows.push(row); }
  return rows;
}

// ── 4. Вспомогательные парсеры ───────────────────────────────────
function parsePrice(s) {
  return parseInt((s || '').replace(/\s/g, ''), 10);
}

function parseThickness(s) {
  return (s || '').replace(',', '.').trim();
}

function parseWeight(s) {
  const n = parseFloat((s || '').replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

// "10%" или "10" или "10,5%" → 0.10 | "ПСС по запросу" или "" → null
function parsePercent(s) {
  const cleaned = (s || '').trim().replace('%', '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : Math.round(n) / 100;
}

// "132" или "1 500" → 132 | "" → null
function parseRubles(s) {
  const n = parseInt((s || '').replace(/\s/g, ''), 10);
  return isNaN(n) ? null : n;
}

// Вспомогательная функция: rows — 0-based массив, row/col — 1-based (как в Sheets)
function cell(rows, row, col) {
  return (rows[row - 1]?.[col - 1] ?? '').trim();
}

// ── 5. Парсинг листа с моделями ───────────────────────────────────
async function fetchModelsSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка чтения листа моделей: ${res.status}`);
  return await res.text();
}

function parseModels(csvText, existingModels) {
  const allRows = parseCSVFull(csvText);
  const rows = allRows.filter(row => /^\d+$/.test((row[0] || '').trim()));

  const updatedModels = { ...existingModels };
  let updated = 0, added = 0;

  for (const cols of rows) {
    const id            = cols[3]?.trim();
    const article       = cols[1]?.trim();
    const name          = cols[2]?.trim();
    const seriesRaw     = cols[4]?.trim().toLowerCase();
    const totalWeight   = parseWeight(cols[5]);
    const height        = parseInt(cols[6], 10);
    const width         = parseInt(cols[7], 10);
    const depth         = parseInt(cols[8], 10);
    const basePrice     = parsePrice(cols[9]);
    const bodyThickness = parseThickness(cols[10]);
    const doorThickness = parseThickness(cols[11]);
    const lockCount     = parseWeight(cols[12]);
    const doorWeight    = parseWeight(cols[13]);
    const bodyWeight    = parseWeight(cols[14]);
    const cpBezNDS      = parsePrice(cols[15]);
    const doorCount     = parseInt((cols[16] || '').trim(), 10) || null;

    if (!id || isNaN(height) || isNaN(basePrice)) continue;

    const existing = updatedModels[id];
    const existingSpecs = existing?.defaultSpecs ?? {};

    updatedModels[id] = {
      article, name, seriesId: seriesRaw, basePrice, cpBezNDS,
      totalWeight, lockCount, doorWeight, bodyWeight, doorCount,
      defaultSpecs: {
        height, width, depth, bodyThickness, doorThickness,
        lockId: existingSpecs.lockId ?? 'key_basic',
      },
    };

    if (existing) updated++; else added++;
  }

  console.log(`   Обновлено моделей: ${updated}, добавлено: ${added}`);
  return updatedModels;
}

// ── 6. Парсинг листа price ────────────────────────────────────────
async function fetchPriceSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1504497578`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка чтения листа price: ${res.status}`);
  return await res.text();
}

function parsePriceRules(csvText) {
  const rows = parseCSVFull(csvText);
  const r = (row, col) => cell(rows, row, col);

  // ── 1.1 Толщина металла (строки 5-7: col D = ML от100, col E = LS от100) ──
  const thicknessML = {
    '0.5': parsePercent(r(5, 4)),
    '0.6': parsePercent(r(6, 4)),
    '0.7': parsePercent(r(7, 4)),
  };
  const thicknessLS = {
    '0.5': parsePercent(r(5, 5)),
    '0.6': parsePercent(r(6, 5)),
    '0.7': parsePercent(r(7, 5)),
  };

  // ── 1.3 Глубина ML (строки 11-13: col C=от10, D=от50, E=от100) ──
  const depthValues = [450, 400, 300];
  const depthML = {};
  depthValues.forEach((d, i) => {
    depthML[String(d)] = {
      qty10:  parsePercent(r(11 + i, 3)),
      qty50:  parsePercent(r(11 + i, 4)),
      qty100: parsePercent(r(11 + i, 5)),
    };
  });

  // ── 1.3 Глубина LS (строки 16-18: col C=от10, D=от50, E=от100) ──
  const depthLS = {};
  depthValues.forEach((d, i) => {
    depthLS[String(d)] = {
      qty10:  parsePercent(r(16 + i, 3)),
      qty50:  parsePercent(r(16 + i, 4)),
      qty100: parsePercent(r(16 + i, 5)),
    };
  });

  // ── 1.4 Высота (строки 22-26: col C=ML от100, E=LS от100) ──
  const heightValues = [1800, 1850, 1860, 1900, 2000];
  const heightML = {}, heightLS = {};
  heightValues.forEach((h, i) => {
    heightML[String(h)] = parsePercent(r(22 + i, 3));
    heightLS[String(h)] = parsePercent(r(22 + i, 5));
  });
  // 1830мм — стандартная высота шкафов LS/ML, не в таблице, всегда 0%
  heightML['1830'] = 0;
  heightLS['1830'] = 0;

  // ── 2.1 Замки (строки 29-32: col A=название, B=цена за 1 секцию) ──
  const lockDefs = [
    { id: 'd111x',             row: 29 },
    { id: 'euro_locks',        row: 30 },
    { id: 'praktik_el_code',   row: 31 },
    { id: 'praktik_el_mifare', row: 32 },
  ];
  const parsedLocks = {};
  lockDefs.forEach(({ id, row }) => {
    const name       = r(row, 1).trim();
    const perSection = parseRubles(r(row, 2));
    parsedLocks[id] = { name, perSection: perSection ?? 0 };
  });

  const cleanVentName = s => s.replace(/^\d+\.\d+\.\s*/, '').trim();

  // ── 2.2 Вентиляция только крыша (строка 33 = название, строка 36 = коэффициенты) ──
  const ventRoof = {
    name:   cleanVentName(r(33, 1)),
    qty1:   parsePercent(r(36, 1)),
    qty10:  parsePercent(r(36, 2)),
    qty50:  parsePercent(r(36, 3)),
    qty100: parsePercent(r(36, 4)),
  };

  // ── 2.3 Вентиляция крыша + дно (строка 37 = название, строка 40 = коэффициенты) ──
  const ventRoofBottom = {
    name:   cleanVentName(r(37, 1)),
    qty1:   parsePercent(r(40, 1)),
    qty10:  parsePercent(r(40, 2)),
    qty50:  parsePercent(r(40, 3)),
    qty100: parsePercent(r(40, 4)),
  };

  // ── 3.1 RAL дверей (строки 44, 46, 47; col D=от30шт, col F=от50шт) ──
  const colorDoor = {
    cat1: {
      minQty: 30,
      tiers: [
        { minQty: 30, rate: parsePercent(r(44, 4)) }, // от 30 шт
        { minQty: 50, rate: parsePercent(r(44, 6)) }, // от 50 шт
      ],
    },
    cat2: {
      minQty: 50,
      tiers: [{ minQty: 50, rate: parsePercent(r(46, 6)) }], // col F
    },
    cat3: {
      minQty: 50,
      tiers: [{ minQty: 50, rate: parsePercent(r(47, 6)) }], // col F
    },
  };

  // ── 3.2 RAL корпуса полностью (строки 50, 51, 52; col D=от50шт) ──
  const colorFull = {
    cat1: {
      minQty: 50,
      tiers: [{ minQty: 50, rate: parsePercent(r(50, 4)) }],
    },
    cat2: {
      minQty: 50,
      tiers: [{ minQty: 50, rate: parsePercent(r(51, 4)) }],
    },
    cat3: {
      minQty: 50,
      tiers: [{ minQty: 50, rate: parsePercent(r(52, 4)) }],
    },
  };

  return {
    parsedLocks,
    thickness: { minQty: 100, ml: thicknessML, ls: thicknessLS },
    depth:     { minQty: 10, ml: depthML, ls: depthLS },
    height:    { minQty: 100, ml: heightML, ls: heightLS },
    ventilation: { roof: ventRoof, roofBottom: ventRoofBottom },
    color: { door: colorDoor, full: colorFull },
  };
}

// ── 7. Лог для проверки результата ───────────────────────────────
function logPriceRules(rules) {
  const f  = x => x !== null ? `${(x * 100).toFixed(0)}%` : '—';
  const fv = v => `<10шт:${f(v.qty1)} / от10:${f(v.qty10)} / от50:${f(v.qty50)} / от100:${f(v.qty100)}`;

  console.log('\n   📋 Проверь коэффициенты перед записью:');

  console.log('\n   Толщина металла ML (от 100 шт):');
  Object.entries(rules.thickness.ml).forEach(([k, v]) =>
    console.log(`      ${k} мм → ${f(v)}`));

  console.log('\n   Толщина металла LS (от 100 шт):');
  Object.entries(rules.thickness.ls).forEach(([k, v]) =>
    console.log(`      ${k} мм → ${f(v)}`));

  console.log('\n   Глубина ML (от 10 шт):');
  Object.entries(rules.depth.ml).forEach(([d, t]) =>
    console.log(`      ${d} мм → от10:${f(t.qty10)} / от50:${f(t.qty50)} / от100:${f(t.qty100)}`));

  console.log('\n   Глубина LS (от 10 шт):');
  Object.entries(rules.depth.ls).forEach(([d, t]) =>
    console.log(`      ${d} мм → от10:${f(t.qty10)} / от50:${f(t.qty50)} / от100:${f(t.qty100)}`));

  console.log('\n   Высота ML/LS (от 100 шт):');
  Object.keys(rules.height.ml).forEach(h =>
    console.log(`      ${h} мм → ML:${f(rules.height.ml[h])} / LS:${f(rules.height.ls[h])}`));

  console.log('\n   Замки (₽ за 1 секцию):');
  Object.entries(rules.parsedLocks).forEach(([k, v]) =>
    console.log(`      [${k}] ${v.name} → ${v.perSection} ₽/секц`));

  console.log('\n   Вентиляция только крыша:');
  console.log(`      ${fv(rules.ventilation.roof)}`);
  console.log('\n   Вентиляция крыша + дно:');
  console.log(`      ${fv(rules.ventilation.roofBottom)}`);

  console.log('\n   RAL дверей:');
  Object.entries(rules.color.door).forEach(([cat, d]) => {
    const tiers = d.tiers.map(t => `от${t.minQty}шт:${f(t.rate)}`).join(' / ');
    console.log(`      ${cat} (min ${d.minQty} шт) → ${tiers}`);
  });

  console.log('\n   RAL корпуса полностью:');
  Object.entries(rules.color.full).forEach(([cat, d]) => {
    const tiers = d.tiers.map(t => `от${t.minQty}шт:${f(t.rate)}`).join(' / ');
    console.log(`      ${cat} (min ${d.minQty} шт) → ${tiers}`);
  });

  console.log('');
}

// ── 8. Основная логика ────────────────────────────────────────────
async function main() {
  console.log('🔑 Получаем access token...');
  const token = await getAccessToken();

  console.log('📥 Читаем текущий каталог из Firebase...');
  const currentCatalog = await fetchCurrentCatalog();

  // Лист 1 — модели
  console.log('📊 Загружаем модели из Google Sheets...');
  const modelsCsv = await fetchModelsSheet();
  const updatedModels = parseModels(modelsCsv, currentCatalog.models ?? {});

  // Лист 2 — коэффициенты цен
  console.log('📊 Загружаем коэффициенты из листа price...');
  const priceCsv = await fetchPriceSheet();
  const priceRules = parsePriceRules(priceCsv);
  logPriceRules(priceRules);

  // Строим catalog.locks: key_basic + 4 замка из таблицы
  const updatedLocks = {
    key_basic: { name: 'Ключевой (Базовый)', perSection: 0 },
    ...priceRules.parsedLocks,
  };

  // Записываем в Firebase
  console.log('📤 Записываем в Firebase...');
  const body = {
    fields: {
      models:     toFirestore(updatedModels),
      priceRules: toFirestore(priceRules),
      locks:      toFirestore(updatedLocks),
    },
  };

  const res = await fetch(
    `${FIRESTORE_URL}?updateMask.fieldPaths=models&updateMask.fieldPaths=priceRules&updateMask.fieldPaths=locks`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ошибка записи в Firestore (${res.status}): ${err}`);
  }

  console.log('✅ Готово! Данные успешно синхронизированы.');
  console.log(`   Всего моделей: ${Object.keys(updatedModels).length}`);
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
