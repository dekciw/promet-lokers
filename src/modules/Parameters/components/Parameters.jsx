import { useState, useRef, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CustomSelect from './CustomSelect';
import ColorPicker from './ColorPicker/ColorPicker';
import StepperInput from './StepperInput';
import { cx } from '../../../shared/utils/cx';
import { useAppContext } from '../../../shared/context/AppContext';
import styles from './Parameters.module.css';


const HEIGHT_MIN = 1400;
const HEIGHT_MAX = 2000;
const HEIGHT_SNAPS = [1800, 1850, 1860, 1900, 2000];
const DEPTH_MIN = 300;
const WIDTH_RANGE = 50;
const EXTRA_THICKNESS = ['0.5', '0.6', '0.7'];

const STEP_LABELS = ['Серия', 'Модель', 'Параметры'];

const slideVariants = {
	initial: dir => ({ x: dir > 0 ? '-45%' : '45%', opacity: 0, scale: 1 }),
	animate: { x: 0, opacity: 1, scale: 1 },
	exit: dir => ({ x: dir > 0 ? '45%' : '-45%', opacity: 0, scale: 1 }),
};

function buildThicknessOptions(baseVal) {
	if (!baseVal || EXTRA_THICKNESS.includes(baseVal)) return EXTRA_THICKNESS;
	return [baseVal, ...EXTRA_THICKNESS];
}

export default function Parameters() {
	const { config, catalog, setters, setParametersUnlocked } = useAppContext();
	const {
		setSeriesId,
		onModelChange,
		setWidth,
		setHeight,
		setDepth,
		setBodyThickness,
		setDoorThickness,
		setLockId,
		setVentilationType,
		setBodyColor,
		setDoorColor,
		setQuantity,
		setProfitability,
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
		ventilationType,
		bodyColor,
		doorColor,
		quantity,
		profitability,
	} = config;

	const [stepperStep, setStepperStep] = useState(() => (modelId ? 3 : seriesId ? 2 : 1));
	const [displayStep, setDisplayStep] = useState(() => (modelId ? 3 : seriesId ? 2 : 1));
	const [direction, setDirection] = useState(1);
	const [isSliding, setIsSliding] = useState(false);
	const backAnimTimersRef = useRef([]);

const [openSelectId, setOpenSelectId] = useState(null);
	const handleSeriesOpen = useCallback(v => setOpenSelectId(v ? 'series' : null), []);
	const handleModelOpen = useCallback(v => setOpenSelectId(v ? 'model' : null), []);
	const handleLockOpen = useCallback(v => setOpenSelectId(v ? 'lock' : null), []);
	const handleVentilationOpen = useCallback(v => setOpenSelectId(v ? 'ventilation' : null), []);
	const handleDoorColorOpen = useCallback(v => setOpenSelectId(v ? 'doorColor' : null), []);
	const handleBodyColorOpen = useCallback(v => setOpenSelectId(v ? 'bodyColor' : null), []);

const stepperStepRef = useRef(stepperStep);
	// eslint-disable-next-line react-hooks/refs -- ref для актуального значения в таймерах goToStep, избегает stale closure
	stepperStepRef.current = stepperStep;

	function goToStep(newStep) {
		if (newStep === stepperStepRef.current) return;
		const prevStep = stepperStepRef.current;
		setParametersUnlocked(newStep === 3);
		setIsSliding(true);
		setOpenSelectId(null);
		setDirection(newStep > prevStep ? 1 : -1);
		startTransition(() => setStepperStep(newStep));
		setTimeout(() => setIsSliding(false), 450);

		backAnimTimersRef.current.forEach(id => clearTimeout(id));
		backAnimTimersRef.current = [];
		setDisplayStep(newStep);
	}

	function handleModelSelect(newModelId) {
		setParametersUnlocked(false);
		onModelChange(newModelId);
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

	const priceRules = catalog.priceRules ?? {};

	const modelEntries = seriesId ? Object.entries(catalog.models).filter(([, m]) => m.seriesId === seriesId) : [];
	const lockEntries = Object.entries(catalog.locks).sort((a, b) => (Number(a[1].perSection) ?? 0) - (Number(b[1].perSection) ?? 0));
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

	const heightModified = !!specs && String(height) !== String(specs.height);
	const depthModified = !!specs && String(depth) !== String(specs.depth);
	const lockModified = !!specs && lockId !== specs.lockId;
	const ventilationModified = ventilationType !== null && ventilationType !== undefined;
	const doorColorModified = doorColor !== null;
	const bodyColorModified = bodyColor !== null;

	function getStepStatus(step) {
		if (step === displayStep) return 'active';
		if (step < displayStep) return 'complete';
		return 'inactive';
	}

function handleFullReset() {
		setSeriesId('');
		setQuantity(10);
		setProfitability(30);
		setParametersUnlocked(false);
		setOpenSelectId(null);
		setDirection(-1);
		startTransition(() => setStepperStep(1));
		setDisplayStep(1);
	}

	return (
		<aside className={styles.parameters}>
			<div className={styles.titleRow}>
				<div className={styles.titleGroup}>
					<img className={styles.titleIcon} src='/img/icons/icon-gear.svg' alt='' width='24' height='24' />
					<h2 className={styles.title}>Параметры</h2>
				</div>
				{seriesId && (
					<motion.button
						type='button'
						className={styles.resetBtn}
						onClick={handleFullReset}
						whileTap={{ scale: 0.96 }}
						transition={{ duration: 0.1 }}
					>
						Сбросить параметры
					</motion.button>
				)}
			</div>

			<div className={styles.breadcrumbs}>
				{STEP_LABELS.map((label, i) => {
					const step = i + 1;
					const status = getStepStatus(step);
					const canClick = step === 1 || (step === 2 && !!seriesId) || (step === 3 && !!modelId);

					return (
						<button
							key={step}
							type='button'
							className={cx(
								styles.breadcrumbBadge,
								status === 'active' && styles.breadcrumbBadgeActive,
								status === 'complete' && styles.breadcrumbBadgeComplete,
							)}
							onClick={() => handleStepClick(step)}
							disabled={!canClick}
						>
							{label}
						</button>
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
										options={(catalog.series ?? []).map(s => ({ value: s.id, label: s.name }))}
										isOpen={openSelectId === 'series'}
										onOpenChange={handleSeriesOpen}
										leftIcon={<img src='/img/icons/icon-series.svg' alt='' width='16' height='16' />}
									/>
									{!seriesId && <p className={styles.hint}>Начните с выбора серии шкафа</p>}
								</div>
							</div>
						)}

						{stepperStep === 2 && (
							<motion.div className={styles.stepPane}>
								<div className={styles.paramGroup}>
									<label className={styles.groupLabel} htmlFor='model'>
										Модель шкафа
									</label>
									<CustomSelect
										id='model'
										value={modelId}
										onChange={handleModelSelect}
										placeholder='Выберите модель'
										options={modelEntries.map(([id, m]) => ({ value: id, label: m.name }))}
										isOpen={openSelectId === 'model'}
										onOpenChange={handleModelOpen}
										leftIcon={<img src='/img/icons/icon-model.svg' alt='' width='16' height='16' />}
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
											<div className={styles.qtyRow}>
												<div className={styles.paramGroup}>
													<label className={styles.groupLabel} htmlFor='quantity'>
														Количество шкафов
													</label>
													<StepperInput
														id='quantity'
														value={String(quantity)}
														min={1}
														max={999}
														step={1}
														onChange={v => setQuantity(Number(v))}
														defaultValue={10}
														editable
													/>
												</div>
												<div className={styles.paramGroup}>
													<label className={styles.groupLabel} htmlFor='profitability'>
														Рентабельность %
													</label>
													<StepperInput
														id='profitability'
														value={String(profitability)}
														min={30}
														max={300}
														step={1}
														onChange={v => setProfitability(Number(v))}
														defaultValue={30}
														editable
													/>
												</div>
											</div>
											<motion.button
												type='button'
												className={styles.nextBtn}
												onClick={() => goToStep(3)}
												whileTap={{ scale: 0.96 }}
												transition={{ duration: 0.1 }}
											>
												Перейти к параметрам
											</motion.button>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)}

						{stepperStep === 3 && (
							<div className={styles.stepPane}>
								<div className={styles.paramGroup}>
									<span className={styles.groupLabel}>Изменение габаритов</span>
									<div className={styles.dimFields}>
										<div className={styles.dimField}>
											<label className={styles.dimLabel} htmlFor='width'>Ширина, мм</label>
											<StepperInput
												id='width'
												value={width}
												min={minWidth}
												max={maxWidth}
												onChange={setWidth}
												defaultValue={specs?.width}
												blocked
											/>
										</div>
										<div className={styles.dimField}>
											<label className={styles.dimLabel} htmlFor='height'>Высота, мм</label>
											<StepperInput
												id='height'
												value={height}
												min={HEIGHT_MIN}
												max={HEIGHT_MAX}
												step={10000}
												onChange={setHeight}
												modified={heightModified}
												defaultValue={specs?.height}
												snaps={HEIGHT_SNAPS}
											/>
										</div>
										<div className={styles.dimField}>
											<label className={styles.dimLabel} htmlFor='depth'>Глубина, мм</label>
											<StepperInput
												id='depth'
												value={depth}
												min={minDepth}
												max={maxDepth}
												onChange={setDepth}
												modified={depthModified}
												defaultValue={specs?.depth}
											/>
										</div>
									</div>
								</div>

								<div className={styles.paramsGrid}>
									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Толщина металла корпуса (мм)</span>
										<div className={styles.toggleGroup}>
											{bodyThicknessOptions.map(t => {
												const isActive = bodyThickness === t;
												return (
													<motion.button
														key={t}
														className={cx(styles.toggleBtn, isActive && styles.toggleBtnActive)}
														onClick={() => setBodyThickness(t)}
														whileTap={{ scale: 0.94 }}
														transition={{ duration: 0.1 }}
													>
														<img src={isActive ? '/img/icons/icon-thickness-active.svg' : '/img/icons/icon-thickness.svg'} alt='' width='16' height='16' />
														{t}
													</motion.button>
												);
											})}
										</div>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Толщина металла двери (мм)</span>
										<div className={styles.toggleGroup}>
											{doorThicknessOptions.map(t => {
												const isActive = doorThickness === t;
												return (
													<motion.button
														key={t}
														className={cx(styles.toggleBtn, isActive && styles.toggleBtnActive)}
														onClick={() => setDoorThickness(t)}
														whileTap={{ scale: 0.94 }}
														transition={{ duration: 0.1 }}
													>
														<img src={isActive ? '/img/icons/icon-thickness-active.svg' : '/img/icons/icon-thickness.svg'} alt='' width='16' height='16' />
														{t}
													</motion.button>
												);
											})}
										</div>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Выбор замка</span>
										<CustomSelect
											id='lock'
											value={lockId}
											onChange={setLockId}
											options={lockEntries.map(([id, lock]) => ({ value: id, label: lock.name.replace(/^Замок\s+/i, '') }))}
											isOpen={openSelectId === 'lock'}
											onOpenChange={handleLockOpen}
											leftIcon={<img src='/img/icons/icon-lock.svg' alt='' width='16' height='16' />}
											modified={lockModified}
										/>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Вентиляция</span>
										<CustomSelect
											id='ventilation'
											value={ventilationType}
											onChange={setVentilationType}
											options={[
												{ value: null, label: 'Нет' },
												...Object.entries(priceRules.ventilation ?? {}).map(([id, v]) => ({ value: id, label: v.name || id })),
											]}
											isOpen={openSelectId === 'ventilation'}
											onOpenChange={handleVentilationOpen}
											leftIcon={<img src='/img/icons/icon-ventilation.svg' alt='' width='16' height='16' />}
											modified={ventilationModified}
										/>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Изменение цвета двери</span>
										<ColorPicker
											placeholder='Стандарт (без изменений)'
											selected={doorColor}
											onSelect={setDoorColor}
											isOpen={openSelectId === 'doorColor'}
											onOpenChange={handleDoorColorOpen}
											modified={doorColorModified}
										/>
									</div>

									<div className={styles.paramGroup}>
										<span className={styles.groupLabel}>Изменение цвета корпуса полностью</span>
										<ColorPicker
											placeholder='Стандарт (без изменений)'
											selected={bodyColor}
											onSelect={setBodyColor}
											isOpen={openSelectId === 'bodyColor'}
											onOpenChange={handleBodyColorOpen}
											modified={bodyColorModified}
										/>
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
