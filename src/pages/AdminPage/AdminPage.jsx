import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useCatalogAdmin } from '../../shared/hooks/useCatalogAdmin';
import CatalogEditModal from '../../shared/components/CatalogEditModal';
import DeleteConfirmModal from '../../shared/components/DeleteConfirmModal';
import Notification from '../../shared/components/Notification/Notification';
import { cx } from '../../shared/utils/cx.js';
import styles from './AdminPage.module.css';

const SERIES_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'ML',  label: 'ML' },
  { key: 'LS',  label: 'LS' },
];

export default function AdminPage({ onLogout, username }) {
  const { models, isLoading, error, loadModels, saveModel, addModel, deleteModel } = useCatalogAdmin();

  const [activeSeries, setActiveSeries] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // CRUD UI state
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification state
  const [notif, setNotif] = useState({ visible: false, status: 'ok', title: '' });
  function showOk(title)    { setNotif({ visible: true, status: 'ok',    title }); }
  function showError(title) { setNotif({ visible: true, status: 'error', title }); }

  // CATALOG-02/03: filtered and sorted models
  const visibleModels = useMemo(() => models
    .filter((m) => activeSeries === 'all' || m.series === activeSeries)
    .filter((m) => !searchQuery || (m.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  [models, activeSeries, searchQuery]);

  // CATALOG-07: add with duplicate article guard (Pitfall #5)
  async function handleAdd(data) {
    if (models.some((m) => m.article === data.article)) {
      showError(`Артикул «${data.article}» уже существует`);
      return; // Do not close modal — let user fix the article
    }
    try {
      await addModel(data);
      setAddOpen(false);
      showOk('Модель добавлена');
    } catch (err) {
      showError(`Ошибка добавления: ${err.message}`);
    }
  }

  // CATALOG-06: save existing model
  async function handleSave(data) {
    try {
      await saveModel(data);
      setEditTarget(null);
      showOk('Изменения сохранены');
    } catch (err) {
      showError(`Ошибка сохранения: ${err.message}`);
    }
  }

  // CATALOG-08: delete confirmed
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteModel(deleteTarget.article);
      setDeleteTarget(null);
      showOk('Модель удалена');
    } catch (err) {
      showError(`Ошибка удаления: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/configurator" className={styles.backLink}>
          ← Конфигуратор
        </Link>
        <span className={styles.title}>Панель администратора</span>
        <div className={styles.userArea}>
          <span className={styles.username}>{username}</span>
          <button
            className={styles.logoutBtn}
            onClick={onLogout}
            type="button"
            aria-label="Выйти"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Поиск по названию"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Поиск по названию"
        />
        <div className={styles.tabs} role="tablist" aria-label="Фильтр по серии">
          {SERIES_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeSeries === t.key}
              className={cx(styles.tab, activeSeries === t.key && styles.tabActive)}
              onClick={() => setActiveSeries(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setAddOpen(true)}
          aria-label="Добавить модель"
        >
          + Добавить
        </button>
      </div>

      <main className={styles.listWrap}>
        {isLoading && (
          <div className={styles.stateBlock}>Загрузка каталога…</div>
        )}

        {!isLoading && error && (
          <div className={cx(styles.stateBlock, styles.stateError)}>
            Не удалось загрузить каталог: {error}
            <div>
              <button type="button" className={styles.retryBtn} onClick={loadModels}>
                Повторить
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && visibleModels.length === 0 && (
          <div className={styles.stateBlock}>
            {models.length === 0 ? 'Каталог пуст' : 'Ничего не найдено'}
            {models.length === 0 && (
              <div>
                <button type="button" className={styles.retryBtn} onClick={() => setAddOpen(true)}>
                  Добавить первую модель
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && visibleModels.length > 0 && (
          <div className={styles.grid}>
            {visibleModels.map((m) => (
              <article key={m.article} className={styles.card}>
                <h3 className={styles.cardName}>{m.name}</h3>
                <span className={styles.cardArticle}>Артикул: {m.article}</span>
                <div className={styles.cardMeta}>
                  {m.series} · {m.height}×{m.width}×{m.depth} мм
                </div>
                <div className={styles.cardPrice}>
                  {(m.basePrice ?? 0).toLocaleString('ru-RU')} ₽
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.cardBtn}
                    onClick={() => setEditTarget(m)}
                    aria-label={`Редактировать ${m.name}`}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={cx(styles.cardBtn, styles.cardBtnDanger)}
                    onClick={() => setDeleteTarget(m)}
                    aria-label={`Удалить ${m.name}`}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <CatalogEditModal
        isOpen={addOpen}
        mode="add"
        model={null}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />

      <CatalogEditModal
        isOpen={editTarget !== null}
        mode="edit"
        model={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        modelName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        onCancel={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
      />

      <Notification
        visible={notif.visible}
        status={notif.status}
        title={notif.title}
        onCloseTimeout={() => setNotif((n) => ({ ...n, visible: false }))}
      />
    </div>
  );
}
