export const COLORS = [
	{
		group: '1 категория — Базовые',
		cat: 'cat1',
		items: [
			{ color: '#b5b8b1', name: 'RAL 7038', cat: 'cat1' },
			{ color: '#3e4c5e', name: '5002 шагрень', cat: 'cat1' },
			{ color: '#ffffff', name: '9003 гладкая', cat: 'cat1' },
			{ color: '#c5c7c4', name: '7035 муар', cat: 'cat1' },
			{ color: '#373f41', name: '7016 гладкая', cat: 'cat1' },
		],
	},
	{
		group: '2 категория — Популярные',
		cat: 'cat2',
		items: [
			{ color: '#4c7041', name: 'RAL 6018', cat: 'cat2' },
			{ color: '#2874b2', name: 'RAL 5012', cat: 'cat2' },
			{ color: '#9b111e', name: 'RAL 3000', cat: 'cat2' },
		],
	},
	{
		group: '3 категория — Яркие',
		cat: 'cat3',
		items: [
			{ color: '#f1eb9c', name: 'RAL 1016', cat: 'cat3' },
			{ color: '#f3e03b', name: 'RAL 1018', cat: 'cat3' },
			{ color: '#8d3f7d', name: 'RAL 4006', cat: 'cat3' },
			{ color: '#d1552c', name: 'RAL 2008', cat: 'cat3' },
		],
	},
];

const colorMap = new Map(COLORS.flatMap(g => g.items.map(i => [i.name, i.color])));
export function getColorHex(name) {
	return colorMap.get(name) ?? null;
}
