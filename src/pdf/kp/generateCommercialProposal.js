import { fillCommercialProposalTemplate } from './fillCommercialProposalTemplate.js';

export function getCommercialProposalFilename(model, date = new Date()) {
  const article = model?.article ?? 'КП';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${article}_${yyyy}-${mm}-${dd}_КП.pdf`;
}

export async function generateCommercialProposal({ config, catalog, price }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const filename = getCommercialProposalFilename(model, new Date());

  const doc = await fillCommercialProposalTemplate({ config, catalog, price });
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
