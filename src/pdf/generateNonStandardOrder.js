import { fillNonStandardOrderTemplate } from './fillNonStandardOrderTemplate.js';

export function getNonStandardOrderFilename(model, date = new Date()) {
  const article = model?.article ?? 'НЗ';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${article}_${yyyy}-${mm}-${dd}.pdf`;
}

export async function generateNonStandardOrder({ config, catalog, managerName, clientName, price, nzNumber, calcNumber }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const filename = getNonStandardOrderFilename(model, new Date());

  const doc = await fillNonStandardOrderTemplate({ config, catalog, managerName, clientName, price, nzNumber, calcNumber });
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
