export const COLORS = [
	{
		group: '1 категория — Базовые',
		cat: 'cat1',
		items: [
			{ color: '#b5b8b1', name: 'RAL 7038', cat: 'cat1' },
			{ color: '#3E4B86', name: '5002 шагрень', cat: 'cat1' },
			{ color: '#EEEFED', name: '9003 гладкая', cat: 'cat1' },
			{ color: '#C8CBC9', name: '7035 муар', cat: 'cat1' },
			{ color: '#4C5054', name: '7016 гладкая', cat: 'cat1' },
		],
	},
	{
		group: '2 категория — Популярные',
		cat: 'cat2',
		items: [
			{ color: '#629F49', name: 'RAL 6018', cat: 'cat2' },
			{ color: '#428EBA', name: 'RAL 5012', cat: 'cat2' },
			{ color: '#A8403E', name: 'RAL 3000', cat: 'cat2' },
		],
	},
	{
		group: '3 категория — Яркие',
		cat: 'cat3',
		items: [
			{ color: '#ECE434', name: 'RAL 1016', cat: 'cat3' },
			{ color: '#F3D146', name: 'RAL 1018', cat: 'cat3' },
			{ color: '#97467E', name: 'RAL 4006', cat: 'cat3' },
			{ color: '#E9723A', name: 'RAL 2008', cat: 'cat3' },
		],
	},
];

const colorMap = new Map(COLORS.flatMap(g => g.items.map(i => [i.name, i.color])));
export function getColorHex(name) {
	return colorMap.get(name) ?? null;
}
