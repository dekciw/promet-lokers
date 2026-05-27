import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { cx } from '../../utils/cx.js';
import styles from './CatalogEditModal.module.css';

const EMPTY_MODEL = {
  sortOrder: 0,
  name: '',
  article: '',
  series: 'ML',
  basePrice: 0,
  height: 0,
  width: 0,
  depth: 0,
  bodyThickness: 0.5,
  doorThickness: 0.5,
  lockCount: 1,
  doorCount: 1,
  weight: 0,
  photoUrl: '',
};

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden:  { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: 8,  scale: 0.98 },
};

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Architecture note: CatalogEditModal is a pure form component — it does NOT import
// useImageUpload or call Firestore directly. Photo upload is delegated to onPhotoUpload
// prop provided by the parent (AdminPage), keeping the modal decoupled and testable.
// onPhotoUpload(file, currentFormValues, mode) → Promise<photoUrl>

export default function CatalogEditModal({ isOpen, mode = 'edit', model = null, onClose, onSave, onPhotoUpload }) {
  const titleId = useId();
  const {
    register, handleSubmit, reset, setValue, getValues, watch, trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm({ mode: 'onChange', defaultValues: EMPTY_MODEL });

  // Local state for upload progress + error — mirrors state from the hook in AdminPage
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // Watch photoUrl to drive preview rendering
  const photoUrl = watch('photoUrl');
  const fallbackPhotoUrl = model?.firestoreKey ? `/img/models/${model.firestoreKey}.png` : null;
  const displayPhotoUrl = photoUrl || fallbackPhotoUrl;

  // Populate / reset form on open (RESEARCH.md Pitfall #3 — guard on isOpen is mandatory)
  // trigger() after reset: mode:'onChange' doesn't auto-validate on reset, so isValid stays
  // false until first user interaction — call trigger() to unblock the Save button immediately.
  useEffect(() => {
    if (isOpen) {
      reset(model ?? EMPTY_MODEL);
      setPhotoError(null);
      trigger();
    }
  }, [isOpen, model, reset, trigger]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ESC handler
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === 'Escape' && !isSubmitting) onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting, onClose]);

  async function handleFormSubmit(data) {
    await onSave(data);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      // ADD mode: model not yet in Firestore — onPhotoUpload only uploads to Cloudinary
      // EDIT mode: model exists — onPhotoUpload uploads and persists to Firestore via saveModel
      const currentValues = getValues();
      const newUrl = await onPhotoUpload(file, currentValues, mode);
      setValue('photoUrl', newUrl, { shouldDirty: true, shouldValidate: false });
    } catch (err) {
      setPhotoError(err.message ?? 'Ошибка загрузки');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = ''; // allow reselecting same file
    }
  }

  const isEdit = mode === 'edit';
  const trimRequired = (msg) => (v) => (typeof v === 'string' && v.trim().length > 0) || msg;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          role="presentation"
          onClick={() => { if (!isSubmitting) onClose(); }}
          variants={overlayVariants}
          initial="hidden" animate="visible" exit="hidden"
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby={titleId}
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Каталог</p>
                <h2 id={titleId} className={styles.title}>
                  {isEdit ? 'Редактирование модели' : 'Новая модель'}
                </h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Закрыть"
              >
                <IconClose />
              </button>
            </div>

            <form id="catalog-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
              {/* Hidden fields — registers photoUrl and sortOrder so they submit with the form */}
              <input type="hidden" {...register('photoUrl')} />
              <input type="hidden" {...register('sortOrder', { valueAsNumber: true })} />

              <div className={styles.grid}>
                {/* Фото модели — full-width row at the top */}
                <div className={cx(styles.field, styles.gridFull, styles.photoField)}>
                  <label className={styles.label}>Фото модели</label>
                  <div className={styles.photoRow}>
                    <div className={styles.photoPreview}>
                      {displayPhotoUrl ? (
                        <img src={displayPhotoUrl} alt="Превью фото модели" className={styles.photoPreviewImg} />
                      ) : (
                        <span className={styles.photoPlaceholder} aria-hidden="true">нет фото</span>
                      )}
                    </div>
                    <div className={styles.photoControls}>
                      <label className={cx(styles.btn, styles.btnSecondary, styles.photoBtn)}>
                        {isUploadingPhoto ? 'Загрузка…' : 'Загрузить фото'}
                        <input
                          type="file"
                          accept="image/*"
                          className={styles.photoFileInput}
                          onChange={handlePhotoChange}
                          disabled={isUploadingPhoto || isSubmitting}
                          aria-label="Выбрать файл фото модели"
                        />
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          className={cx(styles.btn, styles.btnSecondary, styles.photoBtn)}
                          onClick={() => setValue('photoUrl', '', { shouldDirty: true })}
                          disabled={isUploadingPhoto || isSubmitting}
                          aria-label="Удалить фото"
                        >
                          Удалить
                        </button>
                      )}
                      {photoError && (
                        <span className={styles.errorMsg} role="alert">{photoError}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* series */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-series">
                    Серия <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="f-series"
                    className={cx(styles.select, errors.series && styles.inputError)}
                    {...register('series', { required: 'Обязательно' })}
                  >
                    <option value="ML">ML</option>
                    <option value="LS">LS</option>
                  </select>
                  <span className={styles.errorMsg} aria-live="polite">{errors.series?.message ?? ''}</span>
                </div>

                {/* name */}
                <div className={cx(styles.field, styles.gridFull)}>
                  <label className={styles.label} htmlFor="f-name">
                    Название <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-name"
                    type="text"
                    className={cx(styles.input, errors.name && styles.inputError)}
                    {...register('name', { required: 'Обязательно', validate: trimRequired('Не должно быть пустым') })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.name?.message ?? ''}</span>
                </div>

                {/* article — read-only in edit mode */}
                <div className={cx(styles.field, styles.gridFull)}>
                  <label className={styles.label} htmlFor="f-article">
                    Артикул <span className={styles.required}>*</span>
                    {isEdit && <span style={{ color: '#718096', fontWeight: 400 }}> (нельзя изменить)</span>}
                  </label>
                  <input
                    id="f-article"
                    type="text"
                    className={cx(styles.input, errors.article && styles.inputError, isEdit && styles.inputDisabled)}
                    readOnly={isEdit}
                    {...register('article', {
                      required: 'Обязательно',
                      validate: trimRequired('Не должно быть пустым'),
                    })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.article?.message ?? ''}</span>
                </div>

                {/* basePrice */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-basePrice">
                    Цена (basePrice) <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-basePrice"
                    type="number"
                    step="1"
                    className={cx(styles.input, errors.basePrice && styles.inputError)}
                    {...register('basePrice', { valueAsNumber: true, required: 'Обязательно', min: { value: 0, message: 'Минимум 0' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.basePrice?.message ?? ''}</span>
                </div>

                {/* height */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-height">
                    Высота, мм <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-height"
                    type="number"
                    step="1"
                    className={cx(styles.input, errors.height && styles.inputError)}
                    {...register('height', { valueAsNumber: true, required: 'Обязательно', min: { value: 1, message: 'Минимум 1' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.height?.message ?? ''}</span>
                </div>

                {/* width */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-width">
                    Ширина, мм <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-width"
                    type="number"
                    step="1"
                    className={cx(styles.input, errors.width && styles.inputError)}
                    {...register('width', { valueAsNumber: true, required: 'Обязательно', min: { value: 1, message: 'Минимум 1' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.width?.message ?? ''}</span>
                </div>

                {/* depth */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-depth">
                    Глубина, мм <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-depth"
                    type="number"
                    step="1"
                    className={cx(styles.input, errors.depth && styles.inputError)}
                    {...register('depth', { valueAsNumber: true, required: 'Обязательно', min: { value: 1, message: 'Минимум 1' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.depth?.message ?? ''}</span>
                </div>

                {/* weight */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-weight">
                    Вес, кг <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-weight"
                    type="number"
                    step="0.1"
                    className={cx(styles.input, errors.weight && styles.inputError)}
                    {...register('weight', { valueAsNumber: true, required: 'Обязательно', min: { value: 0, message: 'Минимум 0' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.weight?.message ?? ''}</span>
                </div>

                {/* bodyThickness */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-bodyT">
                    Толщина корпуса, мм <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="f-bodyT"
                    className={cx(styles.select, errors.bodyThickness && styles.inputError)}
                    {...register('bodyThickness', { valueAsNumber: true, required: 'Обязательно' })}
                  >
                    <option value={0.45}>0.45</option>
                    <option value={0.5}>0.5</option>
                    <option value={0.6}>0.6</option>
                    <option value={0.7}>0.7</option>
                  </select>
                  <span className={styles.errorMsg} aria-live="polite">{errors.bodyThickness?.message ?? ''}</span>
                </div>

                {/* doorThickness */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-doorT">
                    Толщина двери, мм <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="f-doorT"
                    className={cx(styles.select, errors.doorThickness && styles.inputError)}
                    {...register('doorThickness', { valueAsNumber: true, required: 'Обязательно' })}
                  >
                    <option value={0.45}>0.45</option>
                    <option value={0.5}>0.5</option>
                    <option value={0.6}>0.6</option>
                    <option value={0.7}>0.7</option>
                  </select>
                  <span className={styles.errorMsg} aria-live="polite">{errors.doorThickness?.message ?? ''}</span>
                </div>

                {/* lockCount */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-lockCount">
                    Замков <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-lockCount"
                    type="number"
                    step="1"
                    min="1"
                    max="3"
                    className={cx(styles.input, errors.lockCount && styles.inputError)}
                    {...register('lockCount', { valueAsNumber: true, required: 'Обязательно', min: { value: 1, message: '1-3' }, max: { value: 3, message: '1-3' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.lockCount?.message ?? ''}</span>
                </div>

                {/* doorCount */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="f-doorCount">
                    Дверей <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="f-doorCount"
                    type="number"
                    step="1"
                    min="1"
                    max="2"
                    className={cx(styles.input, errors.doorCount && styles.inputError)}
                    {...register('doorCount', { valueAsNumber: true, required: 'Обязательно', min: { value: 1, message: '1-2' }, max: { value: 2, message: '1-2' } })}
                  />
                  <span className={styles.errorMsg} aria-live="polite">{errors.doorCount?.message ?? ''}</span>
                </div>
              </div>
            </form>

            <div className={styles.actions}>
              <button
                type="button"
                className={cx(styles.btn, styles.btnSecondary)}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                form="catalog-form"
                className={cx(styles.btn, styles.btnPrimary)}
                disabled={isSubmitting || isUploadingPhoto}
              >
                {isSubmitting ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
