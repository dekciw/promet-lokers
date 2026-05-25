import { PDFDocument, rgb, pushGraphicsState, popGraphicsState, moveTo, lineTo, closePath, clip, endPath, PDFOperator, PDFNumber } from 'pdf-lib';

const curveTo = (x1, y1, x2, y2, x3, y3) =>
  PDFOperator.of('c', [x1, y1, x2, y2, x3, y3].map(PDFNumber.of));
import fontkit from '@pdf-lib/fontkit';

// ─── Цвета RAL ────────────────────────────────────────────────────────────
const KP_COLOR_DATA = {
  'RAL 7038':     { hex: '#B4B8B0', ralCode: 'RAL 7038', name: 'Агатовый серый' },
  '5002 шагрень': { hex: '#2B2C7C', ralCode: 'RAL 5002', name: 'Ультрамариново-синий' },
  '9003 гладкая': { hex: '#F4F8F4', ralCode: 'RAL 9003', name: 'Сигнальный белый' },
  '7035 муар':    { hex: '#CBD0CC', ralCode: 'RAL 7035', name: 'Светло-серый' },
  '7016 гладкая': { hex: '#373F43', ralCode: 'RAL 7016', name: 'Антрацитово-серый' },
  'RAL 6018':     { hex: '#48A43F', ralCode: 'RAL 6018', name: 'Желто-зелёный' },
  'RAL 5012':     { hex: '#3481B8', ralCode: 'RAL 5012', name: 'Голубой' },
  'RAL 3000':     { hex: '#AB2524', ralCode: 'RAL 3000', name: 'Огненно-красный' },
  'RAL 1016':     { hex: '#EAF044', ralCode: 'RAL 1016', name: 'Жёлтая сера' },
  'RAL 1018':     { hex: '#F3E03B', ralCode: 'RAL 1018', name: 'Цинково-жёлтый' },
  'RAL 4006':     { hex: '#992572', ralCode: 'RAL 4006', name: 'Транспортный пурпурный' },
  'RAL 2008':     { hex: '#F3752C', ralCode: 'RAL 2008', name: 'Ярко-красно-оранжевый' },
};
const DEFAULT_COLOR_KEY = 'RAL 7038';

// ─── Координаты ───────────────────────────────────────────────────────────
const X_CATEGORY = 40;
const Y_CATEGORY = 722;

const X_SERIES = 286;
const Y_SERIES = 722;

const X_MODEL = 370;
const Y_MODEL = 722;
const MODEL_MAX_WIDTH = 205;
const MODEL_LINE_HEIGHT = 12;

// ЦВЕТ ДВЕРИ
const X_DOOR_COLOR = 279;
const Y_DOOR_COLOR = 530;

// ЦВЕТ КОРПУСА
const X_BODY_COLOR = 406;
const Y_BODY_COLOR = 530;

// ГАБАРИТЫ
const X_DIMS = 481;
const Y_DIMS = 480.6;

// ЗАМОК
const X_LOCK = 481;
const Y_LOCK = 455.6;

const LOCK_X = {
  key_basic:         463,
  praktik_el_code:   451,
  praktik_el_mifare: 447,
  d111x:             420.3,
  euro_locks:        455,
};

const LOCK_Y = {
  key_basic:         Y_LOCK + 1.6,
  praktik_el_code:   Y_LOCK + 1.6,
  praktik_el_mifare: Y_LOCK + 1.6,
  d111x:             Y_LOCK + 1.6,
  euro_locks:        Y_LOCK + 1.6,
};

// КОЛИЧЕСТВО
const X_QTY = 530;
const Y_QTY = Y_LOCK - 23.4;

// ЦЕНА ЗА 1 ШТ
const X_PRICE = 281;
const Y_PRICE = Y_QTY - 24;

// ML-1 — НЕСТАНДАРТНЫЕ ПАРАМЕТРЫ
const X_BODY_THICKNESS_1 = 481;
const Y_BODY_THICKNESS_1 = Y_PRICE - 24;
const X_BODY_THICKNESS_VAL_1 = X_BODY_THICKNESS_1 + 49;

