import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  DndContext, closestCenter,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCatalogAdmin } from '../../shared/hooks/useCatalogAdmin';
import { useImageUpload } from '../../shared/hooks/useImageUpload';
import { resizeImageToHeight, uploadToCloudinary } from '../../shared/lib/cloudinaryUpload';
import CatalogEditModal from '../../shared/components/CatalogEditModal';
import DeleteConfirmModal from '../../shared/components/DeleteConfirmModal';
import Notification from '../../shared/components/Notification/Notification';
import PriceCoefficientsTab from './PriceCoefficientsTab';
import UsersTab from './UsersTab';
import { cx } from '../../shared/utils/cx.js';
import styles from './AdminPage.module.css';

const SERIES_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'ML',  label: 'ML' },
  { key: 'LS',  label: 'LS' },
];

const ADMIN_TABS = [
  { key: 'catalog', label: 'Каталог' },
  { key: 'prices',  label: 'Коэффициенты' },
  { key: 'users',   label: 'Пользователи' },
];

// SortableCard: individual card wrapped in useSortable.
// IMPORTANT: drag listeners are attached ONLY to .dragHandle, NOT the whole article —
// this keeps "Редактировать" / "Удалить" button clicks from initiating a drag.
function SortableCard({ model, onEdit, onDelete, disabled, position, total }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: model.article, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const photoSrc = model.photoUrl || (model.firestoreKey ? `/img/models/${model.firestoreKey}.png` : null);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cx(styles.card, isDragging && styles.cardDragging, disabled && styles.cardDragDisabled)}
    >
      {/* Drag handle — listeners scoped here so button clicks are unaffected */}
      <div
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        aria-label="Перетащить для изменения порядка"
        aria-disabled={disabled}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="5" cy="4" r="1.5" fill="currentColor" />
          <circle cx="5" cy="8" r="1.5" fill="currentColor" />
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="11" cy="4" r="1.5" fill="currentColor" />
          <circle cx="11" cy="8" r="1.5" fill="currentColor" />
          <circle cx="11" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
      {position != null && (
        <div className={styles.positionBadge} aria-label={`Позиция ${position} из ${total}`}>
          {position} <span className={styles.positionTotal}>/ {total}</span>
        </div>
      )}
      {photoSrc && (
        <div className={styles.cardPhoto}>
          <img src={photoSrc} alt={model.name} className={styles.cardPhotoImg} />
        </div>
      )}
      <h3 className={styles.cardName}>{model.name}</h3>
      <span className={styles.cardArticle}>Артикул: {model.article}</span>
      <div className={styles.cardMeta}>
        {model.series} · {model.height}×{model.width}×{model.depth} мм
      </div>
      <div className={styles.cardPrice}>
        {(model.basePrice ?? 0).toLocaleString('ru-RU')} ₽
      </div>
      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.cardBtn}
          onClick={() => onEdit(model)}
          aria-label={`Редактировать ${model.name}`}
        >
          Редактировать
        </button>
        <button
          type="button"
          className={cx(styles.cardBtn, styles.cardBtnDanger)}
          onClick={() => onDelete(model)}
          aria-label={`Удалить ${model.name}`}
        >
          Удалить
        </button>
      </div>
    </article>
  );
}

export default function AdminPage({ onLogout, username = '' }) {
  const initial = username ? username[0].toUpperCase() : '?';
  const { models, isLoading, error, loadModels, saveModel, addModel, deleteModel, reorderModels } = useCatalogAdmin();

  const [activeTab, setActiveTab] = useState('catalog');
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

  // MEDIA-01..03: wire useImageUpload (edit flow — saveModel persists photoUrl to Firestore)
  const { uploadPhoto } = useImageUpload({ saveModel });

  // Photo upload handler — mode-aware:
  // - EDIT mode: model exists in Firestore → full pipeline (resize + upload + saveModel)
  // - ADD mode: model not yet in Firestore → only resize + Cloudinary (form Save will persist)
  async function handlePhotoUpload(file, currentValues, mode) {
    if (mode === 'edit' && currentValues.article) {
      return await uploadPhoto(file, currentValues); // saves to Firestore + returns URL
    }
    // ADD mode: resize + upload but don't persist to Firestore yet
    const blob = await resizeImageToHeight(file, 1520);
    return await uploadToCloudinary(blob);
  }

  // ORDER-01: drag allowed only when a specific series is selected (not "all") and no search
  // Reason: reordering mixed ML+LS is confusing; series tabs give isolated, predictable order
  const isDragDisabled = activeSeries === 'all' || searchQuery.trim() !== '';

  // DnD sensors — PointerSensor with distance:5 avoids accidental drag on button clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ORDER-02: persist new sortOrder to Firestore after drag
  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;  // Pitfall #5 guard — no-op on same position
    if (isDragDisabled) return;                   // safety net if drag somehow fires while disabled
    const oldIndex = visibleModels.findIndex((m) => m.article === active.id);
    const newIndex = visibleModels.findIndex((m) => m.article === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(visibleModels, oldIndex, newIndex);
    try {
      await reorderModels(reordered);
    } catch (err) {
      showError(`Ошибка сохранения порядка: ${err.message}`);
    }
  }

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
        <img
          className={styles.decoIcons}
          src='/img/header/header-icons.svg'
          alt=''
          aria-hidden='true'
        />
        <nav className={styles.adminTabs} role="tablist" aria-label="Раздел администрирования">
          {ADMIN_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={cx(styles.adminTab, activeTab === t.key && styles.adminTabActive)}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className={styles.userArea}>
          <div className={styles.userChip}>
            <span className={styles.userAvatar}>{initial}</span>
            <span className={styles.userName}>{username}</span>
            <button
              className={styles.logoutBtn}
              onClick={onLogout}
              type="button"
              aria-label="Выйти"
              title="Выйти"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'prices' && (
        <PriceCoefficientsTab onNotify={(status, title) => {
          if (status === 'ok') showOk(title);
          else showError(title);
        }} />
      )}

      {activeTab === 'users' && (
        <UsersTab onNotify={(status, title) => {
          if (status === 'ok') showOk(title);
          else showError(title);
        }} />
      )}

      {activeTab === 'catalog' && (
        <>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={visibleModels.map((m) => m.article)}
              strategy={rectSortingStrategy}
            >
              {activeSeries === 'all' && (
                <div className={styles.dragHint} role="status">
                  Выберите серию ML или LS, чтобы менять порядок карточек
                </div>
              )}
              {searchQuery.trim() !== '' && activeSeries !== 'all' && (
                <div className={styles.dragHint} role="status">
                  Очистите поиск, чтобы изменять порядок
                </div>
              )}
              <div className={styles.grid}>
                {visibleModels.map((m, idx) => (
                  <SortableCard
                    key={m.article}
                    model={m}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    disabled={isDragDisabled}
                    position={activeSeries !== 'all' ? idx + 1 : null}
                    total={activeSeries !== 'all' ? visibleModels.length : null}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>
        </>
      )}

      <CatalogEditModal
        isOpen={addOpen}
        mode="add"
        model={null}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        onPhotoUpload={handlePhotoUpload}
      />

      <CatalogEditModal
        isOpen={editTarget !== null}
        mode="edit"
        model={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
        onPhotoUpload={handlePhotoUpload}
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
