import { useState, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ColorPicker from './ColorPicker/ColorPicker';
import CustomSelect from './CustomSelect';
import StepperInput from './StepperInput';
import { useAppContext } from '../../../shared/context/AppContext';
import styles from './Parameters.module.css';

const HEIGHT_MIN = 1400;
const HEIGHT_MAX = 1900;
const DEPTH_MIN = 300;
const WIDTH_RANGE = 50;
const EXTRA_THICKNESS = ['0.5', '0.6', '0.7'];

const STEP_LABELS = ['Серия', 'Комплектация', 'Параметры'];

const slideVariants = {
	initial: dir => ({ x: dir > 0 ? '-45%' : '45%', opacity: 0 }),
	animate: { x: 0, opacity: 1 },
	exit: dir => ({ x: dir > 0 ? '45%' : '-45%', opacity: 0 }),
};

function buildThicknessOptions(baseVal) {
	if (!baseVal || EXTRA_THICKNESS.includes(baseVal)) return EXTRA_THICKNESS;
	return [baseVal, ...EXTRA_THICKNESS];
}

export default function Parameters() {
	const { config, catalog, setters } = useAppContext();
	const {
		setSeriesId,
		onModelChange,
		setWidth,
		setHeight,
		setDepth,
		setBodyThickness,
		setDoorThickness,
		setLockId,
		setVentilation,
		setBodyColor,
		setDoorColor,
		setQuantity,
		onReset,
	} = setters;
	const {
		seriesId,
		modelId,
		width,
		height,
		depth,
		bodyThickness,
		doorThickness,
		lockId,
		ventilation,
		bodyColor,
		doorColor,
		quantity,
	} = config;

	const [stepperStep, setStepperStep] = useState(() => (modelId ? 3 : seriesId ? 2 : 1));
	const [displayStep, setDisplayStep] = useState(() => (modelId ? 3 : seriesId ? 2 : 1));
	const [direction, setDirection] = useState(1);
	const [isSliding, setIsSliding] = useState(false);
	const backAnimTimersRef = useRef([]);

	const [openSelectId, setOpenSelectId] = useState(null);
	const handleSeriesOpen = useCallback(v => setOpenSelectId(v ? 'series' : null), []);
	const handleModelOpen = useCallback(v => setOpenSelectId(v ? 'model' : null), []);

	const stepperStepRef = useRef(stepperStep);
	// eslint-disable-next-line react-hooks/refs -- ref для актуального значения в таймерах goToStep, избегает stale closure
	stepperStepRef.current = stepperStep;

	function goToStep(newStep) {
		if (newStep === stepperStepRef.current) return;
		const prevStep = stepperStepRef.current;
		setIsSliding(true);
		setOpenSelectId(null);
		setDirection(newStep > prevStep ? 1 : -1);
		setStepperStep(newStep);
		setTimeout(() => setIsSliding(false), 450);

		backAnimTimersRef.current.forEach(id => clearTimeout(id));
		backAnimTimersRef.current = [];

		if (newStep < prevStep) {
			const stepsBack = prevStep - newStep;
			for (let i = 1; i <= stepsBack; i++) {
				const intermediate = prevStep - i;
				const timerId = setTimeout(() => setDisplayStep(intermediate), i * 160);
				backAnimTimersRef.current.push(timerId);
			}
		} else {
			const stepsForward = newStep - prevStep;
			for (let i = 1; i <= stepsForward; i++) {
				const intermediate = prevStep + i;
				const timerId = setTimeout(() => setDisplayStep(intermediate), i * 160);
				backAnimTimersRef.current.push(timerId);
			}
		}
	}

	function handleStepClick(step) {
		if (step === 2 && !seriesId) return;
		if (step === 3 && !modelId) return;
		goToStep(step);
	}

	function handleSeriesSelect(newSeriesId) {
		setSeriesId(newSeriesId, () => {
			if (stepperStepRef.current === 1) goToStep(2);
		});
	}

	const modelEntries = seriesId ? Object.entries(catalog.models).filter(([, m]) => m.seriesId === seriesId) : [];
	const lockEntries = Object.entries(catalog.locks).sort((a, b) => a[1].surcharge - b[1].surcharge);
	const currentModel = modelId ? catalog.models[modelId] : null;
	const bodyThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.bodyThickness);
	const doorThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.doorThickness);

	const defaultWidth = currentModel?.defaultSpecs?.width ?? null;
	const minWidth = defaultWidth !== null ? defaultWidth - WIDTH_RANGE : undefined;
	const maxWidth = defaultWidth !== null ? defaultWidth + WIDTH_RANGE : undefined;
	const defaultDepth = currentModel?.defaultSpecs?.depth ?? null;
	const minDepth = defaultDepth !== null ? DEPTH_MIN : undefined;
	const maxDepth = defaultDepth !== null ? defaultDepth : undefined;

	const specs = currentModel?.defaultSpecs;

	function getStepStatus(step) {
		if (step === displayStep) return 'active';
		if (step < displayStep) return 'complete';
		return 'inactive';
	}

	function getCircleStyle(status) {
		if (status === 'active') return { background: 'var(--c-primary)', boxShadow: 'none', transform: 'scale(1.1)' };
		if (status === 'complete') return { background: 'var(--c-primary)', boxShadow: 'none', transform: 'scale(1)' };
		return { background: 'transparent', boxShadow: 'none', transform: 'scale(1)' };
	}

	return (
		<aside className={styles.parameters}>
			<div className={styles.titleRow}>
				<h2 className={styles.title}>Параметры</h2>
				{seriesId && (
					<button type='button' className={styles.resetBtn} onClick={onReset}>
						<span className={styles.resetBtnSign}>
							<svg width='12' height='12' viewBox='0 0 15 15' fill='none'>
								<path d='M2 2l11 11M13 2L2 13' stroke='white' strokeWidth='2.5' strokeLinecap='round' />
							</svg>
						</span>
						<span className={styles.resetBtnText}>Сбросить</span>
					</button>
				)}
			</div>

			<div className={styles.steps}>
				{STEP_LABELS.map((label, i) => {
					const step = i + 1;
					const status = getStepStatus(step);
					const canClick = step === 1 || (step === 2 && !!seriesId) || (step === 3 && !!modelId);

					return (
						<Fragment key={step}>
							<button
								type='button'
								className={styles.stepBtn}
								onClick={() => handleStepClick(step)}
								disabled={!canClick || isSliding}
							>
								<span className={styles.stepLabel} data-status={status}>
									{label}
								</span>
								<motion.div
									className={styles.stepCircle}
									animate={getCircleStyle(status)}
									transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
									style={{ border: status === 'inactive' ? '1.5px solid var(--c-border)' : 'none' }}
								>
									{status === 'complete' ? (
										<svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
											<motion.path
												d='M5 13l4 4L19 7'
												stroke='white'
												strokeWidth={2.5}
												strokeLinecap='round'
												strokeLinejoin='round'
												initial={{ pathLength: 0, opacity: 0 }}
												animate={{ pathLength: 1, opacity: 1 }}
												transition={{ duration: 0.35, ease: 'easeOut' }}
											/>
										</svg>
									) : status === 'active' ? (
										<div className={styles.stepDot} />
									) : (
										<span className={styles.stepNum}>{step}</span>
									)}
								</motion.div>
							</button>

							{i < STEP_LABELS.length - 1 && (
								<div className={styles.stepLineWrap}>
									<motion.div
										className={styles.stepLineFill}
										initial={{ scaleX: displayStep > i + 1 ? 1 : 0 }}
										animate={{ scaleX: displayStep > i + 1 ? 1 : 0 }}
										transition={{ type: 'spring', stiffness: 100, damping: 15 }}
									/>
								</div>
							)}
						</Fragment>
					);
				})}
			</div>

			<div className={styles.stepContent} style={{ overflow: isSliding ? 'hidden' : 'visible' }}>
				<AnimatePresence initial={false} custom={direction} mode='popLayout'>
					<motion.div
						key={stepperStep}
						custom={direction}
						variants={slideVariants}
						initial='initial'
						animate='animate'
						exit='exit'
						transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
						style={{ width: '100%' }}
					>
						{stepperStep === 1 && (
							<div className={styles.stepPane}>
								<div className={styles.paramGroup}>
									<label className={styles.groupLabel} htmlFor='series'>
										Серия шкафа
									</label>
									<CustomSelect
										id='series'
										value={seriesId}
										onChange={handleSeriesSelect}
										placeholder='Выберите серию'
										options={catalog.series.map(s => ({ value: s.id, label: s.name }))}
										isOpen={openSelectId === 'series'}
										onOpenChange={handleSeriesOpen}
									/>
									{!seriesId && <p className={styles.hint}>Начните с выбора серии шкафа</p>}
								</div>
							</div>
						)}

						{stepperStep === 2 && (
							<div className={styles.stepPane}>
								<div className={styles.paramGroup}>
									<label className={styles.groupLabel} htmlFor='model'>
										Модель шкафа
									</label>
									<CustomSelect
										id='model'
										value={modelId}
										onChange={onModelChange}
										placeholder='Выберите модель'
										options={modelEntries.map(([id, m]) => ({ value: id, label: m.name }))}
										isOpen={openSelectId === 'model'}
										onOpenChange={handleModelOpen}
									/>
									{!modelId && <p className={styles.hint}>Теперь выберите модель шкафа</p>}
								</div>
								<AnimatePresence>
									{modelId && (
										<motion.div
											className={styles.modelExtra}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: 10 }}
											transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
										>
											<div className={styles.paramGroup}>
												<label className={styles.groupLabel} htmlFor='quantity'>
													Количество шкафов (шт.)
												</label>
												<StepperInput
													id='quantity'
													value={String(quantity)}
													min={1}
													max={300}
													step={1}
													onChange={v => setQuantity(Number(v))}
													defaultValue={10}
													editable
												/>
											</div>
											<button type='button' className={styles.nextBtn} onClick={() => goToStep(3)}>
												Перейти к параметрам
											</button>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}

						{stepperStep === 3 && (
							<div className={styles.stepPane}>
								<div className={styles.paramGroup}>
									<span className={styles.groupLabel}>Изменение габаритов</span>
									<div className={styles.dimFields}>
										<div className={styles.paramGroup}>
											<label className={`${styles.groupLabel} ${styles.groupLabelSm}`} htmlFor='width'>
												Ширина (мм)
											</label>
											<StepperInput
												id='width'
												value={width}
												min={minWidth}
												max={maxWidth}
												onChange={setWidth}
												modified={!!specs && String(width) !== String(specs.width)}
												defaultValue={specs?.width}
											/>
										</div>
										<div className={styles.paramGroup}>
											<label className={`${styles.groupLabel} ${styles.groupLabelSm}`} htmlFor='height'>
												Высота (мм)
											</label>
											<StepperInput
												id='height'
												value={height}
												min={HEIGHT_MIN}
												max={HEIGHT_MAX}
												onChange={setHeight}
												modified={!!specs && String(height) !== String(specs.height)}
												defaultValue={specs?.height}
												snaps={[1860]}
											/>
										</div>
										<div className={styles.paramGroup}>
											<label className={`${styles.groupLabel} ${styles.groupLabelSm}`} htmlFor='depth'>
												Глубина (мм)
											</label>
											<StepperInput
												id='depth'
												value={depth}
												min={minDepth}
												max={maxDepth}
												onChange={setDepth}
												modified={!!specs && String(depth) !== String(specs.depth)}
												defaultValue={specs?.depth}
											/>
										</div>
									</div>
								</div>

								<div className={styles.paramsGrid}>
									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Толщина металла корпуса (мм)</span>
										<div className={styles.toggleGroup}>
											{bodyThicknessOptions.map(t => (
												<button
													key={t}
													className={`${styles.toggleBtn}${bodyThickness === t ? ` ${styles.toggleBtnActive}` : ''}`}
													onClick={() => setBodyThickness(t)}
												>
													{t}
												</button>
											))}
										</div>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Толщина металла двери (мм)</span>
										<div className={styles.toggleGroup}>
											{doorThicknessOptions.map(t => (
												<button
													key={t}
													className={`${styles.toggleBtn}${doorThickness === t ? ` ${styles.toggleBtnActive}` : ''}`}
													onClick={() => setDoorThickness(t)}
												>
													{t}
												</button>
											))}
										</div>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Выбор замка</span>
										<ul className={styles.lockList}>
											{lockEntries.map(([id, lock]) => (
												<li key={id}>
													<button
														className={`${styles.lockItem}${lockId === id ? ` ${styles.lockItemActive}` : ''}`}
														onClick={() => setLockId(id)}
													>
														<span className={styles.lockName}>{lock.name}</span>
													</button>
												</li>
											))}
										</ul>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Дополнительная вентиляция шкафа</span>
										<div className={styles.ventToggle}>
											<button
												className={`${styles.ventBtn}${ventilation ? ` ${styles.ventBtnActive}` : ''}`}
												onClick={() => setVentilation(true)}
											>
												Да
											</button>
											<button
												className={`${styles.ventBtn}${!ventilation ? ` ${styles.ventBtnActive}` : ''}`}
												onClick={() => setVentilation(false)}
											>
												Нет
											</button>
										</div>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Изменение цвета корпуса</span>
										<ColorPicker placeholder='Стандартный цвет' selected={bodyColor} onSelect={setBodyColor} />
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Изменение цвета двери</span>
										<ColorPicker placeholder='Стандартный цвет' selected={doorColor} onSelect={setDoorColor} />
									</div>
								</div>
							</div>
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</aside>
	);
}