const X_DOOR_THICKNESS_1     = X_BODY_THICKNESS_1;     // подтверждено
const Y_DOOR_THICKNESS_1     = Y_BODY_THICKNESS_1;     // подтверждено
const X_DOOR_THICKNESS_VAL_1 = X_BODY_THICKNESS_VAL_1; // подтверждено

const X_VENTILATION_1        = X_BODY_THICKNESS_1;
const Y_VENTILATION_1        = Y_BODY_THICKNESS_1;
const X_VENTILATION_VAL_1    = X_BODY_THICKNESS_VAL_1;
const VENT_VAL_OFFSET_X      = -135;
const VENT_VAL_OFFSET_Y      = 20;   // подтверждено
const VENT_LABEL_OFFSET_Y    = 15;   // подтверждено (val - 5)

// ФОТО МОДЕЛИ — бокс, фото вписывается по центру не выходя за края
const PHOTO_BOX = { x: 0, y: 260, w: 260, h: 420 };

// ФОТО ЗАМКА — бокс в нижней рамке КП
const LOCK_PHOTO_BOX = { x: 326, y: 135, w: 185, h: 125 };

// Маппинг lockId → имя файла в /img/locks/
const LOCK_IMAGE_MAP = {
  praktik_el_code:   'Замок_Практик_EL_code.jpg',
  praktik_el_mifare: 'Замок_Практик_EL_Mifare.jpg',
  euro_locks:        'Замок_Euro_Locks_A129.jpg',
  // key_basic и d111x — картинок нет, пропускаем
};

// Индивидуальные боксы для конкретных моделей (переопределяют PHOTO_BOX)
const PHOTO_BOX_OVERRIDE = {
  '54449': { x: -130, y: 50, w: 520, h: 840 }, // ML-21-80 U — в 2 раза больше
};

// ПРАВАЯ СТЕНКА (текст не должен выходить правее)
const FRAME_RIGHT_X = 546;
const COLOR_CIRCLE_R = 19;     // радиус кружка
const COLOR_TEXT_GAP = 6;      // отступ текста от правого края кружка
const COLOR_LINE_GAP = 9;      // межстрочный интервал между строками названия
const COLOR_RAL_GAP = 13;      // отступ от RAL-кода до первой строки названия

// ─── Вспомогательные ──────────────────────────────────────────────────────

