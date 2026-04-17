export function calcPrice(config, catalog) {
  const model = catalog.models[config.modelId];
  if (!model) return null;

  const lockSurcharge = catalog.locks[config.lockId]?.surcharge ?? 0;
  const ventSurcharge = config.ventilation ? catalog.ventSurcharge : 0;
  const bodyColorSurcharge = config.bodyColor?.surcharge ?? 0;
  const doorColorSurcharge = config.doorColor?.surcharge ?? 0;
  const bodyThicknessSurcharge = catalog.thicknessSurcharges?.[config.bodyThickness] ?? 0;
  const doorThicknessSurcharge = catalog.thicknessSurcharges?.[config.doorThickness] ?? 0;

  const unitPrice =
    model.basePrice +
    lockSurcharge +
    ventSurcharge +
    bodyColorSurcharge +
    doorColorSurcharge +
    bodyThicknessSurcharge +
    doorThicknessSurcharge;

  return unitPrice * (config.quantity ?? 1);
}
