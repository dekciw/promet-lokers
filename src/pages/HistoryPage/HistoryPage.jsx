import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Header from '../../shared/components/Header/Header';
import { useHistory } from '../../shared/hooks/useHistory';
import { useCatalog } from '../../shared/hooks/useCatalog';
import { cx } from '../../shared/utils/cx.js';
import styles from './HistoryPage.module.css';

const RESTORE_KEY = 'promet_restore_snapshot_v1';

function formatDate(ts) {
  if (!ts) return '—';
  const d = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPage({ uid, onLogout, username, isAdmin }) {
  const { history, isLoading, error, loadHistory, redownloadKP, removeEntry } = useHistory(uid);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { catalog } = useCatalog();
  const navigate = useNavigate();

  useEffect(() => { loadHistory(); }, [loadHistory]);

  function handleRestore(entry) {
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify(entry.configSnapshot));
    navigate('/configurator');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeEntry(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(`Ошибка удаления: ${err?.message ?? err}`);
    }
  }

  async function handleRedownload(entry) {
    if (!catalog) {
      alert('Каталог ещё не загружен. Подождите и попробуйте снова.');
      return;
    }
    try {
      await redownloadKP(entry, catalog);
    } catch (err) {
      alert(`Ошибка генерации PDF: ${err?.message ?? err}`);
    }
  }

  return (
    <div className={styles.page}>
      <Header onLogout={onLogout} username={username} isAdmin={isAdmin} />
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <h1 className={styles.title}>История КП</h1>
          <Link to="/configurator" className={styles.backLink}>← Конфигуратор</Link>
        </div>

        {isLoading && <div className={styles.state}>Загрузка истории…</div>}

        {!isLoading && error && (
          <div className={cx(styles.state, styles.stateError)}>
            Не удалось загрузить историю: {error}
            <div>
              <button type="button" className={styles.retryBtn} onClick={loadHistory}>
                Повторить
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <div className={styles.state}>
            История пуста — скачайте первое КП на странице конфигуратора.
          </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Модель</th>
                  <th>Артикул</th>
                  <th>Цена за 1 шт.</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDate(e.downloadedAt)}</td>
                    <td>{e.modelName}</td>
                    <td>{e.article}</td>
                    <td>{Number(e.price ?? 0).toLocaleString('ru-RU')} ₽</td>
                    <td className={styles.actions}>
                      <button
                        type="button"
                        className={cx(styles.actionBtn, styles.actionBtnSecondary)}
                        onClick={() => handleRestore(e)}
                        aria-label={`Восстановить конфигурацию ${e.modelName}`}
                      >
                        Восстановить
                      </button>
                      <button
                        type="button"
                        className={cx(styles.actionBtn, styles.actionBtnPrimary)}
                        onClick={() => handleRedownload(e)}
                        aria-label={`Скачать КП заново ${e.modelName}`}
                      >
                        Скачать заново
                      </button>
                      <button
                        type="button"
                        className={cx(styles.actionBtn, styles.actionBtnDanger)}
                        onClick={() => setDeleteTarget(e)}
                        aria-label={`Удалить запись ${e.modelName}`}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </main>

      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className={styles.modalTitle}>Удалить запись из истории?</h3>
            <p className={styles.modalText}>
              Запись <strong>{deleteTarget.modelName}</strong> от {formatDate(deleteTarget.downloadedAt)} будет удалена без возможности восстановления.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={cx(styles.actionBtn, styles.actionBtnSecondary)}
                onClick={() => setDeleteTarget(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={cx(styles.actionBtn, styles.actionBtnDanger)}
                onClick={handleDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
