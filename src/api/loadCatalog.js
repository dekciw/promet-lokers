const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog/main`;

const CACHE_KEY = 'promet_catalog_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

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

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(catalog) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: catalog }));
  } catch {
    // localStorage недоступен — игнорируем
  }
}

export async function loadCatalog() {
  try {
    const res = await fetch(FIRESTORE_URL);
    if (!res.ok) throw new Error(`Firestore error: ${res.status}`);
    const { fields } = await res.json();
    const catalog = {};
    Object.entries(fields).forEach(([k, v]) => { catalog[k] = fromFirestore(v); });
    setCache(catalog);
    return catalog;
  } catch (err) {
    const cached = getCache();
    if (cached) return cached;
    throw err;
  }
}
