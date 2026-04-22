import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, TableLayoutType, ShadingType, convertInchesToTwip,
} from 'docx';
import { writeFileSync } from 'fs';

// ── Цвета ──────────────────────────────────────────────────────────────
const BLUE      = '0C53B3';
const BLUE_LIGHT = 'E8EEF8';
const YELLOW    = 'FFF3CD';
const RED_LIGHT = 'FDE8E8';
const GRAY_HEADER = 'D9D9D9';
const GRAY_ROW   = 'F5F5F5';
const WHITE      = 'FFFFFF';

// ── Шрифт ─────────────────────────────────────────────────────────────
const FONT = 'Calibri';

// ── Helpers ───────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: BLUE })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: BLUE })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true })],
  });
}

function p(text, { bold = false, italic = false, color, size = 20, spacing = { before: 60, after: 60 } } = {}) {
  return new Paragraph({
    spacing,
    children: [new TextRun({ text, font: FONT, bold, italic, color, size })],
  });
}

function bullet(text, { bold = false } = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: FONT, size: 20, bold })],
  });
}

function sub_bullet(text) {
  return new Paragraph({
    bullet: { level: 1 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, font: FONT, size: 20 })],
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: YELLOW },
    children: [
      new TextRun({ text: '⚠ ', font: FONT, size: 20, bold: true }),
      new TextRun({ text, font: FONT, size: 20, italic: true }),
    ],
  });
}

function warn(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: RED_LIGHT },
    children: [
      new TextRun({ text: '❓ ', font: FONT, size: 20, bold: true }),
      new TextRun({ text, font: FONT, size: 20, italic: true }),
    ],
  });
}

function formula(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: BLUE_LIGHT },
    children: [new TextRun({ text, font: 'Courier New', size: 20, bold: true, color: BLUE })],
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [] });
}

function hr() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
    children: [],
  });
}

// ── Таблицы ───────────────────────────────────────────────────────────
function cell(text, { bold = false, fill = WHITE, shade = false, align = AlignmentType.LEFT, width } = {}) {
  const cellFill = shade ? GRAY_ROW : fill;
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: cellFill },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), font: FONT, size: 18, bold })],
      }),
    ],
  });
}

function headerCell(text, { align = AlignmentType.CENTER, width } = {}) {
  return cell(text, { bold: true, fill: GRAY_HEADER, align, width });
}

function makeTable(headers, rows, { colWidths } = {}) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          headerCell(h, { width: colWidths?.[i], align: AlignmentType.CENTER })
        ),
      }),
      ...rows.map((row, rowIdx) =>
        new TableRow({
          children: row.map((cellText, colIdx) =>
            cell(cellText, {
              shade: rowIdx % 2 === 1,
              width: colWidths?.[colIdx],
              align: colIdx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
            })
          ),
        })
      ),
    ],
  });
}

