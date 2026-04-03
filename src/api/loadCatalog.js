const FIRESTORE_URL =
  'https://firestore.googleapis.com/v1/projects/promet-f4543/databases/(default)/documents/catalog/main';

function fromFirestore(value) {
  if ('nullValue' in value)    return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value)  return value.doubleValue;
  if ('stringValue' in value)  return value.stringValue;
  if ('arrayValue' in value)   return (value.arrayValue.values || []).map(fromFirestore);
  if ('mapValue' in value) {
    const obj = {};
    Object.entries(value.mapValue.fields || {}).forEach(([k, v]) => { obj[k] = fromFirestore(v); });
    return obj;
  }
  return null;
}

export async function loadCatalog() {
  const res = await fetch(FIRESTORE_URL);
  if (!res.ok) throw new Error(`Firestore error: ${res.status}`);
  const { fields } = await res.json();
  const catalog = {};
  Object.entries(fields).forEach(([k, v]) => { catalog[k] = fromFirestore(v); });
  return catalog;
}
