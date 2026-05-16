import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from '../../shared/components/LoadingScreen/LoadingScreen';

export default function LoadingPreviewPage() {
	const [visible, setVisible] = useState(true);

	return (
		<>
			<AnimatePresence mode='wait'>
				{visible && <LoadingScreen key='loading' />}
			</AnimatePresence>

			<div style={{
				position: 'fixed',
				bottom: 32,
				left: '50%',
				transform: 'translateX(-50%)',
				display: 'flex',
				gap: 12,
				zIndex: 10000,
			}}>
				<motion.button
					onClick={() => setVisible(v => !v)}
					whileTap={{ scale: 0.96 }}
					style={{
						padding: '10px 24px',
						background: visible ? '#e53e3e' : '#00359e',
						color: '#fff',
						border: 'none',
						borderRadius: 8,
						fontFamily: 'Inter, sans-serif',
						fontSize: 14,
						fontWeight: 600,
						cursor: 'pointer',
						boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
					}}
				>
					{visible ? 'Симулировать загрузку ✓' : 'Показать снова'}
				</motion.button>
			</div>

			{!visible && (
				<div style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100vh',
					fontFamily: 'Inter, sans-serif',
					fontSize: 18,
					color: '#64748b',
				}}>
					Здесь появилось бы приложение
				</div>
			)}
		</>
	);
}
