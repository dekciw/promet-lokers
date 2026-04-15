import styles from './CatalogSkeleton.module.css';

function Bone({ width, height, radius }) {
	return (
		<div
			className={styles.bone}
			style={{ width, height: height ?? 14, borderRadius: radius }}
		/>
	);
}

function CardRows({ count }) {
	return Array.from({ length: count }, (_, i) => (
		<div key={i} className={styles.row}>
			<Bone width='45%' />
			<Bone width='30%' />
		</div>
	));
}

export default function CatalogSkeleton() {
	return (
		<div className={styles.layout}>
			<div className={styles.configurator}>
				<div className={styles.topRow}>
					<div className={styles.titleBlock}>
						<Bone width={140} height={28} />
						<Bone width={220} height={16} />
					</div>
					<Bone width={90} height={48} radius={8} />
				</div>

			<div className={styles.grid}>
					<div className={styles.card}>
						<Bone width='60%' height={16} />
						<CardRows count={7} />
					</div>
					<div className={styles.card}>
						<Bone width='60%' height={16} />
						<CardRows count={3} />
					</div>
					<div className={`${styles.card} ${styles.cardFinal}`}>
						<Bone width='50%' height={16} />
						<CardRows count={6} />
						<Bone width='100%' height={40} radius={10} />
						<Bone width='100%' height={40} radius={10} />
					</div>
				</div>
			</div>

			<div className={styles.parameters}>
				<Bone width={100} height={24} />
				{Array.from({ length: 5 }, (_, i) => (
					<div key={i} className={styles.paramGroup}>
						<Bone width='50%' height={12} />
						<Bone width='100%' height={42} radius={8} />
					</div>
				))}
			</div>
		</div>
	);
}
