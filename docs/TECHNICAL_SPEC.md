# Техническая спецификация

Полная техническая документация проекта «Конфигуратор металлических шкафов Промет».

---

## Содержание

- [Обзор системы](#обзор-системы)
- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Структура проекта](#структура-проекта)
- [Firebase структура](#firebase-структура)
- [Модули и компоненты](#модули-и-компоненты)
- [Бизнес-логика](#бизнес-логика)
- [API и интеграции](#api-и-интеграции)
- [Безопасность](#безопасность)
- [Производительность](#производительность)

---

## Обзор системы

### Назначение

Веб-приложение для конфигурации металлических шкафов серий **ML** и **LS** с автоматическим расчётом стоимости, веса и срока изготовления. Предназначено для внутреннего использования отделом продаж ООО «НПО Промет».

### Ключевые функции

1. **Конфигуратор** — выбор модели и настройка параметров (габариты, толщина, цвет, замок, вентиляция)
2. **Расчёт цены** — автоматический расчёт с учётом объёма заказа и нестандартных параметров
3. **Генерация документов** — PDF коммерческого предложения (КП) и наряда-заказа (НЗ)
4. **Управление пользователями** — авторизация, роли (admin/user), блокировка
5. **История заказов** — персональная история с возможностью восстановления конфигураций
6. **Админ-панель** — управление каталогом, коэффициентами, пользователями

### Пользователи

- **Менеджеры по продажам** (роль: `user`) — создание КП и НЗ
- **Администраторы** (роль: `admin`) — полный доступ + управление системой

---

## Архитектура

### Общая схема

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │           React 19 + Vite 8 SPA               │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  Pages (ConfiguratorPage, AdminPage...)  │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  Modules (Configurator, Parameters...)   │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  Shared (components, hooks, utils)       │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Firebase Services                    │
│  ┌────────────────┬──────────────────┬────────────┐ │
│  │   Hosting      │  Authentication  │  Firestore │ │
│  │                │                  │            │ │
│  │  Static files  │  Email/Password  │  Catalog   │ │
│  │  SPA routing   │  User roles      │  Users     │ │
│  │  SSL cert      │  Session mgmt    │  History   │ │
│  └────────────────┴──────────────────┴────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Принципы архитектуры

1. **Single Page Application (SPA)** — одностраничное приложение с клиентской маршрутизацией
2. **Модульная структура** — явное разграничение на слои (pages/modules/shared)
3. **Serverless** — нет собственного бэкенда, вся логика на клиенте + Firebase
4. **Offline-ready** — каталог кешируется в localStorage на 24 часа
5. **Real-time sync** — мгновенная синхронизация данных через Firestore
6. **Responsive** — полная адаптивность от 375px до 4K

---

## Технологический стек

### Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| **React** | 19.2.4 | UI-фреймворк |
| **Vite** | 8.0.1 | Сборщик и dev-сервер |
| **React Router** | 7.15.1 | Клиентская маршрутизация |
| **motion** | 12.38.0 | Анимации (AnimatePresence, spring) |
| **react-hook-form** | 7.72.1 | Управление формами |
| **@dnd-kit** | 6.3.1 / 10.0.0 | Drag & drop в админ-панели |
| **sonner** | 2.0.7 | Toast-уведомления |

### Backend (Firebase)

| Сервис | Назначение |
|--------|------------|
| **Firebase Authentication** | Авторизация пользователей (email/password) |
| **Firestore** | NoSQL база данных (каталог, пользователи, история) |
| **Firebase Hosting** | Хостинг статических файлов SPA |

### PDF Generation

| Библиотека | Версия | Назначение |
|------------|--------|------------|
| **pdf-lib** | 1.17.1 | Генерация и редактирование PDF |
| **@pdf-lib/fontkit** | 1.1.1 | Поддержка кастомных шрифтов (кириллица) |

### Стилизация

- **CSS Modules** — изолированные стили для компонентов
- **CSS Custom Properties** — переменные для цветов, отступов
- **@fontsource/montserrat** — веб-шрифт Montserrat

### Тестирование

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **vitest** | 2.0.0 | Unit-тесты |
| **@testing-library/react** | 16.3.2 | Компонентные тесты |
| **Playwright** | 1.60.0 | E2E-тесты |

### Линтинг и анализ

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **ESLint** | 9.39.4 | Статический анализ кода |
| **knip** | 6.14.1 | Обнаружение неиспользуемого кода |

---

## Структура проекта

### Директории

```
Promet/
├── public/                   # Статические файлы
│   ├── fonts/               # Шрифты для PDF (Montserrat)
│   ├── img/                 # Изображения моделей шкафов
│   ├── templates/           # PDF-шаблоны (КП, НЗ)
│   └── favicon.svg          # Иконка сайта
│
├── src/                     # Исходный код
│   ├── pages/               # Страницы-роуты
│   │   ├── ConfiguratorPage/
│   │   ├── AdminPage/
│   │   ├── HistoryPage/
│   │   └── NotFoundPage/
│   │
│   ├── modules/             # Функциональные модули
│   │   ├── Configurator/    # Конфигуратор шкафов
│   │   ├── Parameters/      # Панель параметров
│   │   ├── Auth/            # Авторизация
│   │   └── Admin/           # Админ-панель
│   │
│   ├── shared/              # Переиспользуемые компоненты
│   │   ├── api/             # Работа с Firestore
│   │   ├── components/      # UI-компоненты
│   │   ├── constants/       # Глобальные константы
│   │   ├── context/         # React Context
│   │   ├── hooks/           # Кастомные хуки
│   │   ├── lib/             # Инициализация Firebase
│   │   └── utils/           # Утилиты
│   │
│   ├── pdf/                 # Генерация PDF
│   │   ├── kp/              # Коммерческое предложение
│   │   └── nz/              # Наряд-заказ
│   │
│   ├── App.jsx              # Корневой компонент
│   ├── main.jsx             # Точка входа
│   └── index.css            # Глобальные стили
│
├── docs/                    # Документация
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   ├── TECHNICAL_SPEC.md
│   └── MAINTENANCE.md
│
├── .env                     # Переменные окружения (НЕ в Git!)
├── firebase.json            # Конфигурация Firebase
├── firestore.rules          # Правила безопасности Firestore
├── firestore.indexes.json   # Индексы Firestore
├── vite.config.js           # Конфигурация Vite
├── package.json             # Зависимости и скрипты
└── README.md                # Общая документация
```

---

## Firebase структура

### Firestore Database

#### Коллекция: `catalog`

**Назначение:** Хранение каталога моделей шкафов и коэффициентов.

**Структура документа `catalog`:**

```javascript
{
  series: [
    {
      id: "ml",
      name: "ML",
      description: "Металлические шкафы общего назначения"
    },
    {
      id: "ls",
      name: "LS",
      description: "Шкафы специального назначения"
    }
  ],
  
  models: {
    "ml-21-80": {
      id: "ml-21-80",
      name: "ML-21-80",
      seriesId: "ml",
      article: "МЛ-21-80-У",
      basePrice: 12500,
      defaultSpecs: {
        width: 800,
        height: 1800,
        depth: 500,
        bodyThickness: 0.5,
        doorThickness: 0.5,
        bodyColorName: "RAL 7038",
        doorColorName: "RAL 7038",
        lockId: "rigel",
        hasVentilation: false
      },
      weight: 45,
      productionTime: 10,
      photo: "/img/ml-21-80.jpg"
    },
    // ... другие модели
  },
  
  locks: {
    "rigel": {
      id: "rigel",
      name: "Ригельный замок",
      surcharge: 0, // без доплаты
      photo: "/img/locks/rigel.jpg"
    },
    "cylinder": {
      id: "cylinder",
      name: "Цилиндровый замок",
      surcharge: 500,
      photo: "/img/locks/cylinder.jpg"
    },
    // ... другие замки
  },
  
  surcharges: {
    depth: {
      "1-9": 1.15,
      "10-49": 1.10,
      "50-99": 1.05,
      "100+": 1.00
    },
    height: {
      "1-9": 1.15,
      "10-49": 1.10,
      "50-99": 1.05,
      "100+": 1.00
    },
    bodyThickness: {
      "0.5": 1.00,
      "0.6": 1.10,
      "0.7": 1.20
    },
    doorThickness: {
      "0.5": 1.00,
      "0.6": 1.10,
      "0.7": 1.20
    },
    ventilation: {
      "1-9": 1.10,
      "10-49": 1.08,
      "50-99": 1.05,
      "100+": 1.03
    },
    color: {
      "standard": 1.00,
      "custom": 1.05
    }
  }
}
```

---

#### Коллекция: `users`

**Назначение:** Хранение дополнительных данных пользователей (роли, статус).

**Структура документа (ID = Firebase UID):**

```javascript
{
  email: "manager@promet.ru",
  role: "user", // "user" | "admin"
  isActive: true,
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

---

#### Коллекция: `history`

**Назначение:** Персональная история сгенерированных документов (КП/НЗ).

**Структура документа:**

```javascript
{
  userId: "firebase-uid",
  type: "kp", // "kp" | "nz"
  modelName: "ML-21-80",
  article: "МЛ-21-80-У",
  price: 13500,
  configSnapshot: {
    modelId: "ml-21-80",
    seriesId: "ml",
    width: 800,
    height: 2000,
    depth: 500,
    bodyThickness: 0.6,
    doorThickness: 0.5,
    bodyColor: { name: "RAL 7038", color: "#B5B8B1" },
    doorColor: { name: "RAL 7038", color: "#B5B8B1" },
    lockId: "cylinder",
    hasVentilation: true,
    quantity: 10
  },
  nzFormData: {
    managerName: "Иванов И.И.",
    clientName: "ООО Компания",
    nzNumber: "НЗ-2026-001",
    calcNumber: "Р-2026-123"
  },
  downloadedAt: Timestamp
}
```

---

### Firestore Rules

**Файл:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Каталог доступен всем авторизованным для чтения
    match /catalog/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Пользователи: чтение всем, запись только админам
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // История: пользователь видит только свою
    match /history/{docId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

### Firebase Hosting

**Файл:** `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp|svg|ico|woff|woff2|ttf|eot)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
        ]
      }
    ]
  }
}
```

---

## Модули и компоненты

### Pages (Страницы)

#### ConfiguratorPage

**Файл:** `src/pages/ConfiguratorPage/ConfiguratorPage.jsx`

**Назначение:** Главная страница — конфигуратор шкафов.

**Основные компоненты:**

- `<Configurator>` — список моделей
- `<Parameters>` — панель параметров
- `<PriceCard>` — карточка с ценой и итогами
- `<DiffCard>` — карточка изменений

---

#### AdminPage

**Файл:** `src/pages/AdminPage/AdminPage.jsx`

**Назначение:** Админ-панель для управления системой.

**Разделы:**

- Управление пользователями
- Редактирование каталога
- Настройка коэффициентов
- Drag & drop сортировка

---

#### HistoryPage

**Файл:** `src/pages/HistoryPage/HistoryPage.jsx`

**Назначение:** История сгенерированных КП и НЗ.

**Функции:**

- Просмотр истории в табличном виде
- Восстановление конфигурации
- Повторная генерация PDF
- Удаление записей

---

### Shared Components

#### AuthModal

**Файл:** `src/shared/components/AuthModal/AuthModal.jsx`

**Назначение:** Модальное окно авторизации.

**Режимы:**

- Вход (sign-in)
- Регистрация (sign-up)
- Восстановление пароля (reset-password)

---

#### Header / Footer

**Файлы:**

- `src/shared/components/Header/Header.jsx`
- `src/shared/components/Footer/Footer.jsx`

**Назначение:** Шапка и подвал приложения с навигацией.

---

### Hooks

#### useCatalog

**Файл:** `src/shared/hooks/useCatalog.js`

**Назначение:** Загрузка и кеширование каталога из Firestore.

**Возвращает:**

```javascript
{
  catalog,      // объект каталога
  isLoading,    // флаг загрузки
  error,        // ошибка загрузки
  reloadCatalog // функция принудительной перезагрузки
}
```

**Кеширование:** localStorage на 24 часа.

---

#### useHistory

**Файл:** `src/shared/hooks/useHistory.js`

**Назначение:** Работа с историей пользователя.

**Возвращает:**

```javascript
{
  history,       // массив записей
  isLoading,
  error,
  loadHistory,   // загрузить историю
  addEntry,      // добавить запись
  removeEntry,   // удалить запись
  redownloadKP,  // скачать КП заново
  redownloadNZ   // скачать НЗ заново
}
```

---

#### useConfig

**Файл:** `src/shared/hooks/useConfig.js`

**Назначение:** Управление состоянием конфигурации шкафа.

**Возвращает:**

```javascript
{
  config,          // объект конфигурации
  setConfig,       // установить конфигурацию
  updateConfig,    // обновить часть конфигурации
  resetConfig,     // сбросить к дефолтам
  price,           // рассчитанная цена
  weight,          // рассчитанный вес
  productionTime   // рассчитанный срок
}
```

---

## Бизнес-логика

### Расчёт цены

**Файл:** `src/shared/utils/calcPrice.js`

**Алгоритм:**

```
clientPrice = basePrice × (1 + Σ surchargeRates) + lockSurcharge
```

**Доплаты:**

1. **Глубина** — если отличается от стандартной:
   ```
   depthRate = surcharges.depth[quantityRange]
   ```

2. **Высота** — если отличается от стандартной:
   ```
   heightRate = surcharges.height[quantityRange]
   ```

3. **Толщина корпуса**:
   ```
   bodyThicknessRate = surcharges.bodyThickness[bodyThickness]
   ```

4. **Толщина двери**:
   ```
   doorThicknessRate = surcharges.doorThickness[doorThickness]
   ```

5. **Вентиляция**:
   ```
   ventilationRate = hasVentilation ? surcharges.ventilation[quantityRange] : 0
   ```

6. **Цвет**:
   ```
   colorRate = (bodyColorName !== defaultBodyColor || doorColorName !== defaultDoorColor)
     ? surcharges.color.custom
     : surcharges.color.standard
   ```

7. **Замок**:
   ```
   lockSurcharge = locks[lockId].surcharge
   ```

**Ограничения:**

- Изменение ширины → требует ручного расчёта
- Изменение более двух параметров одновременно → требует ручного расчёта

---

### Генерация PDF

#### Коммерческое предложение (КП)

**Файл:** `src/pdf/kp/generateCommercialOffer.js`

**Процесс:**

1. Загрузка PDF-шаблона из `public/templates/ML-X.pdf`
2. Загрузка шрифта Montserrat (кириллица)
3. Вставка текста:
   - Название модели
   - Параметры (габариты, толщина, цвет, замок, вентиляция)
   - Цена с наценкой по рентабельности
   - Срок изготовления
4. Вставка изображений:
   - Фото модели шкафа
   - Цветные квадраты RAL для корпуса/двери
   - Фото замка (если доступно)
5. Сохранение PDF

**Наценка:**

```
finalPrice = clientPrice × (1 + profitability/100)
```

---

#### Наряд-заказ (НЗ)

**Файл:** `src/pdf/nz/generateNonStandardOrder.js`

**Процесс:**

Аналогично КП, но:

- Без наценки (чистая производственная цена)
- Дополнительные поля: номер НЗ, номер расчёта
- Другой шаблон PDF

---

## API и интеграции

### Firebase SDK

**Инициализация:** `src/shared/lib/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

### Firestore API

**Файлы:** `src/shared/api/*.js`

#### loadCatalog()

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';

export async function loadCatalog() {
  const docRef = doc(db, 'catalog', 'catalog');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}
```

#### updateCatalog(data)

```javascript
import { doc, setDoc } from 'firebase/firestore';

export async function updateCatalog(data) {
  const docRef = doc(db, 'catalog', 'catalog');
  await setDoc(docRef, data, { merge: true });
}
```

---

## Безопасность

### Аутентификация

- **Firebase Authentication** — email/password
- **Роли:** хранятся в Firestore (`users` коллекция)
- **Мгновенная блокировка:** при деактивации пользователя админом сессия сбрасывается

### Firestore Security Rules

- Каталог: чтение — всем авторизованным, запись — только админам
- Пользователи: чтение — всем, запись — админам
- История: каждый видит только свою

### HTTP Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Переменные окружения

- Все Firebase credentials в `.env`
- **Никогда не коммитить `.env` в Git!**
- Использовать `.env.example` как шаблон

---

## Производительность

### Оптимизации

1. **Кеширование каталога** — localStorage на 24 часа
2. **Code splitting** — автоматически через Vite
3. **Lazy loading** — изображения и компоненты
4. **CSS Modules** — tree-shaking неиспользуемых стилей
5. **Vite build optimizations** — минификация, сжатие, tree-shaking

### Кеширование на хостинге

```
/assets/** — max-age=31536000, immutable
*.js, *.css — max-age=31536000, immutable
*.jpg, *.png, *.svg — max-age=31536000, immutable
index.html — no-cache
```

### Метрики

- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Lighthouse Score:** > 90

---

## Версионирование

**Формат:** SemVer (0.0.0)

**Текущая версия:** 1.0.0

**История версий:**

- **1.0.0** (2026-06-23) — Релиз для отдела продаж

---

## Известные ограничения

1. **Изменение ширины** — требует ручного расчёта
2. **Более 2 параметров одновременно** — требует ручного расчёта
3. **Офлайн-режим** — работает только онлайн (требуется интернет для Firestore)
4. **Браузеры** — IE11 не поддерживается

---

## Будущие улучшения

- [ ] Офлайн-режим с синхронизацией
- [ ] Push-уведомления для админов
- [ ] Экспорт истории в Excel
- [ ] Интеграция с 1C
- [ ] Мобильное приложение (React Native)

---

© 1991–2026 ООО «НПО Промет»
