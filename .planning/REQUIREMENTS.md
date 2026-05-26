# Requirements: Конфигуратор «Промет» — v1.1 Админ-панель

**Defined:** 2026-05-26
**Core Value:** Любой сотрудник за 3 минуты собирает конфигурацию и получает готовые документы — без Excel, без Word, без ошибок.

## v1.1 Requirements

### Routing (ROUTE)

- [x] **ROUTE-01**: Администратор видит кнопку/ссылку «Админ» и может перейти на /admin
- [x] **ROUTE-02**: Обычный пользователь не видит ссылку на /admin и при прямом переходе редиректится на конфигуратор
- [x] **ROUTE-03**: Администратор может вернуться к конфигуратору из админ-панели

### Access Control (ACCESS)

- [x] **ACCESS-01**: Только admin@promet.ru получает доступ к /admin; все остальные — редирект
- [x] **ACCESS-02**: Определение роли происходит на фронте по email авторизованного пользователя

### Catalog Management (CATALOG)

- [x] **CATALOG-01**: Администратор видит полный список всех шкафов каталога на /admin
- [x] **CATALOG-02**: Администратор может фильтровать шкафы по серии (ML / LS / Все)
- [x] **CATALOG-03**: Администратор может искать шкаф по названию (текстовый поиск)
- [x] **CATALOG-04**: При клике на карточку открывается попап редактирования
- [x] **CATALOG-05**: В попапе редактируются все поля: порядковый номер, название, артикул, серия, цена (basePrice), высота, ширина, глубина, толщина корпуса, толщина двери, количество замков, количество дверей, вес, цена с НДС (cpBezNDS)
- [x] **CATALOG-06**: Администратор сохраняет изменения — данные записываются в Firestore
- [x] **CATALOG-07**: Администратор может добавить новую карточку шкафа с заполнением всех обязательных полей
- [x] **CATALOG-08**: Администратор может удалить карточку шкафа с подтверждением

### Photo Upload (MEDIA)

- [ ] **MEDIA-01**: При добавлении или редактировании шкафа администратор может загрузить фото
- [ ] **MEDIA-02**: Фото авторесайзится до высоты 1520px (ширина пропорционально) на клиенте перед загрузкой
- [ ] **MEDIA-03**: Фото сохраняется в Firebase Storage, URL записывается в поле `photoUrl` модели в Firestore
- [ ] **MEDIA-04**: Генератор КП проверяет `photoUrl` и использует его; fallback — `/img/models/{modelId}.png`

### Drag & Drop Ordering (ORDER)

- [ ] **ORDER-01**: Администратор может менять порядок шкафов перетаскиванием в списке
- [ ] **ORDER-02**: Новый порядок сохраняется в Firestore через поле `sortOrder` каждой модели
- [ ] **ORDER-03**: Список моделей в конфигураторе отображается в порядке `sortOrder`

### Price Coefficients (PRICE)

- [ ] **PRICE-01**: На вкладке коэффициентов администратор видит все надбавки расчёта цены
- [ ] **PRICE-02**: Администратор редактирует надбавку за вентиляцию (`ventSurcharge`, единое число)
- [ ] **PRICE-03**: Администратор редактирует надбавки за толщину металла (0.6 и 0.7 мм, отдельно ML и LS)
- [ ] **PRICE-04**: Администратор редактирует надбавки за глубину (по сериям, значениям глубины и qty-брекетам)
- [ ] **PRICE-05**: Администратор редактирует надбавки за высоту (по сериям и значениям высоты)
- [ ] **PRICE-06**: Администратор сохраняет изменения коэффициентов одной кнопкой в Firestore

### User Management (USERS)

- [ ] **USERS-01**: Администратор видит список всех пользователей системы на отдельной вкладке
- [ ] **USERS-02**: Администратор может создать новый аккаунт пользователя (задать email и пароль) прямо из админ-панели
- [ ] **USERS-03**: Администратор может удалить (деактивировать) аккаунт пользователя
- [ ] **USERS-04**: Создание/удаление пользователей реализовано через Firebase Cloud Function (единственный серверный компонент — Admin SDK недоступен из браузера)

### User History (HIST)

- [ ] **HIST-01**: При скачивании КП конфигурация автоматически сохраняется в историю пользователя (Firestore `/users/{uid}/history`)
- [ ] **HIST-02**: Пользователь видит список своих скачанных КП (дата, модель, цена)
- [ ] **HIST-03**: Пользователь может восстановить сохранённую конфигурацию в конфигуратор одним кликом
- [ ] **HIST-04**: Пользователь может повторно скачать КП из истории без ручной настройки

### Security (SEC)

- [ ] **SEC-01**: Firebase Security Rules разрешают запись в `catalog/main` только для admin@promet.ru
- [ ] **SEC-02**: Firebase Storage Rules разрешают загрузку файлов только для admin@promet.ru

## v2 Requirements

### История изменений (deferred)

- **HIST-01**: Администратор видит лог изменений каталога с датой и описанием
- **HIST-02**: Администратор может откатить последнее изменение

### Управление замками и сериями (deferred)

- **LOCK-01**: Администратор редактирует список замков каталога
- **SERIES-01**: Администратор добавляет новые серии

## Out of Scope

| Feature | Reason |
|---------|--------|
| Firebase Custom Claims для ролей | Избыточно для одного admin; email-проверка на фронте достаточна |
| Полноценный бэкенд | Только одна Cloud Function для создания пользователей; остальное — фронт + Firebase |
| Мультиадмин с разными правами | Один администратор на данном этапе |
| Экспорт/импорт каталога в CSV/Excel | Цель — заменить Google Sheets, не дублировать |
| История конфигураций пользователей | Отдельная задача (Phase 6 v1.0, отложена) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROUTE-01 | Phase 7 | Complete |
| ROUTE-02 | Phase 7 | Complete |
| ROUTE-03 | Phase 7 | Complete |
| ACCESS-01 | Phase 7 | Complete |
| ACCESS-02 | Phase 7 | Complete |
| SEC-01 | Phase 7 | Pending |
| SEC-02 | Phase 7 | Pending |
| CATALOG-01 | Phase 8 | Complete |
| CATALOG-02 | Phase 8 | Complete |
| CATALOG-03 | Phase 8 | Complete |
| CATALOG-04 | Phase 8 | Complete |
| CATALOG-05 | Phase 8 | Complete |
| CATALOG-06 | Phase 8 | Complete |
| CATALOG-07 | Phase 8 | Complete |
| CATALOG-08 | Phase 8 | Complete |
| MEDIA-01 | Phase 9 | Pending |
| MEDIA-02 | Phase 9 | Pending |
| MEDIA-03 | Phase 9 | Pending |
| MEDIA-04 | Phase 9 | Pending |
| ORDER-01 | Phase 9 | Pending |
| ORDER-02 | Phase 9 | Pending |
| ORDER-03 | Phase 9 | Pending |
| PRICE-01 | Phase 10 | Pending |
| PRICE-02 | Phase 10 | Pending |
| PRICE-03 | Phase 10 | Pending |
| PRICE-04 | Phase 10 | Pending |
| PRICE-05 | Phase 10 | Pending |
| PRICE-06 | Phase 10 | Pending |
| USERS-01 | Phase 11 | Pending |
| USERS-02 | Phase 11 | Pending |
| USERS-03 | Phase 11 | Pending |
| USERS-04 | Phase 11 | Pending |
| HIST-01 | Phase 11 | Pending |
| HIST-02 | Phase 11 | Pending |
| HIST-03 | Phase 11 | Pending |
| HIST-04 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 — Traceability filled after roadmap creation (Phases 7–11)*