// ══════════════════════════════════════════════════════════════════════
// ДОКУМЕНТ
// ══════════════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 20 },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
          right: convertInchesToTwip(1),
        },
      },
    },
    children: [

      // ── ТИТУЛ ──────────────────────────────────────────────────────
      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text: 'ПРОМЕТ', font: FONT, size: 52, bold: true, color: BLUE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [new TextRun({ text: 'Конфигуратор металлических шкафов', font: FONT, size: 28, color: '444444' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
        children: [new TextRun({ text: 'Формула расчёта стоимости — техническая документация', font: FONT, size: 24, italic: true, color: '666666' })],
      }),
      hr(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 600 },
        children: [new TextRun({ text: 'Версия: апрель 2026 г.', font: FONT, size: 20, color: '888888' })],
      }),
      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── 1. ИСТОЧНИКИ ДАННЫХ ────────────────────────────────────────
      h1('1. Источники данных'),
      p('Все данные для расчёта берутся из двух листов Google Sheets, которые синхронизируются с базой данных Firebase через скрипт sync-sheets.js.'),
      spacer(),

      h2('1.1 Лист «Модели» — базовые данные каждого шкафа'),
      makeTable(
        ['Столбец', 'Поле', 'Описание'],
        [
          ['B', 'article', 'Артикул'],
          ['C', 'name', 'Наименование'],
          ['D', 'id', 'Уникальный ID модели'],
          ['E', 'seriesId', 'Серия: ml или ls'],
          ['J', 'basePrice', 'Цена Min (₽) — минимальная клиентская цена за стандартное исполнение'],
          ['P', 'cpBezNDS', 'ЦП без НДС (₽) — заводская цена'],
          ['N', 'doorWeight', 'Вес дверей (кг)'],
          ['O', 'bodyWeight', 'Вес корпуса (кг)'],
          ['Q', 'doorCount', 'Количество дверей (секций): 1, 2, 4 и т.д.'],
          ['G', 'height', 'Стандартная высота (мм)'],
          ['H', 'width', 'Стандартная ширина (мм)'],
          ['I', 'depth', 'Стандартная глубина (мм)'],
          ['K', 'bodyThickness', 'Стандартная толщина корпуса (мм)'],
          ['L', 'doorThickness', 'Стандартная толщина двери (мм)'],
        ],
        { colWidths: [8, 18, 74] }
      ),
      spacer(),

      h2('1.2 Лист «Price» — коэффициенты доплат'),
      p('Содержит все процентные ставки и фиксированные суммы доплат. Читается скриптом и записывается в Firebase в поле priceRules. Изменение коэффициентов в Google Sheets требует повторного запуска sync-sheets.js.'),
      spacer(),
      hr(),

      // ── 2. ПАРАМЕТРЫ КОНФИГУРАЦИИ ──────────────────────────────────
      h1('2. Параметры конфигурации'),
      p('Менеджер задаёт следующие параметры в конфигураторе:'),
      spacer(),
      makeTable(
        ['Параметр', 'Допустимые значения', 'По умолчанию', 'Описание'],
        [
          ['Количество', 'Целое число ≥ 1', '10', 'Количество шкафов в заказе'],
          ['Скидка', '0% — 50%', '0%', 'Скидка для клиента (не влияет на заводскую цену)'],
          ['Толщина корпуса', '0.5 / 0.6 / 0.7 мм', 'Из модели', 'Толщина листового металла корпуса'],
          ['Толщина двери', '0.5 / 0.6 / 0.7 мм', 'Из модели', 'Толщина листового металла дверей'],
          ['Высота', '1400 — 2000 мм', 'Из модели', 'Высота шкафа'],
          ['Глубина', 'от 300 мм', 'Из модели', 'Глубина шкафа'],
          ['Ширина', 'стандарт ± 50 мм', 'Из модели', 'Доплата за изменение ширины отсутствует'],
          ['Замок', 'key_basic / 4 варианта', 'key_basic (ключевой)', 'Тип замка'],
          ['Вентиляция', 'нет / крыша / крыша+дно / крыша+дно+труба', 'Нет', 'Тип вентиляции'],
          ['Цвет двери', 'null / кат. 1 / кат. 2 / кат. 3', 'Стандарт (null)', 'Нестандартный RAL цвет дверей'],
          ['Цвет корпуса', 'null / кат. 1 / кат. 2 / кат. 3', 'Стандарт (null)', 'Нестандартный RAL цвет всего корпуса'],
        ],
        { colWidths: [18, 28, 18, 36] }
      ),
      spacer(),
      hr(),

      // ── 3. КОЛИЧЕСТВО ИСПОЛНЕНИЙ ───────────────────────────────────
      h1('3. Подсчёт количества исполнений'),
      p('Исполнение — любое отклонение хотя бы одного параметра от стандарта модели.'),
      spacer(),
      p('Важное правило по толщине:', { bold: true }),
      bullet('Изменение толщины корпуса + толщины двери считается как 1 исполнение (даже если изменены оба)'),
      spacer(),
      makeTable(
        ['Изменение', 'Счёт исполнений'],
        [
          ['Толщина корпуса и/или двери', '1 (оба вместе = 1)'],
          ['Нестандартная глубина', '1'],
          ['Нестандартная высота', '1'],
          ['Замок (не «Ключевой базовый»)', '1'],
          ['Вентиляция (любой тип)', '1'],
          ['Нестандартный цвет двери', '1'],
          ['Нестандартный цвет корпуса', '1'],
          ['Ширина нестандартная', '0 (доплата не взимается)'],
        ],
        { colWidths: [70, 30] }
      ),
      spacer(),

      new Paragraph({
        spacing: { before: 80, after: 80 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: BLUE_LIGHT },
        children: [
          new TextRun({ text: 'Лимит: ', font: FONT, size: 20, bold: true }),
          new TextRun({ text: 'до 2 исполнений включительно — цена рассчитывается автоматически.', font: FONT, size: 20 }),
          new TextRun({ text: ' 3 и более исполнений — выводится «По согласованию с производством».', font: FONT, size: 20, bold: true }),
        ],
      }),
      spacer(),
      hr(),

      // ── 4. ДОПЛАТЫ (ПРОЦЕНТЫ) ─────────────────────────────────────
      h1('4. Расчёт итоговой наценки (totalRate)'),
      p('Каждое изменение добавляет процент к базовой цене. Итоговая наценка = сумма всех отдельных доплат.'),
      formula('totalRate = Σ (доплата за каждое активное изменение)'),
      p('Все проценты хранятся в Firebase и редактируются через Google Sheets → запуск sync-sheets.js.', { italic: true, color: '666666' }),
      spacer(),

      h2('4.1 Доплата за толщину металла'),
      p('Минимальное количество: 100 шт. При меньшем — «По согласованию».'),
      spacer(),
      makeTable(
        ['Толщина', 'Ставка (от 100 шт.)'],
        [
          ['0.5 мм', '0% (стандарт)'],
          ['0.6 мм', '10%'],
          ['0.7 мм', '25%'],
        ],
        { colWidths: [50, 50] }
      ),
      spacer(),
      warn('В таблице Google Sheets для 0.5 мм указана ставка 10%, а не 0%. Если 0.5 мм — стандарт, то ставка должна быть 0%. Требует уточнения у экономистов.'),
      spacer(),
      p('Расчёт пропорциональный — с учётом долей веса:', { bold: true }),
      spacer(),
      makeTable(
        ['Ситуация', 'Формула доплаты'],
        [
          ['Изменена только дверь', 'ставка_двери × (вес_двери / общий_вес)'],
          ['Изменён только корпус', 'ставка_корпуса × (вес_корпуса / общий_вес)'],
          ['Оба изменены на одну и ту же толщину', 'ставка (полная, без пропорции)'],
          ['Оба изменены на разную толщину', 'ставка_двери × (вес_двери / вес_всего) + ставка_корпуса × (вес_корпуса / вес_всего)'],
        ],
        { colWidths: [40, 60] }
      ),
      spacer(),

      h2('4.2 Доплата за нестандартную глубину'),
      p('При количестве менее 10 шт. — «По согласованию» (ПСС по запросу).'),
      spacer(),
      makeTable(
        ['Глубина', 'ML — от 10', 'ML — от 50', 'ML — от 100', 'LS — от 10', 'LS — от 50', 'LS — от 100'],
        [
          ['300 мм', '46%', '36%', '26%', '49%', '39%', '29%'],
          ['400 мм', '47%', '37%', '27%', '54%', '44%', '34%'],
          ['450 мм', '49%', '39%', '29%', '57%', '47%', '37%'],
        ],
        { colWidths: [14, 14, 14, 15, 14, 14, 15] }
      ),
      spacer(),
      note('Стандартная глубина модели — доплата 0%. Другие значения глубины (вне таблицы) → «По согласованию».'),
      spacer(),

      h2('4.3 Доплата за нестандартную высоту'),
      p('Минимальное количество: 100 шт. При меньшем — «По согласованию».'),
      spacer(),
      makeTable(
        ['Высота', 'ML-серия (от 100 шт.)', 'LS-серия (от 100 шт.)'],
        [
          ['1800 мм', '20%', '16%'],
          ['1850 мм', '22%', '18%'],
          ['1860 мм', '22%', '18%'],
          ['1900 мм', '23%', '19%'],
          ['2000 мм', '26%', '22%'],
        ],
        { colWidths: [30, 35, 35] }
      ),
      spacer(),
      note('Стандартная высота модели — доплата 0%. Другие значения (напр. 1700 мм, 1950 мм) → «По согласованию».'),
      spacer(),

      h2('4.4 Доплата за вентиляцию'),
      spacer(),
      makeTable(
        ['Тип вентиляции', 'до 10 шт.', 'от 10 шт.', 'от 50 шт.', 'от 100 шт.'],
        [
          ['Только крыша', '57%', '27%', '17%', 'не заполнено'],
          ['Крыша + дно', '59%', '30%', '19%', 'не заполнено'],
          ['Крыша + дно + труба', '62%', '32%', '20%', 'не заполнено'],
        ],
        { colWidths: [34, 16, 16, 16, 18] }
      ),
      spacer(),
      warn('Ставка вентиляции от 100 шт. не заполнена в таблице. Требует уточнения у экономистов.'),
      spacer(),

      h2('4.5 Доплата за нестандартный цвет двери (RAL)'),
      p('Цвета разделены на 3 категории в зависимости от сложности производства.'),
      spacer(),
      makeTable(
        ['Категория', 'Цвета', 'Мин. кол-во', 'Ставки'],
        [
          ['Кат. 1 — Базовые', 'RAL 7038, 5002 шагрень, 9003 гладкая, 7035 муар, 7016 гладкая', '30 шт.', 'от 30 шт.: 5% / от 51 шт.: 6% / от 101 шт.: 20%'],
          ['Кат. 2 — Популярные', 'RAL 6018, 5012, 3000', '50 шт.', 'от 50 шт.: 6%'],
          ['Кат. 3 — Яркие', 'RAL 1016, 1018, 4006, 2008', '50 шт.', 'от 50 шт.: 8%'],
        ],
        { colWidths: [18, 36, 18, 28] }
      ),
      spacer(),
      note('Если количество шкафов ниже минимума — выбор цвета скрыт в интерфейсе (недоступен).'),
      spacer(),

      h2('4.6 Доплата за нестандартный цвет корпуса (RAL, полностью)'),
      spacer(),
      makeTable(
        ['Категория', 'Мин. кол-во', 'Ставки'],
        [
          ['Кат. 1 — Базовые', '50 шт.', 'от 50 шт.: 20%'],
          ['Кат. 2 — Популярные', '50 шт.', 'от 50 шт.: 20%'],
          ['Кат. 3 — Яркие', '50 шт.', 'от 50 шт.: 30%'],
        ],
        { colWidths: [35, 25, 40] }
      ),
      spacer(),
      warn('В таблице у кат. 3 (корпус) две строки: от 50 шт. = 30% и от 51 шт. = 20%. Это выглядит как опечатка. Требует уточнения.'),
      spacer(),
      hr(),

      // ── 5. ЗАМОК ───────────────────────────────────────────────────
      h1('5. Доплата за нестандартный замок (фиксированная, ₽)'),
      p('Замок НЕ входит в процентную наценку. Его доплата прибавляется к цене в рублях после применения всех процентов.'),
      spacer(),
      makeTable(
        ['Замок', 'Односекционный', 'За 2-секционный шкаф', 'За 4-секционный шкаф'],
        [
          ['Ключевой (Базовый)', '0 ₽', '0 ₽', '0 ₽'],
          ['D111X-20-01/C247/J9Z', '150 ₽', '280 ₽', '560 ₽'],
          ['Практик EL Code', '170 ₽', '330 ₽', '660 ₽'],
          ['Euro Locks A129', '195 ₽', '370 ₽', '740 ₽'],
          ['Практик EL Mifare', '120 ₽', '200 ₽', '400 ₽'],
        ],
        { colWidths: [34, 22, 22, 22] }
      ),
      spacer(),
      p('Формула расчёта доплаты за замок:', { bold: true }),
      formula('Если 1 дверь: lockSurcharge = цена_1секц'),
      formula('Если 2 двери и более: lockSurcharge = цена_2секц × (кол-во_дверей / 2)'),
      spacer(),
      note('Пример: 4-секционный шкаф с замком Практик EL Code → 330 ₽ × (4/2) = 660 ₽'),
      spacer(),
      hr(),

      // ── 6. ИТОГОВЫЕ ФОРМУЛЫ ────────────────────────────────────────
      h1('6. Итоговые формулы расчёта'),
      spacer(),

      h2('6.1 Клиентская цена (Цена Min)'),
      formula('Цена клиента = ROUND(basePrice × (1 + totalRate) + lockSurcharge) × (1 - скидка / 100)'),
      spacer(),
      makeTable(
        ['Переменная', 'Источник', 'Описание'],
        [
          ['basePrice', 'Лист «Модели», столбец J', 'Цена Min — минимальная стоимость стандартного шкафа'],
          ['totalRate', 'Сумма доплат из разделов 4.1–4.6', 'Итоговый процент всех изменений (в виде дроби: 10% = 0.10)'],
          ['lockSurcharge', 'Лист «Price», замки', 'Фиксированная доплата за замок в рублях'],
          ['скидка', 'Вводит менеджер (0–50%)', 'Скидка для клиента в процентах'],
        ],
        { colWidths: [20, 35, 45] }
      ),
      spacer(),

      h2('6.2 Заводская цена (ЦП без НДС)'),
      formula('Цена заводская = ROUND(cpBezNDS × (1 + totalRate) + lockSurcharge)'),
      spacer(),
      makeTable(
        ['Переменная', 'Источник', 'Описание'],
        [
          ['cpBezNDS', 'Лист «Модели», столбец P', 'ЦП без НДС — заводская базовая стоимость'],
        ],
        { colWidths: [20, 35, 45] }
      ),
      spacer(),
      note('Скидка к заводской цене НЕ применяется.'),
      spacer(),

      h2('6.3 Пересчёт веса при изменении толщины'),
      formula('Вес = ROUND(вес_дверей × K_дверь + вес_корпуса × K_корпус, 2)'),
      spacer(),
      makeTable(
        ['Толщина', 'Коэффициент K', 'Прирост веса'],
        [
          ['0.5 мм', '1.000', 'стандарт (база)'],
          ['0.6 мм', '1.333', '+33.3%'],
          ['0.7 мм', '1.556', '+55.6%'],
        ],
        { colWidths: [33, 33, 34] }
      ),
      spacer(),

      h2('6.4 Срок изготовления'),
      spacer(),
      makeTable(
        ['Количество исполнений', 'Срок'],
        [
          ['0 (стандартное исполнение)', '—'],
          ['1', '7–14 дней'],
          ['2', '14–21–30 дней'],
          ['3 и более', 'По согласованию с производством'],
        ],
        { colWidths: [55, 45] }
      ),
      spacer(),
      hr(),

      // ── 7. КОГДА ЦЕНА НЕ СЧИТАЕТСЯ ────────────────────────────────
      h1('7. Когда цена не считается автоматически'),
      p('Система выводит «По согласованию с производством» в следующих случаях:'),
      spacer(),
      bullet('Более 2 исполнений одновременно'),
      bullet('Нестандартная глубина при количестве менее 10 шт.'),
      bullet('Нестандартная высота при количестве менее 100 шт.'),
      bullet('Нестандартная толщина при количестве менее 100 шт.'),
      bullet('Высота или глубина, которых нет в таблице коэффициентов'),
      bullet('Вентиляция при количестве 100 шт. и более (ставка не заполнена)'),
      spacer(),
      hr(),

      // ── 8. ПРИМЕР ─────────────────────────────────────────────────
      h1('8. Пример расчёта'),
      spacer(),
      p('Исходные данные модели:', { bold: true }),
      bullet('Модель: МЛ-186 (ML-серия)'),
      bullet('Цена Min (basePrice): 12 000 ₽'),
      bullet('ЦП без НДС (cpBezNDS): 8 000 ₽'),
      bullet('Вес дверей: 15 кг, вес корпуса: 35 кг (итого 50 кг)'),
      bullet('Стандартная глубина: 400 мм, стандартная высота: 1600 мм'),
      bullet('Количество дверей (doorCount): 2'),
      spacer(),
      p('Параметры конфигурации:', { bold: true }),
      bullet('Количество: 50 шт.'),
      bullet('Глубина: 450 мм  →  нестандарт (1-е исполнение)'),
      bullet('Замок: Практик EL Code  →  (2-е исполнение)'),
      bullet('Скидка: 5%'),
      spacer(),
      p('Пошаговый расчёт:', { bold: true }),
      spacer(),
      makeTable(
        ['Шаг', 'Действие', 'Результат'],
        [
          ['1', 'Подсчёт исполнений: глубина (1) + замок (1)', '2 → считаем автоматически'],
          ['2', 'Доплата за глубину ML, 450 мм, 50 шт.', '39% = 0.39'],
          ['3', 'totalRate = 0.39 (замок не процент)', '0.39'],
          ['4', 'Доплата за замок: 330 ₽ × (2/2)', 'lockSurcharge = 330 ₽'],
          ['5', 'Цена клиента: ROUND(12 000 × 1.39 + 330) × (1 − 0.05)', '= ROUND(17 010) × 0.95 = 16 160 ₽'],
          ['6', 'Цена заводская: ROUND(8 000 × 1.39 + 330)', '= ROUND(11 450) = 11 450 ₽'],
          ['7', 'Вес (толщина стандарт 0.5 мм): 15 × 1.0 + 35 × 1.0', '= 50 кг'],
          ['8', 'Срок: 2 исполнения', '14–21–30 дней'],
        ],
        { colWidths: [8, 60, 32] }
      ),
      spacer(),
      hr(),

      // ── 9. ВОПРОСЫ К ЭКОНОМИСТАМ ───────────────────────────────────
      h1('9. Вопросы к экономистам — требуют уточнения'),
      spacer(),
      makeTable(
        ['№', 'Вопрос', 'Статус'],
        [
          ['1', 'Толщина 0.5 мм — в таблице ставка 10%, должна быть 0%?', '❓ Уточнить'],
          ['2', 'Вентиляция от 100 шт. — какая ставка?', '❓ Уточнить'],
          ['3', 'Цвет корпуса кат. 3: от 50 шт. = 30%, от 51 шт. = 20% — это верно или опечатка?', '❓ Уточнить'],
          ['4', 'Изменение ширины — подтвердить что доплата отсутствует', '❓ Подтвердить'],
          ['5', 'Нестандартная высота/глубина вне таблицы — всегда «По согласованию»?', '❓ Подтвердить'],
          ['6', 'Лимит 2 исполнения — начиная с 3-го всегда ПСС?', '❓ Подтвердить'],
        ],
        { colWidths: [8, 76, 16] }
      ),
      spacer(),
      spacer(),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: '─────────────────────────────────────────────', font: FONT, size: 18, color: 'AAAAAA' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: 'Документ сгенерирован автоматически на основе кода calcPrice.js и sync-sheets.js', font: FONT, size: 16, italic: true, color: 'AAAAAA' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 0 },
        children: [new TextRun({ text: 'При изменении формулы — обновить документ заново', font: FONT, size: 16, italic: true, color: 'AAAAAA' })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('docs/Формула расчёта цены — Промет.docx', buffer);
console.log('✅ Документ создан: docs/Формула расчёта цены — Промет.docx');
