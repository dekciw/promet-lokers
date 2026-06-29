#!/bin/bash

# Скрипт для подготовки проекта к передаче заказчику
# Использование: bash package-for-handover.sh

set -e

echo "🚀 Подготовка проекта Промет к передаче заказчику..."
echo ""

# Получаем текущую дату для имён файлов
DATE=$(date +%Y%m%d)
OUTPUT_DIR="$HOME/Desktop/promet-handover-$DATE"

# Создаём папку для выходных файлов
mkdir -p "$OUTPUT_DIR"

# Шаг 1: Сборка проекта
echo "📦 Шаг 1/5: Сборка production-версии..."
npm run build

# Шаг 2: Архив dist (готовый сайт)
echo "📦 Шаг 2/5: Создание архива dist (готовый сайт)..."
cd dist
zip -r "$OUTPUT_DIR/promet-dist-$DATE.zip" . > /dev/null
cd ..
echo "   ✅ Создан: promet-dist-$DATE.zip"

# Шаг 3: Архив исходников
echo "📦 Шаг 3/5: Создание архива исходников..."
tar -czf "$OUTPUT_DIR/promet-source-$DATE.tar.gz" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='.DS_Store' \
  --exclude='.firebase' \
  --exclude='package-for-handover.sh' \
  . > /dev/null
echo "   ✅ Создан: promet-source-$DATE.tar.gz"

# Шаг 4: Копирование документации
echo "📦 Шаг 4/5: Копирование документации..."
cp QUICK_START.md "$OUTPUT_DIR/"
cp README.md "$OUTPUT_DIR/"
cp -r docs "$OUTPUT_DIR/"
echo "   ✅ Документация скопирована"

# Шаг 5: Создание примера .env для заказчика
echo "📦 Шаг 5/5: Создание FIREBASE_CONFIG_EXAMPLE.txt..."
cat > "$OUTPUT_DIR/FIREBASE_CONFIG_EXAMPLE.txt" << 'EOF'
# Эти значения нужно заполнить и переименовать в .env

VITE_FIREBASE_API_KEY=ваш_api_key_из_firebase_console
VITE_FIREBASE_AUTH_DOMAIN=ваш_проект.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ваш_проект_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_проект.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id

# Где взять значения:
# 1. Откройте https://console.firebase.google.com/
# 2. Выберите проект
# 3. Project Settings → Your apps → Web app
# 4. Скопируйте значения из firebaseConfig
EOF
echo "   ✅ Создан: FIREBASE_CONFIG_EXAMPLE.txt"

# Создание инструкции README для папки передачи
cat > "$OUTPUT_DIR/README.txt" << EOF
═══════════════════════════════════════════════════════════════
  ПРОЕКТ: Конфигуратор металлических шкафов «Промет»
  ДАТА ПЕРЕДАЧИ: $(date +%d.%m.%Y)
═══════════════════════════════════════════════════════════════

📦 СОДЕРЖИМОЕ АРХИВА:

1. promet-dist-$DATE.zip
   → Готовый сайт для загрузки на хостинг
   → Распакуйте и загрузите содержимое на веб-сервер
   → Или используйте Firebase Hosting (см. ниже)

2. promet-source-$DATE.tar.gz
   → Полный исходный код для разработки
   → Распакуйте, установите зависимости (npm install)
   → Следуйте инструкциям в QUICK_START.md

3. QUICK_START.md
   → Краткая инструкция по запуску проекта
   → Читайте ПЕРВЫМ!

4. README.md
   → Обзор проекта, возможности, структура

5. docs/
   → Полная документация:
     - DEPLOYMENT.md — развёртывание на Firebase
     - ARCHITECTURE.md — структура кода
     - FIREBASE_SETUP.md — настройка Firebase
     - PDF_GENERATION.md — генерация документов
     - ADMIN_PANEL.md — работа с админкой

6. FIREBASE_CONFIG_EXAMPLE.txt
   → Пример файла .env с переменными Firebase
   → Заполните реальными значениями из Firebase Console

═══════════════════════════════════════════════════════════════
  БЫСТРЫЙ СТАРТ
═══════════════════════════════════════════════════════════════

1. Распакуйте promet-source-$DATE.tar.gz
2. Откройте QUICK_START.md
3. Следуйте пошаговой инструкции

═══════════════════════════════════════════════════════════════
  ВАЖНО!
═══════════════════════════════════════════════════════════════

⚠️ Для работы проекта необходим доступ к Firebase Console.
   Убедитесь, что вы добавлены как Owner проекта в Firebase.

⚠️ Переменные окружения (Firebase config) передаются ОТДЕЛЬНО
   через защищённый канал связи.

⚠️ Не коммитьте файл .env в публичный репозиторий!

═══════════════════════════════════════════════════════════════

© 1991–2026 ООО «НПО Промет»
EOF

echo ""
echo "✅ Готово! Все файлы находятся в папке:"
echo "   $OUTPUT_DIR"
echo ""
echo "📂 Содержимое:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
echo ""
echo "📧 Передайте заказчику:"
echo "   1. Всю папку promet-handover-$DATE/"
echo "   2. Доступ к Firebase Console (добавьте email как Owner)"
echo "   3. Переменные .env через защищённый канал"
echo ""
echo "🎉 Проект готов к передаче!"
