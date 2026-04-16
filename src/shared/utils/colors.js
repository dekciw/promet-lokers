export const COLORS = [
	{
		group: '1 категория — Базовые',
		items: [
			{ color: '#b5b8b1', name: 'RAL 7038' },
			{ color: '#3e4c5e', name: '5002 шагрень' },
			{ color: '#ffffff', name: '9003 гладкая' },
			{ color: '#c5c7c4', name: '7035 муар' },
			{ color: '#373f41', name: '7016 гладкая' },
		],
	},
	{
		group: '2 категория — Популярные',
		items: [
			{ color: '#4c7041', name: 'RAL 6018' },
			{ color: '#2874b2', name: 'RAL 5012' },
			{ color: '#9b111e', name: 'RAL 3000' },
		],
	},
	{
		group: '3 категория — Яркие',
		items: [
			{ color: '#f1eb9c', name: 'RAL 1016' },
			{ color: '#f3e03b', name: 'RAL 1018' },
			{ color: '#8d3f7d', name: 'RAL 4006' },
			{ color: '#d1552c', name: 'RAL 2008' },
		],
	},
];

const colorMap = new Map(COLORS.flatMap(g => g.items.map(i => [i.name, i.color])));
export function getColorHex(name) {
	return colorMap.get(name) ?? null;
}
