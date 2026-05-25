/**
 * Автоматическая карта: "Название модели" → URL фото
 *
 * Файлы кладите в src/assets/photos/ с именем вида:
 *   "26. Шкаф для раздевалок Стандарт LS-41.jpg"
 *    ↑ номер.   ↑ это должно совпадать с model.name в каталоге
 *
 * Vite автоматически обработает их при сборке.
 */

const _modules = import.meta.glob(
	'../../assets/photos/*.{jpg,jpeg,png,webp,avif}',
	{ eager: true },
);

// Строим карту: "Шкаф для раздевалок Стандарт LS-41" → "/assets/photos/26.…jpg"
export const MODEL_PHOTOS = Object.fromEntries(
	Object.entries(_modules).map(([path, mod]) => {
		// Берём имя файла без расширения, убираем ведущий "26. "
		const filename = path.split('/').pop().replace(/\.[^.]+$/, '');
		const name = filename.replace(/^\d+\.\s*/, '').trim();
		return [name, mod.default];
	}),
);

/**
 * Возвращает URL фото для модели по её имени.
 * Сначала ищет точное совпадение, потом частичное.
 */
export function getModelPhoto(modelName) {
	if (!modelName) return null;
	if (MODEL_PHOTOS[modelName]) return MODEL_PHOTOS[modelName];

	// Частичный поиск на случай небольших расхождений в названии
	const lower = modelName.toLowerCase();
	const entry = Object.entries(MODEL_PHOTOS).find(([k]) =>
		k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()),
	);
	return entry ? entry[1] : null;
}
