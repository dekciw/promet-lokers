import { readFileSync, writeFileSync } from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';

const pdf = readFileSync('public/ML-0.pdf');
const doc = await PDFDocument.load(pdf);
const page = doc.getPages()[0];
const { width, height } = page.getSize();

console.log(`Размер страницы: ${width} x ${height} pt`);

const RED  = rgb(1, 0, 0);
const BLUE = rgb(0, 0, 1);
const GRAY = rgb(0.7, 0.7, 0.7);

// Сетка каждые 10pt — серая
for (let y = 0; y < height; y += 10) {
  page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: GRAY, thickness: 0.2, opacity: 0.4 });
}
for (let x = 0; x < width; x += 10) {
  page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: GRAY, thickness: 0.2, opacity: 0.4 });
}

// Линии каждые 50pt — синие, с подписями
for (let y = 0; y < height; y += 50) {
  page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: BLUE, thickness: 0.5 });
  page.drawText(String(Math.round(y)), { x: 2, y: y + 1, size: 5, color: BLUE });
  page.drawText(String(Math.round(y)), { x: width - 18, y: y + 1, size: 5, color: BLUE });
}
for (let x = 0; x < width; x += 50) {
  page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: BLUE, thickness: 0.5 });
  page.drawText(String(Math.round(x)), { x: x + 1, y: 2, size: 5, color: BLUE });
  page.drawText(String(Math.round(x)), { x: x + 1, y: height - 8, size: 5, color: BLUE });
}

// Красные линии каждые 100pt
for (let y = 0; y < height; y += 100) {
  page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: RED, thickness: 1 });
  page.drawText(String(Math.round(y)), { x: 2, y: y + 2, size: 7, color: RED });
}
for (let x = 0; x < width; x += 100) {
  page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: RED, thickness: 1 });
  page.drawText(String(Math.round(x)), { x: x + 1, y: height - 12, size: 7, color: RED });
}

const bytes = await doc.save();
writeFileSync('public/ML-0-debug.pdf', bytes);
console.log('Готово → public/ML-0-debug.pdf');
console.log('ВАЖНО: Y=0 — нижний край страницы, Y растёт вверх');
