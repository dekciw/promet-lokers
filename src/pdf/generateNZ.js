/**
 * Точка входа для скачивания бланка НЗ.
 *
 * Загружает оригинальный /nz-template.pdf, заполняет поля через pdf-lib
 * и инициирует скачивание без print-диалога.
 *
 * Импортируется лениво из Configurator (PERF_3):
 *   const { generateNZ } = await import('../../../pdf/generateNZ.js');
 */
import { fillNZTemplate } from './fillNZTemplate.js';

/**
 * Имя файла вида {артикул}_{YYYY-MM-DD}.pdf
 * Экспортируется отдельно для unit-тестов.
 */
export function getNZFilename(model, date = new Date()) {
  const article = model?.article ?? 'НЗ';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${article}_${yyyy}-${mm}-${dd}.pdf`;
}

export async function generateNZ({ config, catalog, managerName, clientName, price }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const filename = getNZFilename(model, new Date());

  const doc = await fillNZTemplate({ config, catalog, managerName, clientName, price });
  const bytes = await doc.save();

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
