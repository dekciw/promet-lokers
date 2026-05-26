import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cx } from '../../utils/cx.js';
import styles from './DeleteConfirmModal.module.css';

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden:  { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: 8,  scale: 0.98 },
};

function IconTrash() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function DeleteConfirmModal({ isOpen, modelName, isDeleting = false, onCancel, onConfirm }) {
  const titleId = useId();

  // ESC handler
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === 'Escape' && !isDeleting) onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isDeleting, onCancel]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          role="presentation"
          onClick={() => { if (!isDeleting) onCancel(); }}
          variants={overlayVariants}
          initial="hidden" animate="visible" exit="hidden"
          transition={{ duration: 0.16 }}
        >
          <motion.div
            className={styles.modal}
            role="alertdialog" aria-modal="true" aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            transition={{ duration: 0.20, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className={styles.iconWrap}><IconTrash /></div>
            <h2 id={titleId} className={styles.title}>Удалить модель?</h2>
            <p className={styles.message}>
              Модель «{modelName}» будет удалена из каталога. Это действие нельзя отменить.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={cx(styles.btn, styles.btnCancel)}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                type="button"
                className={cx(styles.btn, styles.btnDanger)}
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
