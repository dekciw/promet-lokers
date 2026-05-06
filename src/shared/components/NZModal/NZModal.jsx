import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { cx } from '../../utils/cx.js';
import styles from './NZModal.module.css';

/**
 * Модальное окно для сбора данных перед скачиванием НЗ.
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onSubmit: ({ managerName, clientName }) => Promise<void>
 *
 * UX: role=dialog, aria-modal, aria-labelledby, Esc/overlay-click закрывают,
 * focus-visible на всех контролах, touch targets ≥44×44px.
 */
export default function NZModal({ isOpen, onClose, onSubmit }) {
  const titleId = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    defaultValues: { managerName: '', clientName: '' },
  });

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  async function handleFormSubmit(data) {
    // Trim перед отправкой
    const payload = {
      managerName: data.managerName.trim(),
      clientName: data.clientName.trim(),
    };
    await onSubmit(payload);
  }

  function handleOverlayClick() {
    if (!isSubmitting) onClose();
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role='presentation'
    >
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>Бланк НЗ</h2>
          <button
            type='button'
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label='Закрыть'
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor='nz-manager'>
              Менеджер по продажам (Ф.И.О.)
              <span className={styles.required} aria-hidden='true'>*</span>
            </label>
            <input
              id='nz-manager'
              type='text'
              autoComplete='off'
              className={cx(styles.input, errors.managerName && styles.inputError)}
              aria-invalid={errors.managerName ? 'true' : 'false'}
              aria-describedby='nz-manager-err'
              {...register('managerName', {
                required: 'Заполните Ф.И.О. менеджера',
                validate: v => v.trim().length > 0 || 'Заполните Ф.И.О. менеджера',
              })}
            />
            <span id='nz-manager-err' className={styles.errorMsg}>
              {errors.managerName?.message ?? ''}
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor='nz-client'>
              Название Клиента (страна)
              <span className={styles.required} aria-hidden='true'>*</span>
            </label>
            <input
              id='nz-client'
              type='text'
              autoComplete='off'
              className={cx(styles.input, errors.clientName && styles.inputError)}
              aria-invalid={errors.clientName ? 'true' : 'false'}
              aria-describedby='nz-client-err'
              {...register('clientName', {
                required: 'Заполните название клиента',
                validate: v => v.trim().length > 0 || 'Заполните название клиента',
              })}
            />
            <span id='nz-client-err' className={styles.errorMsg}>
              {errors.clientName?.message ?? ''}
            </span>
          </div>

          <div className={styles.actions}>
            <button
              type='button'
              className={cx(styles.btn, styles.btnSecondary)}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type='submit'
              className={cx(styles.btn, styles.btnPrimary)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Генерация...' : 'Скачать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
