
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { buildNonStandardOrderParams } from '../../shared/utils/buildNonStandardOrderParams.js';

const CDN       = 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest';
const CDN_ARIAL = 'https://cdn.jsdelivr.net/fontsource/fonts/arimo@latest';
const BLACK = rgb(0, 0, 0);

const X_VALUE   = 290;

const X_NT_ART  = 92;
const X_NT_NAME = 160;
const X_NT_QTY   = 279;
const X_NT_PRICE      = 313;
const Y_NT_PRICE      = 422;
const Y_NT_PRICE_RUB  = 412;
const X_NT_PRICE_PPS  = 305;
const Y_NT_PRICE_PPS  = 423;
const Y_NT_PRICE_PPS2 = 413;

const X_NZ_NUMBER   = 437;
const Y_NZ_NUMBER   = 599.5;
const X_CALC_NUMBER = 332;
const Y_CALC_NUMBER = 587;

const Y_ROW1  = 543;
const Y_ROW2  = 526;
const Y_NT_ART  = 418;
const Y_NT_NAME = 430;
const Y_ROW6  = 220;
const Y_ROW6_STEP = 14;

async function fetchFont(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Font fetch failed: ${url}`);
  return resp.arrayBuffer();
}

function isCyr(char) {
  const c = char.charCodeAt(0);
  return (c >= 0x0400 && c <= 0x04FF) || c === 0x0301;
}

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

export async function fillNonStandardOrderTemplate({ config, catalog, managerName, clientName, price, nzNumber, calcNumber }) {

  const templateBytes = await fetch('/templates/nz/nz-template.pdf').then(r => {
    if (!r.ok) throw new Error('Не удалось загрузить /templates/nz/nz-template.pdf');
    return r.arrayBuffer();
  });

  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);

  const [cyrBytes, cyrBoldBytes, latBytes, latBoldBytes, arimoBytes, arimoBoldBytes] = await Promise.all([
    fetchFont(`${CDN}/cyrillic-400-normal.ttf`),
    fetchFont(`${CDN}/cyrillic-700-normal.ttf`),
    fetchFont(`${CDN}/latin-400-normal.ttf`),
    fetchFont(`${CDN}/latin-700-normal.ttf`),
    fetchFont(`${CDN_ARIAL}/latin-400-normal.ttf`),
    fetchFont(`${CDN_ARIAL}/latin-700-normal.ttf`),
  ]);

  const [cyrFont, cyrBold, latFont, latBold, arimoFont, arimoBold] = await Promise.all([
    doc.embedFont(cyrBytes),
    doc.embedFont(cyrBoldBytes),
    doc.embedFont(latBytes),
    doc.embedFont(latBoldBytes),
    doc.embedFont(arimoBytes),
    doc.embedFont(arimoBoldBytes),
  ]);

  const draw = (text, x, y, size = 9, bold = false) =>
    drawMixed(doc.getPages()[0], text, x, y, size, bold ? cyrBold : cyrFont, bold ? latBold : latFont);

  const drawArial = (text, x, y, size, bold = false) => {
    const font = bold ? arimoBold : arimoFont;
    if (!text && text !== 0) return;
    doc.getPages()[0].drawText(String(text), { x, y, size, font, color: BLACK });
  };

  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const params = buildNonStandardOrderParams(config, catalog);
  const qty = config.quantity ?? 1;

  if (nzNumber) drawArial(nzNumber, X_NZ_NUMBER, Y_NZ_NUMBER, 15.5, true);
  if (calcNumber) drawArial(calcNumber, X_CALC_NUMBER, Y_CALC_NUMBER, 10);

  draw(managerName, X_VALUE, Y_ROW1);

  draw(clientName, X_VALUE, Y_ROW2);

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
  if (price && !price.manual) {
    draw(price.clientPrice.toLocaleString('ru-RU'), X_NT_PRICE, Y_NT_PRICE, 8);
    draw('руб.', X_NT_PRICE, Y_NT_PRICE_RUB, 8);
  } else {
    draw('ППС по', X_NT_PRICE_PPS, Y_NT_PRICE_PPS, 8);
    draw('согласованию', X_NT_PRICE_PPS, Y_NT_PRICE_PPS2, 8);
  }

  const nzParams = params.filter(p => p.isNonStandard);
  let py = Y_ROW6;
  for (const p of nzParams) {
    draw(`${p.label}: ${p.value}`, X_VALUE, py, 9);
    py -= Y_ROW6_STEP;
  }

  const DEBUG = false;
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
