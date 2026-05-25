import { fillCommercialProposalTemplate } from './fillCommercialProposalTemplate.js';
import { printPdfBlob } from '../utils/printPdfBlob.js';

export function getCommercialProposalFilename(model, date = new Date()) {
  const article = model?.article ?? 'КП';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${article}_${yyyy}-${mm}-${dd}_КП.pdf`;
}

async function buildBlob({ config, catalog, price }) {
  const doc = await fillCommercialProposalTemplate({ config, catalog, price });
  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

export async function generateCommercialProposal({ config, catalog, price }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const filename = getCommercialProposalFilename(model, new Date());

  const blob = await buildBlob({ config, catalog, price });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function printCommercialProposal({ config, catalog, price }) {
  const blob = await buildBlob({ config, catalog, price });
  printPdfBlob(blob);
}
