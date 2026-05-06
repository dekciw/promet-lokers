/**
 * Заполнение бланка НЗ поверх оригинального PDF-шаблона.
 * Использует pdf-lib: загружает /nz-template.pdf, добавляет текст в нужные ячейки.
 *
 * Координаты — в PDF-пространстве (0,0 = нижний левый угол страницы).
 * Если текст смещён — правьте константы Y_ROW_* и X_*.
 */
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { buildNZParams } from '../shared/utils/buildNZParams.js';

const CDN = 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest';
const BLACK = rgb(0, 0, 0);

// ─── X-координаты (от левого края страницы) ───────────────────────────────
// Разделитель между label-колонкой и data-колонкой ≈ X=295 (по debug-сетке)
const X_VALUE   = 290;  // начало правой колонки данных (строки 1-2, 6)

// Вложенная таблица строки 3 (артикул/наименование/кол-во) — точно из DOCX XML
const X_NT_ART  = 92;   // Артикул
const X_NT_NAME = 160;  // Наименование
const X_NT_QTY  = 279;  // Кол-во

// ─── Y-координаты (от нижнего края страницы) ──────────────────────────────
// Итерация 5: Row1/Row2 — X исправлен до 300, Y без изменений
// Row3: смещаем ниже строки заголовков колонок (были Y=449 — в заголовке)
const Y_ROW1  = 543;  // Менеджер по продажам
const Y_ROW2  = 526;  // Название Клиента
const Y_NT_ART  = 418;  // Артикул и Кол-во по вертикали
const Y_NT_NAME = 430;  // Наименование (начало, с переносом вниз)
const Y_ROW6  = 220;  // Первый параметр в строке 6
const Y_ROW6_STEP = 14; // Межстрочный интервал параметров

// ─── Вспомогательные функции ──────────────────────────────────────────────

async function fetchFont(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Font fetch failed: ${url}`);
  return resp.arrayBuffer();
}

/** Проверяет символ на кириллицу */
function isCyr(char) {
  const c = char.charCodeAt(0);
  return (c >= 0x0400 && c <= 0x04FF) || c === 0x0301;
}

/** Разбивает текст на строки, не превышающие maxWidth */
function wrapText(text, maxWidth, size, cyrFont) {
  if (!text) return [''];
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (cyrFont.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Рисует смешанный текст (кириллица + латиница/цифры).
 * pdf-lib не поддерживает несколько шрифтов в одном вызове,
 * поэтому разбиваем на сегменты.
 */
function drawMixed(page, text, x, y, size, cyrFont, latFont) {
  if (!text && text !== 0) return;
  const str = String(text);
  let currentX = x;
  let seg = '';
  let segIsCyr = null;

  const flush = () => {
    if (!seg) return;
    const font = segIsCyr ? cyrFont : latFont;
    page.drawText(seg, { x: currentX, y, size, font, color: BLACK });
    currentX += font.widthOfTextAtSize(seg, size);
    seg = '';
  };

  for (const ch of str) {
    const c = isCyr(ch);
    if (segIsCyr !== null && c !== segIsCyr) flush();
    seg += ch;
    segIsCyr = c;
  }
  flush();
}

// ─── Основная функция ─────────────────────────────────────────────────────

export async function fillNZTemplate({ config, catalog, managerName, clientName }) {
  // 1. Загружаем шаблон
  const templateBytes = await fetch('/nz-template.pdf').then(r => {
    if (!r.ok) throw new Error('Не удалось загрузить /nz-template.pdf');
    return r.arrayBuffer();
  });

  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);

  // 2. Шрифты — кириллица и латиница параллельно
  const [cyrBytes, cyrBoldBytes, latBytes] = await Promise.all([
    fetchFont(`${CDN}/cyrillic-400-normal.ttf`),
    fetchFont(`${CDN}/cyrillic-700-normal.ttf`),
    fetchFont(`${CDN}/latin-400-normal.ttf`),
  ]);

  const [cyrFont, cyrBold, latFont] = await Promise.all([
    doc.embedFont(cyrBytes),
    doc.embedFont(cyrBoldBytes),
    doc.embedFont(latBytes),
  ]);

  const draw = (text, x, y, size = 9, bold = false) =>
    drawMixed(doc.getPages()[0], text, x, y, size, bold ? cyrBold : cyrFont, latFont);

  // 3. Данные
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const params = buildNZParams(config, catalog);
  const qty = config.quantity ?? 1;

  // 4. Заполняем поля страницы 1
  // Строка 1 — Менеджер
  draw(managerName, X_VALUE, Y_ROW1);

  // Строка 2 — Клиент
  draw(clientName, X_VALUE, Y_ROW2);

  // Строка 3 — Артикул, Наименование, Кол-во
  draw(model?.article ?? '', X_NT_ART, Y_NT_ART, 8);
  const nameMaxWidth = X_NT_QTY - X_NT_NAME - 4;
  const fullName = model?.name ?? '';
  const parenIdx = fullName.indexOf('(');
  const nameParts = parenIdx >= 0
    ? [fullName.slice(0, parenIdx).trim(), fullName.slice(parenIdx).trim()]
    : [fullName];
  let nameY = Y_NT_NAME;
  for (const part of nameParts) {
    if (!part) continue;
    const lines = wrapText(part, nameMaxWidth, 8, cyrFont);
    lines.forEach(line => { draw(line, X_NT_NAME, nameY, 8); nameY -= 10; });
  }
  draw(qty, X_NT_QTY, Y_NT_ART, 8);

  // Строка 6 — только нестандартные параметры
  const nzParams = params.filter(p => p.isNonStandard);
  let py = Y_ROW6;
  for (const p of nzParams) {
    draw(`${p.label}: ${p.value}`, X_VALUE, py, 9);
    py -= Y_ROW6_STEP;
  }

  // 5. DEBUG: сетка координат поверх данных
  const DEBUG = true; // ← переключи в true для калибровки
  if (DEBUG) {
    const page = doc.getPages()[0];
    const { height, width } = page.getSize();
    for (let y = 20; y < height; y += 20) {
      page.drawLine({ start: { x: 0, y }, end: { x: 20, y }, color: rgb(1, 0, 0), thickness: 0.4 });
      page.drawText(String(Math.round(y)), { x: 1, y: y + 1, size: 5, font: latFont, color: rgb(1, 0, 0) });
    }
    for (let x = 20; x < width; x += 20) {
      page.drawLine({ start: { x, y: 0 }, end: { x, y: 20 }, color: rgb(0, 0, 1), thickness: 0.4 });
      page.drawText(String(Math.round(x)), { x: x + 1, y: 1, size: 5, font: latFont, color: rgb(0, 0, 1) });
    }
  }

  return doc;
}
