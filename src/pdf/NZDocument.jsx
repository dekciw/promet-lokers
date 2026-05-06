import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { buildNZParams } from '../shared/utils/buildNZParams.js';

// ВАЖНО про шрифты:
// fontFamily: 'Roboto' — работает только если './fonts.js' уже был
// импортирован (side-effect Font.register). generateNZ.js делает это.

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    padding: '15mm 12mm',
    lineHeight: 1.3,
    color: '#000',
  },
  // ── Шапка ────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logo: { width: 80, height: 30, objectFit: 'contain' },
  headerMeta: { fontSize: 7, textAlign: 'right' },
  // ── Заголовок ───────────────────────────────
  title: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    marginVertical: 8,
    textTransform: 'uppercase',
  },
  // ── Approval block (правый верх) ────────────
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    fontSize: 8,
  },
  approvalCol: { marginLeft: 12 },
  // ── Section heading ─────────────────────────
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#e8e8e8',
    padding: '3pt 4pt',
    marginTop: 8,
    marginBottom: 4,
  },
  // ── Field rows (label + value подчёркнутое) ─
  fieldRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end' },
  fieldLabel: { fontSize: 9, marginRight: 4 },
  fieldValue: {
    fontSize: 9,
    fontWeight: 500,
    flex: 1,
    borderBottom: '0.5pt solid #000',
    paddingBottom: 1,
    minHeight: 12,
  },
  // ── Table (Row 3) ───────────────────────────
  // border-collapse через negative margin
  table: { flexDirection: 'column', marginTop: 4 },
  row: { flexDirection: 'row', marginTop: -0.5 },
  cell: {
    border: '0.5pt solid #000',
    padding: '3pt 4pt',
    fontSize: 8,
    marginLeft: -0.5,
  },
  cellHeader: { fontWeight: 700, backgroundColor: '#f0f0f0' },
  // Колонки таблицы строки 3 (8 колонок)
  colArticle:  { width: '14%' },
  colName:     { width: '20%' },
  colQty:      { width: '8%',  textAlign: 'center' },
  colPrice:    { width: '12%' },
  colExec:     { width: '8%' },
  colTransfer: { width: '14%' },
  colWeight:   { width: '12%' },
  colVolume:   { width: '12%' },
  // ── Row 6 — список параметров ──────────────
  paramsBlock: { marginTop: 6 },
  paramRow: { flexDirection: 'row', marginBottom: 2 },
  paramLabel: { fontSize: 9, width: 110 },
  paramValue: { fontSize: 9, flex: 1 },
  paramValueNonStd: { fontWeight: 700 },
  nonStdMark: { fontSize: 8, color: '#000', marginLeft: 4, fontWeight: 700 },
  // ── Empty signature block ───────────────────
  emptyLine: {
    borderBottom: '0.5pt solid #000',
    height: 14,
    marginBottom: 6,
  },
});

function fmtDate(d = new Date()) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

export default function NZDocument({ config, catalog, managerName, clientName }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const params = buildNZParams(config, catalog);
  const qty = config.quantity ?? 10;
  const today = fmtDate();

  return (
    <Document title='Сопроводительный лист НЗ'>
      {/* ════════ СТРАНИЦА 1 ════════ */}
      <Page size='A4' style={styles.page}>
        <View style={styles.headerRow}>
          <Image src='/img/logo.png' style={styles.logo} />
          <View style={styles.headerMeta}>
            <Text>UZTF 42009.1-2</Text>
            <Text>Редакция 6</Text>
            <Text>09.01.2025</Text>
          </View>
        </View>

        <View style={styles.approvalRow}>
          <Text style={styles.approvalCol}>Согласовано: ____________</Text>
          <Text style={styles.approvalCol}>Утверждаю: ____________</Text>
        </View>
        <View style={styles.approvalRow}>
          <Text style={styles.approvalCol}>Лист НЗ № ____</Text>
          <Text style={styles.approvalCol}>Расчёт № ____</Text>
        </View>

        <Text style={styles.title}>
          Сопроводительный лист нестандартного заказа
        </Text>

        <Text style={styles.sectionTitle}>I. Менеджер по продажам</Text>

        {/* Строка 1 */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>1. Менеджер по продажам (Ф.И.О.):</Text>
          <Text style={styles.fieldValue}>{managerName ?? ''}</Text>
        </View>

        {/* Строка 2 */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>2. Название Клиента (страна):</Text>
          <Text style={styles.fieldValue}>{clientName ?? ''}</Text>
        </View>

        {/* Строка 3 — таблица */}
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.cellHeader, styles.colArticle]}>Артикул</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colName]}>Наименование</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colPrice]}>Цена Таргет</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colExec]}>Исп.</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colTransfer]}>Цена передачи</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colWeight]}>Вес</Text>
            <Text style={[styles.cell, styles.cellHeader, styles.colVolume]}>Объём</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.colArticle]}>{model?.article ?? ''}</Text>
            <Text style={[styles.cell, styles.colName]}>{model?.name ?? ''}</Text>
            <Text style={[styles.cell, styles.colQty]}>{qty}</Text>
            <Text style={[styles.cell, styles.colPrice]}> </Text>
            <Text style={[styles.cell, styles.colExec]}> </Text>
            <Text style={[styles.cell, styles.colTransfer]}> </Text>
            <Text style={[styles.cell, styles.colWeight]}> </Text>
            <Text style={[styles.cell, styles.colVolume]}> </Text>
          </View>
        </View>

        {/* Строки 4, 5, 5.1 — пустые поля */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>4. Адрес доставки:</Text>
          <Text style={styles.fieldValue}> </Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>5. Сроки изготовления:</Text>
          <Text style={styles.fieldValue}> </Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>5.1. Условия отгрузки:</Text>
          <Text style={styles.fieldValue}> </Text>
        </View>

        {/* Строка 6 — отличия от серийной продукции */}
        <Text style={styles.sectionTitle}>6. Отличия от серийной продукции</Text>
        <View style={styles.paramsBlock}>
          {params.map(p => (
            <View key={p.label} style={styles.paramRow}>
              <Text style={styles.paramLabel}>{p.label}:</Text>
              <Text style={[styles.paramValue, p.isNonStandard && styles.paramValueNonStd]}>
                {p.value}
                {p.isNonStandard ? <Text style={styles.nonStdMark}> (нестандарт)</Text> : null}
              </Text>
            </View>
          ))}
        </View>

        {/* Строки 7, 8 — пустые */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>7. Дополнительные требования:</Text>
          <Text style={styles.fieldValue}> </Text>
        </View>
        <View style={[styles.fieldRow, { marginTop: 8 }]}>
          <Text style={styles.fieldLabel}>8. Подпись менеджера: ____________</Text>
          <Text style={styles.fieldLabel}>Дата: {today}</Text>
        </View>
      </Page>

      {/* ════════ СТРАНИЦА 2 ════════ */}
      <Page size='A4' style={styles.page}>
        <Text style={styles.sectionTitle}>II. Конструкторская группа</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />

        <Text style={styles.sectionTitle}>II.1. Технологический отдел</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />

        <Text style={styles.sectionTitle}>II.2. Отдел закупок</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />

        <Text style={styles.sectionTitle}>II.3. Начальник участка</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />

        <Text style={styles.sectionTitle}>III. Начальник производства</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />

        <Text style={styles.sectionTitle}>IV. Служба качества</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />

        <Text style={styles.sectionTitle}>V. Ведущий специалист ПО</Text>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
      </Page>
    </Document>
  );
}
