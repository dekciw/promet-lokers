/**
 * Автоматическая карта: "Название замка" → URL фото
 *
 * Файлы кладите в src/assets/locks/ с именем вида:
 *   "Замок_Euro_Locks_A129.svg"
 *   "Ключевой_(Базовый).svg"
 *
 * Подчёркивания в имени файла заменяются пробелами → должно совпасть с lock.name из каталога.
 */

const _modules = import.meta.glob(
	'../../assets/locks/*.{svg,jpg,jpeg,png,webp}',
	{ eager: true },
);

// Строим карту: "Замок Euro Locks A129" → "/assets/locks/Замок_Euro_Locks_A129.svg"
export const LOCK_PHOTOS = Object.fromEntries(
	Object.entries(_modules).map(([path, mod]) => {
		const filename = path.split('/').pop().replace(/\.[^.]+$/, '');
		const name = filename.replace(/_/g, ' ').trim();
		return [name, mod.default];
	}),
);

function normalizeLockName(s) {
	return s.toLowerCase().replace(/^замок\s+/i, '').replace(/[\s\-_/]+/g, '');
}

/**
 * Возвращает URL фото замка по его имени (из lock.name каталога).
 * Сначала точное совпадение, потом нормализованное (без слешей/дефисов/префикса).
 */
export function getLockPhoto(lockName) {
	if (!lockName) return null;
	if (LOCK_PHOTOS[lockName]) return LOCK_PHOTOS[lockName];

	const normTarget = normalizeLockName(lockName);
	const entry = Object.entries(LOCK_PHOTOS).find(([k]) =>
		normalizeLockName(k) === normTarget,
	);
	if (entry) return entry[1];

	const lower = lockName.toLowerCase();
	const partial = Object.entries(LOCK_PHOTOS).find(([k]) =>
		k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()),
	);
	return partial ? partial[1] : null;
}
