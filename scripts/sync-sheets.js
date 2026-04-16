#!/usr/bin/env node
/**
 * Синхронизация данных из Google Sheets → Firebase Firestore
 * Запуск: node scripts/sync-sheets.js
 *
 * Маппинг столбцов (0-based):
 * A=0:п/п  B=1:Артикул  C=2:Наименование  D=3:ID   E=4:Серия
 * F=5:Вес шкафа (=N+O, формула)          G=6:Высота  H=7:Ширина
 * I=8:Глубина  J=9:Цена
 * K=10:Толщина металла корпуса (мм)
 * L=11:Толщина металла двери (мм)
 * M=12:Кол-во замков
 * N=13:Вес дверей (кг)
 * O=14:Вес корпуса (кг)
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SHEET_ID   = '1KA88nZDnMX00kQ0RglYgan24Zl8LJV6lei5NM9X3auc';
const PROJECT_ID = 'promet-f4543';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog/main`;

// Firebase CLI OAuth credentials (публичные, из open-source firebase-tools)
const FIREBASE_CLIENT_ID     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

// ── 1. Получаем access token через refresh token ─────────────────
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

// ── 2. Читаем текущий каталог из Firestore ───────────────────────
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

// ── 3. Парсим CSV из Google Sheets ───────────────────────────────
async function fetchSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка чтения Google Sheets: ${res.status}`);
  return await res.text();
}

// Полный RFC-4180 парсер (поддерживает переносы внутри кавычек)
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

function parseCSV(text) {
  const all = parseCSVFull(text);
  // Данные начинаются со строки где первая колонка — число (п/п)
  return all.filter(row => /^\d+$/.test((row[0] || '').trim()));
}

// Парсим цену: "2 409" → 2409 (пробел — разделитель тысяч)
function parsePrice(s) {
  return parseInt(s.replace(/\s/g, ''), 10);
}

// Парсим толщину: "0,5" или "0.5" → "0.5"
function parseThickness(s) {
  return (s || '').replace(',', '.').trim();
}

// Парсим вес: "12,5" или "12.5" → 12.5 (число)
function parseWeight(s) {
  const n = parseFloat((s || '').replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

// ── 4. Конвертируем в Firestore-формат ──────────────────────────
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

// ── 5. Основная логика ────────────────────────────────────────────
async function main() {
  console.log('🔑 Получаем access token...');
  const token = await getAccessToken();

  console.log('📥 Читаем текущий каталог из Firebase...');
  const currentCatalog = await fetchCurrentCatalog();

  console.log('📊 Загружаем данные из Google Sheets...');
  const csvText = await fetchSheetData();
  const rows = parseCSV(csvText);
  console.log(`   Найдено строк: ${rows.length}`);

  // Строим новый объект моделей поверх существующих
  const updatedModels = { ...currentCatalog.models };

  let updated = 0, added = 0;

  for (const cols of rows) {
    // Столбцы (0-based):
    // A=0:п/п   B=1:Артикул    C=2:Наименование   D=3:ID
    // E=4:Серия  F=5:Вес шкафа  G=6:Высота         H=7:Ширина
    // I=8:Глубина  J=9:Цена   K=10:Толщина корпуса  L=11:Толщина двери
    // M=12:Кол-во замков   N=13:Вес дверей (кг)   O=14:Вес корпуса (кг)

    const id            = cols[3]?.trim();
    const article       = cols[1]?.trim();
    const name          = cols[2]?.trim();
    const seriesRaw     = cols[4]?.trim().toLowerCase(); // "ml" / "ls"
    const totalWeight   = parseWeight(cols[5]);      // F — вес шкафа
    const height        = parseInt(cols[6], 10);
    const width         = parseInt(cols[7], 10);
    const depth         = parseInt(cols[8], 10);
    const basePrice     = parsePrice(cols[9]);
    const bodyThickness = parseThickness(cols[10]);  // K
    const doorThickness = parseThickness(cols[11]);  // L
    const lockCount     = parseWeight(cols[12]);     // M — кол-во замков
    const doorWeight    = parseWeight(cols[13]);     // N — вес дверей
    const bodyWeight    = parseWeight(cols[14]);     // O — вес корпуса

    if (!id || isNaN(height) || isNaN(basePrice)) continue;

    const existing = updatedModels[id];

    // Сохраняем поля которых нет в таблице (замок, вентиляция, цвета)
    const existingSpecs = existing?.defaultSpecs ?? {};

    updatedModels[id] = {
      article,
      name,
      seriesId: seriesRaw,
      basePrice,
      totalWeight,
      lockCount,
      doorWeight,
      bodyWeight,
      defaultSpecs: {
        height,
        width,
        depth,
        bodyThickness,
        doorThickness,
        // Поля не из таблицы — берём из Firebase (или ставим дефолт)
        lockId:        existingSpecs.lockId        ?? 'key_basic',
        ventilation:   existingSpecs.ventilation   ?? false,
        bodyColorName: existingSpecs.bodyColorName ?? 'RAL 7038',
        doorColorName: existingSpecs.doorColorName ?? 'RAL 7038',
      },
    };

    if (existing) updated++;
    else added++;
  }

  console.log(`   Обновлено: ${updated}, добавлено: ${added}`);

  // Строим тело PATCH-запроса — обновляем только поле models
  const body = {
    fields: {
      models: toFirestore(updatedModels),
    },
  };

  console.log('📤 Записываем в Firebase...');
  const res = await fetch(`${FIRESTORE_URL}?updateMask.fieldPaths=models`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ошибка записи в Firestore (${res.status}): ${err}`);
  }

  console.log('✅ Готово! Данные успешно синхронизированы.');
  console.log(`   Всего моделей в каталоге: ${Object.keys(updatedModels).length}`);
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
