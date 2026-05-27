import { fillNonStandardOrderTemplate } from './fillNonStandardOrderTemplate.js';
import { printPdfBlob } from '../utils/printPdfBlob.js';

export function getNonStandardOrderFilename(model, date = new Date()) {
  const article = model?.article ?? 'НЗ';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${article}_${yyyy}-${mm}-${dd}.pdf`;
}

async function buildBlob({ config, catalog, managerName, clientName, price, nzNumber, calcNumber }) {
  const doc = await fillNonStandardOrderTemplate({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

export async function generateNonStandardOrder({ config, catalog, managerName, clientName, price, nzNumber, calcNumber }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const filename = getNonStandardOrderFilename(model, new Date());

  const blob = await buildBlob({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function printNonStandardOrder({ config, catalog, managerName, clientName, price, nzNumber, calcNumber }) {
  const blob = await buildBlob({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
  printPdfBlob(blob);
}
