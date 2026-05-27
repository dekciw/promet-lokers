import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUsersAdmin } from '../../shared/hooks/useUsersAdmin';
import { cx } from '../../shared/utils/cx.js';
import styles from './UsersTab.module.css';

export default function UsersTab({ onNotify }) {
  const { users, isLoading, error, isCreating, loadUsers, createUser, disableUser, enableUser } = useUsersAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState(null);
  const [enableTarget, setEnableTarget] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: 'onChange' });

  async function handleCreate({ email, password }) {
    try {
      await createUser(email, password);
      reset();
      setAddOpen(false);
      onNotify?.('ok', `Пользователь ${email} создан`);
    } catch (err) {
      const code = err?.code ?? '';
      let msg = err?.message ?? 'Ошибка создания';
      if (code === 'auth/email-already-in-use') msg = 'Email уже используется';
      else if (code === 'auth/weak-password')   msg = 'Пароль слишком слабый (минимум 6 символов)';
      else if (code === 'auth/invalid-email')   msg = 'Неверный формат email';
      onNotify?.('error', msg);
    }
  }

  async function handleDisable() {
    if (!disableTarget) return;
    try {
      await disableUser(disableTarget.uid);
      onNotify?.('ok', `Пользователь ${disableTarget.email} деактивирован`);
      setDisableTarget(null);
    } catch (err) {
      onNotify?.('error', `Ошибка: ${err.message}`);
    }
  }

  async function handleEnable() {
    if (!enableTarget) return;
    try {
      await enableUser(enableTarget.uid);
      onNotify?.('ok', `Пользователь ${enableTarget.email} реактивирован`);
      setEnableTarget(null);
    } catch (err) {
      onNotify?.('error', `Ошибка: ${err.message}`);
    }
  }

  if (isLoading) return <div className={styles.state}>Загрузка пользователей…</div>;
  if (error) {
    return (
      <div className={cx(styles.state, styles.stateError)}>
        Ошибка загрузки: {error}
        <div>
          <button type="button" className={styles.retryBtn} onClick={loadUsers}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>Пользователи системы</h2>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setAddOpen(true)}
          aria-label="Добавить пользователя"
        >
          + Добавить пользователя
        </button>
      </div>

      {users.length === 0 ? (
        <div className={styles.state}>Пользователей пока нет</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td>{u.email}</td>
                  <td>
                    <span className={cx(styles.badge, u.status === 'disabled' ? styles.badgeDisabled : styles.badgeActive)}>
                      {u.status === 'disabled' ? 'Деактивирован' : 'Активен'}
                    </span>
                  </td>
                  <td>
                    {u.status !== 'disabled' ? (
                      <button
                        type="button"
                        className={cx(styles.actionBtn, styles.actionBtnDanger)}
                        onClick={() => setDisableTarget(u)}
                        aria-label={`Деактивировать ${u.email}`}
                      >
                        Деактивировать
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={cx(styles.actionBtn, styles.actionBtnSuccess)}
                        onClick={() => setEnableTarget(u)}
                        aria-label={`Реактивировать ${u.email}`}
                      >
                        Реактивировать
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <div className={styles.overlay} onClick={() => !isCreating && setAddOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Добавить пользователя">
            <h3 className={styles.modalTitle}>Новый пользователь</h3>
            <form onSubmit={handleSubmit(handleCreate)} noValidate>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  type="email"
                  className={cx(styles.input, errors.email && styles.inputError)}
                  disabled={isCreating}
                  autoComplete="off"
                  autoFocus
                  {...register('email', {
                    required: 'Введите email',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Неверный формат email' },
                  })}
                />
                {errors.email && <span className={styles.errMsg}>{errors.email.message}</span>}
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Пароль (минимум 6 символов)</span>
                <input
                  type="password"
                  className={cx(styles.input, errors.password && styles.inputError)}
                  disabled={isCreating}
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Введите пароль',
                    minLength: { value: 6, message: 'Минимум 6 символов' },
                  })}
                />
                {errors.password && <span className={styles.errMsg}>{errors.password.message}</span>}
              </label>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={cx(styles.actionBtn, styles.actionBtnSecondary)}
                  onClick={() => { reset(); setAddOpen(false); }}
                  disabled={isCreating}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={cx(styles.actionBtn, styles.actionBtnPrimary)}
                  disabled={isCreating}
                >
                  {isCreating ? 'Создаём…' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {enableTarget && (
        <div className={styles.overlay} onClick={() => setEnableTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Подтвердить реактивацию">
            <h3 className={styles.modalTitle}>Реактивировать пользователя?</h3>
            <p className={styles.modalText}>
              Пользователь <strong>{enableTarget.email}</strong> снова сможет войти в систему.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={cx(styles.actionBtn, styles.actionBtnSecondary)}
                onClick={() => setEnableTarget(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={cx(styles.actionBtn, styles.actionBtnSuccess)}
                onClick={handleEnable}
              >
                Реактивировать
              </button>
            </div>
          </div>
        </div>
      )}

      {disableTarget && (
        <div className={styles.overlay} onClick={() => setDisableTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Подтвердить деактивацию">
            <h3 className={styles.modalTitle}>Деактивировать пользователя?</h3>
            <p className={styles.modalText}>
              Пользователь <strong>{disableTarget.email}</strong> больше не сможет войти в систему.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={cx(styles.actionBtn, styles.actionBtnSecondary)}
                onClick={() => setDisableTarget(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={cx(styles.actionBtn, styles.actionBtnDanger)}
                onClick={handleDisable}
              >
                Деактивировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