async function fetchFont(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Font fetch failed: ${url}`);
  return resp.arrayBuffer();
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

// ─── Основная функция ─────────────────────────────────────────────────────

export async function fillCommercialProposalTemplate({ config, catalog, price }) {
  const modelDefaults = config.modelId ? catalog.models?.[config.modelId]?.defaultSpecs : null;

  const nonStandardCount = [
    config.ventilationType,
    modelDefaults && Number(config.bodyThickness) !== Number(modelDefaults.bodyThickness),
    modelDefaults && Number(config.doorThickness) !== Number(modelDefaults.doorThickness),
  ].filter(Boolean).length;

  const isLS = config.seriesId?.toLowerCase() === 'ls';
  const seriesPrefix = isLS ? 'LS' : 'ML';

  const templateFile = nonStandardCount === 0 ? `/templates/kp/${seriesPrefix}-0.pdf`
    : nonStandardCount === 1 ? `/templates/kp/${seriesPrefix}-1.pdf`
    : nonStandardCount === 2 ? `/templates/kp/${seriesPrefix}-2.pdf`
    : `/templates/kp/${seriesPrefix}-3.pdf`;

  const isMl1 = nonStandardCount === 1;
  const isMl2 = nonStandardCount === 2;
  const isMl3 = nonStandardCount >= 3;

  const templateBytes = await fetch(templateFile).then(r => {
    if (!r.ok) throw new Error(`Не удалось загрузить ${templateFile}`);
    return r.arrayBuffer();
  });

  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);

  const MONT = 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest';
  const INTER = 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest';

  const [cyrBytes, latBytes, interCyrBytes, interLatBytes] = await Promise.all([
    fetchFont(`${MONT}/cyrillic-700-normal.ttf`),
    fetchFont(`${MONT}/latin-700-normal.ttf`),
    fetchFont(`${INTER}/cyrillic-500-normal.ttf`),
    fetchFont(`${INTER}/latin-500-normal.ttf`),
  ]);

  const [cyrFont, latFont, interCyr, interLat] = await Promise.all([
    doc.embedFont(cyrBytes),
    doc.embedFont(latBytes),
    doc.embedFont(interCyrBytes),
    doc.embedFont(interLatBytes),
  ]);

  const page = doc.getPages()[0];
  const WHITE      = rgb(1, 1, 1);
  const BLACK      = rgb(0, 0, 0);
  const GRAY_NAME  = hexToRgb('#9d9d9c');
  const GRAY_PRICE = hexToRgb('#9d9d9c');
  const FONT_SIZE  = 10;

  function isCyr(char) {
    const c = char.charCodeAt(0);
    return (c >= 0x0400 && c <= 0x04FF) || c === 0x20BD;
  }

  // Montserrat Bold — смешанный текст (белый, для заголовков)
  function drawMixed(text, x, y, size = FONT_SIZE, color = WHITE) {
    if (!text) return;
    const str = String(text);
    let currentX = x;
    let seg = '';
    let segIsCyr = null;

    const flush = () => {
      if (!seg) return;
      const font = segIsCyr ? cyrFont : latFont;
      page.drawText(seg, { x: currentX, y, size, font, color });
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

  function interFontFor(char) {
    const c = char.charCodeAt(0);
    if (c >= 0x0400 && c <= 0x04FF) return interCyr;
    return interLat;
  }

  // Рисует ₽ вручную: «Р» из шрифта + одна горизонтальная черта внизу буквы
  function drawRubleSign(x, y, size, color) {
    page.drawText('Р', { x, y, size, font: interCyr, color });
    const capH = size * 0.68;
    const barW  = size * 0.44;
    const barT  = Math.max(0.5, size * 0.085);
    page.drawLine({ start: { x: x - 0.4, y: y + capH * 0.19 }, end: { x: x + barW, y: y + capH * 0.19 }, color, thickness: barT });
  }

  // Inter Medium — смешанный текст (для цветовых меток)
  function drawInterMixed(text, x, y, size = 8, color = BLACK) {
    if (!text) return;
    const str = String(text);
    let currentX = x;
    let seg = '';
    let segFont = null;

    const flush = () => {
      if (!seg) return;
      page.drawText(seg, { x: currentX, y, size, font: segFont, color });
      currentX += segFont.widthOfTextAtSize(seg, size);
      seg = '';
    };

    for (const ch of str) {
      if (ch === '₽') {
        flush();
        drawRubleSign(currentX, y, size, color);
        currentX += interCyr.widthOfTextAtSize('Р', size);
        continue;
      }
      if (ch === '-') {
        flush();
        const advW = 0.4625 * size;
        const barW = 0.32 * size;
        const barY = y + 0.28 * size;
        const barT = Math.max(0.5, 0.09 * size);
        page.drawLine({ start: { x: currentX + (advW - barW) / 2, y: barY }, end: { x: currentX + (advW - barW) / 2 + barW, y: barY }, color, thickness: barT });
        currentX += advW;
        continue;
      }
      if (ch === '/') {
        flush();
        const advW = 0.37 * size;
        const barT = Math.max(0.5, 0.09 * size);
        page.drawLine({ start: { x: currentX + advW * 0.1, y: y + 0.02 * size }, end: { x: currentX + advW * 0.9, y: y + 0.64 * size }, color, thickness: barT });
        currentX += advW;
        continue;
      }
      if (ch === '×') {
        flush();
        const advW = 0.52 * size;
        const cx = currentX + advW / 2;
        const cy = y + 0.28 * size;
        const half = 0.18 * size;
        const barT = Math.max(0.5, 0.085 * size);
        page.drawLine({ start: { x: cx - half, y: cy - half }, end: { x: cx + half, y: cy + half }, color, thickness: barT });
        page.drawLine({ start: { x: cx - half, y: cy + half }, end: { x: cx + half, y: cy - half }, color, thickness: barT });
        currentX += advW;
        continue;
      }
      const f = interFontFor(ch);
      if (segFont !== null && f !== segFont) flush();
      seg += ch;
      segFont = f;
    }
    flush();
  }

  function wrapText(text, maxWidth, size) {
    const words = String(text).split(' ');
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

  function measureInterMixed(text, size) {
    let total = 0;
    let seg = '';
    let segFont = null;
    const flush = () => {
      if (!seg) return;
      total += segFont.widthOfTextAtSize(seg, size);
      seg = '';
    };
    for (const ch of String(text)) {
      if (ch === '₽') {
        flush();
        total += interCyr.widthOfTextAtSize('Р', size);
        continue;
      }
      const f = interFontFor(ch);
      if (segFont !== null && f !== segFont) flush();
      seg += ch;
      segFont = f;
    }
    flush();
    return total;
  }

  function clampX(x, text, size, gap = 3) {
    const w = measureInterMixed(text, size);
    return x + w > FRAME_RIGHT_X - gap ? FRAME_RIGHT_X - gap - w : x;
  }

  function wrapInterText(text, maxWidth, size) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const testW = interCyr.widthOfTextAtSize(test, size);
      if (testW > maxWidth && line) {
        lines.push(line);
        line = word;
      } else if (!line && interCyr.widthOfTextAtSize(word, size) > maxWidth && word.includes('-')) {
        const parts = word.split('-');
        let seg = '';
        for (let i = 0; i < parts.length; i++) {
          const part = i > 0 ? '-' + parts[i] : parts[i];
          const segTest = seg ? seg + part : part;
          if (interCyr.widthOfTextAtSize(segTest, size) > maxWidth && seg) {
            lines.push(seg);
            seg = part;
          } else {
            seg = segTest;
          }
        }
        line = seg;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // Кружок + RAL-код + название цвета
  // x, y — левый центр блока (центр кружка по Y); nameMaxWidth — макс. ширина строки названия
  function drawColorBlock(colorKey, x, y, nameMaxWidth = 120, textYOffset = 0) {
    const data = KP_COLOR_DATA[colorKey] ?? KP_COLOR_DATA[DEFAULT_COLOR_KEY];

    page.drawEllipse({
      x: x + COLOR_CIRCLE_R,
      y,
      xScale: COLOR_CIRCLE_R,
      yScale: COLOR_CIRCLE_R,
      color: hexToRgb(data.hex),
      borderColor: hexToRgb('#777777'),
      borderWidth: 0.2,
    });

    const textX = x + COLOR_CIRCLE_R * 2 + COLOR_TEXT_GAP;
    const textY = y + 2 + textYOffset;

    drawInterMixed(data.ralCode, textX, textY, 8, BLACK);

    const nameLines = wrapInterText(data.name, nameMaxWidth, 8);
    nameLines.forEach((line, i) => {
      drawInterMixed(line, textX, textY - COLOR_RAL_GAP - i * COLOR_LINE_GAP, 8, GRAY_NAME);
    });
  }

  // ── Данные ──
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const seriesLabel = config.seriesId?.toUpperCase() ?? '';
  const doorColorKey = config.doorColor?.name ?? DEFAULT_COLOR_KEY;
  const bodyColorKey = config.bodyColor?.name ?? DEFAULT_COLOR_KEY;

  // ── Поля ──
  drawMixed('ШКАФЫ ДЛЯ РАЗДЕВАЛОК', X_CATEGORY, Y_CATEGORY);
  drawMixed(seriesLabel, X_SERIES, Y_SERIES);

  const modelLines = wrapText((model?.name ?? '').toUpperCase(), MODEL_MAX_WIDTH, FONT_SIZE);
  modelLines.forEach((line, i) => {
    drawMixed(line, X_MODEL, Y_MODEL - i * MODEL_LINE_HEIGHT);
  });

  const isNonStd = isMl1 || isMl2 || isMl3;
  const colorTextOffset = isNonStd ? 4 : 0;

  // Цвет двери (узкий лимит — рядом второй блок)
  drawColorBlock(doorColorKey, X_DOOR_COLOR, Y_DOOR_COLOR, 75, colorTextOffset);

  // Цвет корпуса
  drawColorBlock(bodyColorKey, X_BODY_COLOR, Y_BODY_COLOR, 120, colorTextOffset);

  // Габариты: ШхВхГ мм
  const w = config.width  || model?.defaultSpecs?.width  || '';
  const h = config.height || model?.defaultSpecs?.height || '';
  const d = config.depth  || model?.defaultSpecs?.depth  || '';
  const dimsText = `${h}×${w}×${d}`;
  const dimsY = isNonStd ? Y_DIMS - 1 : Y_DIMS;
  const dimsX = X_DIMS - 7;
  drawInterMixed(dimsText, dimsX, dimsY, 10, BLACK);

  // Замок — индивидуальная X для каждого замка
  const lockLabel = (catalog.locks?.[config.lockId]?.name ?? '')
    .replace(/\s*([-/])\s*/g, '$1');
  if (lockLabel) {
    const lockX = (LOCK_X[config.lockId] ?? X_LOCK) - 20 + (isNonStd && !isLS && config.lockId === 'd111x' ? 1 : 0) - (isNonStd && !isLS && config.lockId === 'euro_locks' ? 3 : 0) - (isNonStd && !isLS && config.lockId === 'praktik_el_mifare' ? 4 : 0) - (isNonStd && !isLS && config.lockId === 'praktik_el_code' ? 3 : 0) - (isLS && config.lockId === 'euro_locks' ? 3 : 0) - (isLS && config.lockId === 'praktik_el_mifare' ? 5 : 0) - (isLS && config.lockId === 'praktik_el_code' ? 3 : 0) - (!isNonStd && !isLS && config.lockId === 'euro_locks' ? 2 : 0) - (!isNonStd && !isLS && config.lockId === 'praktik_el_mifare' ? 5 : 0) - (!isNonStd && !isLS && config.lockId === 'praktik_el_code' ? 3 : 0);
    const lockY = (LOCK_Y[config.lockId] ?? Y_LOCK) - (isNonStd ? 5 : 0) - (isLS && nonStandardCount === 0 ? 5 : 0);
    drawInterMixed(lockLabel, lockX, lockY, 10, BLACK);
  }

  // Количество — 3 цифры на X_QTY, 1-2 цифры +5 вправо
  const qtyLabel = String(config.quantity ?? 10);
  const qtyX = (qtyLabel.length >= 3 ? X_QTY : X_QTY + 7) - (!isNonStd && !isLS ? 3 : isMl1 ? 3 : (isMl2 || isMl3) ? 3 : (isLS && nonStandardCount === 0) ? 3 : 2);
  const qtyY = isNonStd ? Y_QTY - 6.3 : Y_QTY - (isLS && nonStandardCount === 0 ? 7 : 0);
  drawInterMixed(qtyLabel, qtyX, qtyY, 10, BLACK);

  // ML-1/ML-2 — нестандартные параметры (стек: каждый следующий ниже на ROW_STEP)
  if (isNonStd) {
    const ROW_STEP = 20;
    const baseY = Y_BODY_THICKNESS_1 + 13;
    const ventValX = X_VENTILATION_VAL_1 + VENT_VAL_OFFSET_X;

    const rows = [];
    if (modelDefaults && Number(config.bodyThickness) !== Number(modelDefaults.bodyThickness))
      rows.push({ label: 'Толщина металла корпуса (мм)', value: String(config.bodyThickness) });
    if (modelDefaults && Number(config.doorThickness) !== Number(modelDefaults.doorThickness))
      rows.push({ label: 'Толщина металла двери (мм)', value: String(config.doorThickness) });
    if (config.ventilationType)
      rows.push({ label: 'Вентиляция', value: catalog.priceRules?.ventilation?.[config.ventilationType]?.name ?? config.ventilationType, isVent: true });

    // ML-2: определяем комбинацию
    const hasBody = rows.some(r => r.label.includes('корпуса'));
    const hasDoor = rows.some(r => r.label.includes('двери'));
    const hasVent = rows.some(r => r.isVent);
    const isMl2_BodyDoor = isMl2 && hasBody && hasDoor && !hasVent;
    const isMl2_BodyVent = isMl2 && hasBody && hasVent && !hasDoor;
    const isMl2_DoorVent = isMl2 && hasDoor && hasVent && !hasBody;

    rows.forEach((row, i) => {
      const isDoorRow = row.label.includes('двери');
      const isBodyRow = row.label.includes('корпуса');
      const rowY = baseY - i * ROW_STEP - (isMl3 && row.isVent ? 12 : 0) - (isMl3 && isDoorRow ? 4 : 0) + (isMl3 && isBodyRow ? 2 : 0) + (isMl1 && isDoorRow ? 2 : 0) + (isMl1 && isBodyRow ? 2 : 0) - (isMl2_BodyDoor && isDoorRow ? 6 : 0);
      const labelY = rowY + (row.isVent ? 2 : 0) - (isMl2_DoorVent && row.isVent ? 6 : 0) - (isMl2_BodyVent && row.isVent ? 6 : 0);
      drawInterMixed(row.label, X_PRICE, labelY, 10, GRAY_PRICE);
      if (row.isVent) {
        const ventValY = rowY + (isMl3 ? 7 : isMl1 ? 8 : 0);
        const ventLines = wrapInterText(row.value, FRAME_RIGHT_X - ventValX - 3, 10);
        ventLines.forEach((line, li) => drawInterMixed(line, ventValX, ventValY - li * 12, 10, BLACK));
      } else {
        drawInterMixed(row.value, X_BODY_THICKNESS_VAL_1, rowY - 1.5, 10, BLACK);
      }
    });
  }

  // Цена за 1 шт — метка + значение
  const priceY = isMl3 ? Y_PRICE - 90 : isMl2 ? Y_PRICE - 62 : isMl1 ? Y_PRICE - 37 : Y_PRICE - (isLS && nonStandardCount === 0 ? 7 : 0);
  drawInterMixed('Итоговая цена за 1 шт. (включая НДС)', X_PRICE, priceY, 10, GRAY_PRICE);
  if (price) {
    const priceStr = `${Number(price).toLocaleString('ru-RU')} ₽`;
    drawInterMixed(priceStr, X_PRICE + 228 + (isLS && nonStandardCount >= 1 ? 2 : 0) + (!isNonStd && !isLS ? 1 : 0), priceY, 10, BLACK);
  }

  // Фото модели
  if (config.modelId) {
    try {
      const imgResp = await fetch(`/img/models/${config.modelId}.png`);
      if (imgResp.ok) {
        const imgBytes = await imgResp.arrayBuffer();
        const img = await doc.embedPng(imgBytes);
        const box = PHOTO_BOX_OVERRIDE[config.modelId] ?? PHOTO_BOX;
        const scale = Math.min(box.w / img.width, box.h / img.height);
        const pw = img.width * scale;
        const ph = img.height * scale;
        const px = box.x + (box.w - pw) / 2;
        const py = box.y + (box.h - ph) / 2;
        page.drawImage(img, { x: px, y: py, width: pw, height: ph });
      }
    } catch { /* фото не найдено — пропускаем */ }
  }

  // Фото замка
  const lockImgFile = LOCK_IMAGE_MAP[config.lockId];
  if (lockImgFile) {
    try {
      const imgResp = await fetch(`/img/locks/${lockImgFile}`);
      if (imgResp.ok) {
        const imgBytes = await imgResp.arrayBuffer();
        const isJpeg = lockImgFile.toLowerCase().endsWith('.jpg') || lockImgFile.toLowerCase().endsWith('.jpeg');
        const img = isJpeg ? await doc.embedJpg(imgBytes) : await doc.embedPng(imgBytes);
        const box = LOCK_PHOTO_BOX;
        const scale = Math.min(box.w / img.width, box.h / img.height);
        const pw = img.width * scale;
        const ph = img.height * scale;
        const px = box.x + (box.w - pw) / 2;
        const py = box.y + (box.h - ph) / 2;
        const r = 20;
        const k = 0.5523 * r;
        page.pushOperators(
          pushGraphicsState(),
          moveTo(px + r, py),
          lineTo(px + pw - r, py),
          curveTo(px + pw - r + k, py, px + pw, py + k, px + pw, py + r),
          lineTo(px + pw, py + ph - r),
          curveTo(px + pw, py + ph - r + k, px + pw - r + k, py + ph, px + pw - r, py + ph),
          lineTo(px + r, py + ph),
          curveTo(px + r - k, py + ph, px, py + ph - r + k, px, py + ph - r),
          lineTo(px, py + r),
          curveTo(px, py + r - k, px + r - k, py, px + r, py),
          closePath(),
          clip(),
          endPath(),
        );
        page.drawImage(img, { x: px, y: py, width: pw, height: ph });
        page.pushOperators(popGraphicsState());
      }
    } catch { /* фото замка не найдено — пропускаем */ }
  }

  // ─── DEBUG: координатная сетка ─────────────────────────────────────────
  const DEBUG = false;
  if (DEBUG) {
    const { width, height } = page.getSize();
    const GREEN = rgb(0, 0.78, 0.2);

    // Фотобокс — оранжевая рамка (активный бокс для текущей модели)
    const ORANGE = rgb(1, 0.5, 0);
    const activeBox = PHOTO_BOX_OVERRIDE[config.modelId] ?? PHOTO_BOX;
    page.drawRectangle({ x: activeBox.x, y: activeBox.y, width: activeBox.w, height: activeBox.h, borderColor: ORANGE, borderWidth: 1, opacity: 0 });

    // Бокс замка — синяя рамка
    const BLUE2 = rgb(0, 0.4, 1);
    page.drawRectangle({ x: LOCK_PHOTO_BOX.x, y: LOCK_PHOTO_BOX.y, width: LOCK_PHOTO_BOX.w, height: LOCK_PHOTO_BOX.h, borderColor: BLUE2, borderWidth: 1, opacity: 0 });
    page.drawText(`LOCK x=${LOCK_PHOTO_BOX.x} y=${LOCK_PHOTO_BOX.y} w=${LOCK_PHOTO_BOX.w} h=${LOCK_PHOTO_BOX.h}`, { x: LOCK_PHOTO_BOX.x + 2, y: LOCK_PHOTO_BOX.y + LOCK_PHOTO_BOX.h + 2, size: 6, font: latFont, color: BLUE2 });

    // Правая стенка FRAME_RIGHT_X — зелёная вертикальная линия
    page.drawLine({
      start: { x: FRAME_RIGHT_X, y: 0 },
      end:   { x: FRAME_RIGHT_X, y: height },
      color: GREEN, thickness: 1.2,
    });
    page.drawText(`WALL x=${FRAME_RIGHT_X}`, {
      x: FRAME_RIGHT_X + 2, y: height - 16, size: 7, font: latFont, color: GREEN,
    });
    const RED  = rgb(1, 0, 0);
    const BLUE = rgb(0, 0, 1);
    const GRAY = rgb(0.6, 0.6, 0.6);

    for (let y = 0; y < height; y += 10)
      page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: GRAY, thickness: 0.15, opacity: 0.35 });
    for (let x = 0; x < width; x += 10)
      page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: GRAY, thickness: 0.15, opacity: 0.35 });

    for (let y = 0; y < height; y += 50) {
      page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: BLUE, thickness: 0.4 });
      page.drawText(String(Math.round(y)), { x: 2, y: y + 1, size: 5, font: latFont, color: BLUE });
      page.drawText(String(Math.round(y)), { x: width - 18, y: y + 1, size: 5, font: latFont, color: BLUE });
    }
    for (let x = 0; x < width; x += 50) {
      page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: BLUE, thickness: 0.4 });
      page.drawText(String(Math.round(x)), { x: x + 1, y: 2, size: 5, font: latFont, color: BLUE });
      page.drawText(String(Math.round(x)), { x: x + 1, y: height - 8, size: 5, font: latFont, color: BLUE });
    }
    for (let y = 0; y < height; y += 100) {
      page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: RED, thickness: 0.8 });
      page.drawText(String(Math.round(y)), { x: 2, y: y + 2, size: 7, font: latFont, color: RED });
    }
    for (let x = 0; x < width; x += 100) {
      page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: RED, thickness: 0.8 });
      page.drawText(String(Math.round(x)), { x: x + 1, y: height - 12, size: 7, font: latFont, color: RED });
    }
  }

  return doc;
}
