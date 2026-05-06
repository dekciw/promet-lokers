/**
 * Генерация и скачивание PDF «Бланк нестандартного заказа».
 *
 * Все импорты из @react-pdf/renderer — здесь и в NZDocument.jsx.
 * Этот файл НЕ должен импортироваться статически из src/modules или src/shared
 * — иначе initial bundle вырастет на ~500 kB (PERF_3).
 *
 * Использовать через динамический import:
 *   const { generateNZ } = await import('../pdf/generateNZ.js');
 */
import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import './fonts.js'; // side-effect: Font.register() — выполняется один раз
import NZDocument from './NZDocument.jsx';

/**
 * Чистая функция формирования имени файла.
 * Экспортируется отдельно для unit-тестов (DOC_5).
 *
 * @param {object|null} model — объект модели с полем article
 * @param {Date} date — дата (по умолчанию сегодня)
 * @returns {string} — имя файла вида {article}_{YYYY-MM-DD}.pdf
 */
export function getNZFilename(model, date = new Date()) {
  const article = model?.article ?? 'НЗ';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${article}_${yyyy}-${mm}-${dd}.pdf`;
}

/**
 * Генерирует PDF и инициирует скачивание без print-диалога.
 *
 * @param {object} args
 * @param {object} args.config — текущая конфигурация
 * @param {object} args.catalog — каталог из Firebase
 * @param {string} args.managerName — Ф.И.О. менеджера (из popup)
 * @param {string} args.clientName — название клиента (из popup)
 * @returns {Promise<void>}
 */
export async function generateNZ({ config, catalog, managerName, clientName }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const filename = getNZFilename(model, new Date());

  const element = createElement(NZDocument, {
    config, catalog, managerName, clientName,
  });

  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Firefox требует задержку перед revoke
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
