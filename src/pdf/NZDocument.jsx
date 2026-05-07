import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { buildNZParams } from '../shared/utils/buildNZParams.js';

const BLUE = '#003087';
const LGRAY = '#f0f0f0';
const BRD = '0.5pt solid #000';

// Колонки строки 3: суммарно 100%
// Менеджер: 15+20+8=43%  Экономист: 14+7+14=35%  Технолог: 11+11=22%
const CW = ['15%', '20%', '8%', '14%', '7%', '14%', '11%', '11%'];

const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 8,
    padding: '7mm 10mm 10mm',
    color: '#000',
  },
  topRef: { textAlign: 'right', fontSize: 7, color: '#666', marginBottom: 2 },
  // Header
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  titleBlock: { flex: 1, paddingRight: 8 },
  mainTitle: { fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', lineHeight: 1.2 },
  forService: { fontSize: 7.5, color: '#555', marginTop: 2 },
  logo: { width: 72, height: 26, objectFit: 'contain' },
  // Блоки подписей
  sigRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  sigBlock: { width: 148, marginLeft: 14, fontSize: 7.5 },
  sigBold: { fontWeight: 700 },
  sigLine: { borderBottom: BRD, height: 13, marginTop: 2, marginBottom: 1 },
  sigDate: { fontSize: 7 },
  // Чекбокс строка
  chkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2, fontSize: 8 },
  chkBox: { width: 8, height: 8, border: BRD, marginLeft: 5, marginRight: 2 },
  // Строка НЗ №
  nzLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTop: BRD, borderBottom: BRD,
    padding: '2pt 0', marginBottom: 2,
    fontSize: 8.5, fontWeight: 700,
  },
  // Заголовок секции
  secHdr: { backgroundColor: BLUE, color: '#fff', fontWeight: 700, fontSize: 7.5, padding: '2pt 4pt' },
  // Основная таблица
  tbl: { border: BRD },
  tr: { flexDirection: 'row', borderBottom: BRD, minHeight: 14 },
  trLast: { flexDirection: 'row', minHeight: 14 },
  tdLbl: { width: '30%', borderRight: BRD, padding: '2pt 3pt', fontSize: 7.5 },
  tdVal: { flex: 1, padding: '2pt 4pt', fontSize: 8 },
  // Вложенная таблица строки 3
  nt: { flex: 1 },
  ntShRow: { flexDirection: 'row', borderBottom: BRD, backgroundColor: LGRAY },
  ntColRow: { flexDirection: 'row', borderBottom: BRD, backgroundColor: '#f8f8f8' },
  ntDataRow: { flexDirection: 'row' },
  ntSh: { textAlign: 'center', fontWeight: 700, fontSize: 6.5, padding: '1pt 1pt', borderRight: BRD },
  ntShLast: { textAlign: 'center', fontWeight: 700, fontSize: 6.5, padding: '1pt 1pt' },
  ntCol: { textAlign: 'center', fontSize: 6, padding: '1pt 1pt', borderRight: BRD, color: '#444' },
  ntColLast: { textAlign: 'center', fontSize: 6, padding: '1pt 1pt', color: '#444' },
  ntData: { fontSize: 7.5, padding: '2pt 2pt', borderRight: BRD },
  ntDataLast: { fontSize: 7.5, padding: '2pt 2pt' },
  // Строка 6 параметры
  paramsWrap: { flex: 1, padding: '2pt 3pt' },
  paramRow: { flexDirection: 'row', marginBottom: 1 },
  paramLbl: { fontSize: 7.5, width: 100 },
  paramVal: { fontSize: 7.5, flex: 1 },
  paramBold: { fontWeight: 700 },
  // Нижняя часть страницы 1
  sigDateLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, fontSize: 8 },
  secIINote: { marginTop: 2, fontSize: 7.5, fontWeight: 700, color: BLUE, borderTop: '0.5pt solid ' + BLUE, paddingTop: 2 },
  // Подвал
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTop: '0.3pt solid #aaa', paddingTop: 2,
    marginTop: 6, fontSize: 7, color: '#666',
  },
  // Страница 2
  p2SecTitle: { backgroundColor: BLUE, color: '#fff', fontWeight: 700, fontSize: 8, padding: '3pt 4pt', marginTop: 6, marginBottom: 2 },
  p2SubTitle: { fontWeight: 700, fontSize: 7.5, backgroundColor: LGRAY, padding: '2pt 4pt', marginTop: 4, marginBottom: 2 },
  p2RowTitle: { fontSize: 7.5, fontWeight: 700, marginTop: 4, marginBottom: 2 },
  p2FieldText: { fontSize: 7.5, marginBottom: 4 },
  // Строка подписи: ФИО / подпись / дата
  p2SigWrap: { marginBottom: 6, marginTop: 2 },
  p2SigLine: { flexDirection: 'row', fontSize: 7.5 },
  p2SigCell: { flex: 1, borderBottom: BRD, paddingBottom: 1, marginRight: 6 },
  p2SigCellLast: { flex: 1, borderBottom: BRD, paddingBottom: 1 },
  p2SigLabelRow: { flexDirection: 'row', marginTop: 1 },
  p2SigLabel: { flex: 1, textAlign: 'center', fontSize: 6.5, color: '#555', marginRight: 6 },
  p2SigLabelLast: { flex: 1, textAlign: 'center', fontSize: 6.5, color: '#555' },
});

function fmtDate(d = new Date()) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function SigBlock() {
  return (
    <View style={s.p2SigWrap}>
      <View style={s.p2SigLine}>
        <View style={s.p2SigCell} />
        <View style={s.p2SigCell} />
        <View style={s.p2SigCellLast} />
      </View>
      <View style={s.p2SigLabelRow}>
        <Text style={s.p2SigLabel}>ФИО</Text>
        <Text style={s.p2SigLabel}>подпись</Text>
        <Text style={s.p2SigLabelLast}>дата</Text>
      </View>
    </View>
  );
}

export default function NZDocument({ config, catalog, managerName, clientName }) {
  const model = config.modelId ? catalog.models?.[config.modelId] : null;
  const params = buildNZParams(config, catalog);
  const qty = config.quantity ?? 1;
  const today = fmtDate();

  return (
    <Document title='Сопроводительный лист НЗ'>

      {/* ════════ СТРАНИЦА 1 ════════ */}
      <Page size='A4' style={s.page}>

        {/* UZTF ref */}
        <Text style={s.topRef}>UZTF 42009.1-2 / Редакция 6 / 09.01.2025</Text>

        {/* Header: название слева, логотип справа */}
        <View style={s.headerRow}>
          <View style={s.titleBlock}>
            <Text style={s.mainTitle}>Сопроводительный лист нестандартного заказа</Text>
            <Text style={s.forService}>ДЛЯ СЛУЖЕБНОГО ПОЛЬЗОВАНИЯ</Text>
          </View>
          <Image src='/img/logo.png' style={s.logo} />
        </View>

        {/* Блоки подписей */}
        <View style={s.sigRow}>
          <View style={s.sigBlock}>
            <Text style={s.sigBold}>«Согласовано»</Text>
            <Text>Продукт-менеджер</Text>
            <View style={s.sigLine} />
            <Text style={s.sigDate}>«__»________20__г.</Text>
          </View>
          <View style={s.sigBlock}>
            <Text style={s.sigBold}>«Утверждаю»</Text>
            <Text>Директор завода</Text>
            <View style={s.sigLine} />
            <Text style={s.sigDate}>«__»________20__г.</Text>
          </View>
        </View>

        {/* Требуется приемка */}
        <View style={s.chkRow}>
          <Text>Требуется приемка заказа:</Text>
          <View style={{ width: 8, height: 8, border: BRD, marginRight: 2 }} />
          <Text>НЕТ</Text>
          <View style={s.chkBox} />
          <Text>ДА:</Text>
          <View style={s.chkBox} />
          <Text>Продукт-менеджером</Text>
          <View style={s.chkBox} />
          <Text>Заказчиком</Text>
        </View>

        {/* Номер НЗ и расчёта */}
        <View style={s.nzLine}>
          <Text>Лист нестандартного заказа №_____</Text>
          <Text>Расчёт №_____</Text>
        </View>

        {/* Секция I */}
        <Text style={s.secHdr}>I. Заполняется Менеджером по продажам:</Text>

        <View style={s.tbl}>

          {/* Строка 1 */}
          <View style={s.tr}>
            <View style={s.tdLbl}><Text>1. Менеджер по продажам (Ф.И.О.)</Text></View>
            <View style={s.tdVal}><Text>{managerName ?? ''}</Text></View>
          </View>

          {/* Строка 2 */}
          <View style={s.tr}>
            <View style={s.tdLbl}><Text>2. Название Клиента (страна)</Text></View>
            <View style={s.tdVal}><Text>{clientName ?? ''}</Text></View>
          </View>

          {/* Строка 3 — вложенная таблица изделия */}
          <View style={[s.tr, { minHeight: 40, alignItems: 'stretch' }]}>
            <View style={s.tdLbl}>
              <Text>3</Text>
              <Text style={{ marginTop: 2, fontSize: 7 }}>3.1 Наименование и количество продукции</Text>
              <Text style={{ marginTop: 2, fontSize: 7 }}>3.2. Вес и объём продукции</Text>
            </View>
            <View style={s.nt}>
              {/* Подшапки: Менеджер / Экономист / Технолог */}
              <View style={s.ntShRow}>
                <Text style={[s.ntSh, { width: '43%' }]}>Менеджер</Text>
                <Text style={[s.ntSh, { width: '35%' }]}>Экономист</Text>
                <Text style={[s.ntShLast, { width: '22%' }]}>Технолог</Text>
              </View>
              {/* Заголовки колонок */}
              <View style={s.ntColRow}>
                <Text style={[s.ntCol, { width: CW[0] }]}>Артикул</Text>
                <Text style={[s.ntCol, { width: CW[1] }]}>Наименование</Text>
                <Text style={[s.ntCol, { width: CW[2] }]}>Кол-во</Text>
                <Text style={[s.ntCol, { width: CW[3] }]}>Цена Таргет без НДС</Text>
                <Text style={[s.ntCol, { width: CW[4] }]}>Исп.</Text>
                <Text style={[s.ntCol, { width: CW[5] }]}>Цена передачи</Text>
                <Text style={[s.ntCol, { width: CW[6] }]}>Вес изд. в упак., кг</Text>
                <Text style={[s.ntColLast, { width: CW[7] }]}>Объём изд. в упак., м³</Text>
              </View>
              {/* Данные */}
              <View style={s.ntDataRow}>
                <Text style={[s.ntData, { width: CW[0] }]}>{model?.article ?? ''}</Text>
                <Text style={[s.ntData, { width: CW[1] }]}>{model?.name ?? ''}</Text>
                <Text style={[s.ntData, { width: CW[2], textAlign: 'center' }]}>{qty}</Text>
                <Text style={[s.ntData, { width: CW[3] }]}> </Text>
                <Text style={[s.ntData, { width: CW[4] }]}> </Text>
                <Text style={[s.ntData, { width: CW[5] }]}> </Text>
                <Text style={[s.ntData, { width: CW[6] }]}> </Text>
                <Text style={[s.ntDataLast, { width: CW[7] }]}> </Text>
              </View>
            </View>
          </View>

          {/* Строка 4 */}
          <View style={s.tr}>
            <View style={s.tdLbl}><Text>4. Срок поставки Клиенту</Text></View>
            <View style={s.tdVal} />
          </View>

          {/* Строка 5 */}
          <View style={s.tr}>
            <View style={s.tdLbl}>
              <Text>5. Штрафные санкции</Text>
              <Text style={{ fontSize: 6.5, color: '#555', marginTop: 1 }}>(если поставка по не типовому договору)</Text>
            </View>
            <View style={s.tdVal} />
          </View>

          {/* Строка 5.1 */}
          <View style={s.tr}>
            <View style={s.tdLbl}><Text>5.1. Национальный проект</Text></View>
            <View style={[s.tdVal, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ width: 8, height: 8, border: BRD, marginRight: 2 }} />
              <Text style={{ marginRight: 8 }}>ДА</Text>
              <View style={{ width: 8, height: 8, border: BRD, marginRight: 2 }} />
              <Text>НЕТ</Text>
            </View>
          </View>

          {/* Строка 6 — параметры */}
          <View style={[s.tr, { alignItems: 'flex-start' }]}>
            <View style={s.tdLbl}>
              <Text>6. Отличия от серийной продукции</Text>
              <Text style={{ fontSize: 6.5, color: '#555', marginTop: 1 }}>(габариты, функциональность, цвет, замки и т.п.)</Text>
            </View>
            <View style={s.paramsWrap}>
              {params.map(p => (
                <View key={p.label} style={s.paramRow}>
                  <Text style={s.paramLbl}>{p.label}:</Text>
                  <Text style={[s.paramVal, p.isNonStandard && s.paramBold]}>
                    {p.value}{p.isNonStandard ? ' ★' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Строка 7 */}
          <View style={s.tr}>
            <View style={s.tdLbl}>
              <Text>7. Собственность Потребителя</Text>
              <Text style={{ fontSize: 6.5, color: '#555', marginTop: 1 }}>(комплектующие и материалы Заказчика)</Text>
            </View>
            <View style={s.tdVal} />
          </View>

          {/* Строка 8 */}
          <View style={s.tr}>
            <View style={s.tdLbl}><Text>8. Дополнительная маркировка</Text></View>
            <View style={s.tdVal} />
          </View>

          {/* Строка 9 */}
          <View style={s.tr}>
            <View style={s.tdLbl}><Text>9. Новый артикул (при необходимости)</Text></View>
            <View style={[s.tdVal, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ width: 8, height: 8, border: BRD, marginRight: 2 }} />
              <Text style={{ marginRight: 8 }}>ДА</Text>
              <View style={{ width: 8, height: 8, border: BRD, marginRight: 2 }} />
              <Text>НЕТ</Text>
            </View>
          </View>

          {/* Строка 10 */}
          <View style={s.trLast}>
            <View style={s.tdLbl}><Text>10. Цена передачи (подпись Экономиста)</Text></View>
            <View style={s.tdVal} />
          </View>

        </View>

        {/* Подпись менеджера + дата */}
        <View style={s.sigDateLine}>
          <Text>Подпись менеджера: ____________</Text>
          <Text>Дата: {today}</Text>
        </View>

        {/* Секция II — заголовок на 1-й странице */}
        <Text style={s.secIINote}>
          II. Заполняется Конструктором, Технологом, Отделом закупок и Производством:
        </Text>

        {/* Подвал */}
        <View style={s.footer}>
          <Text>UZTF 42009.1-2 / Редакция 6 / Дата: 09.01.2025</Text>
          <Text>Страница 1 из 2</Text>
        </View>
      </Page>

      {/* ════════ СТРАНИЦА 2 ════════ */}
      <Page size='A4' style={s.page}>

        <Text style={s.p2SecTitle}>
          II. Заполняется Конструктором, Технологом, Отделом закупок и Производством:
        </Text>

        <Text style={s.p2RowTitle}>11. Анализ возможности исполнения заказа с решением</Text>

        <Text style={s.p2SubTitle}>КОНСТРУКТОРСКАЯ ГРУППА:</Text>
        <Text style={s.p2FieldText}>Наличие КД или сроки разработки: ________________________________</Text>
        <SigBlock />

        <Text style={s.p2SubTitle}>ТЕХНОЛОГИЧЕСКИЙ ОТДЕЛ:</Text>
        <Text style={s.p2FieldText}>Наличие ТД и необходимости тех. подготовки (оснастка, упаковка, инструмент и т.д.): ________</Text>
        <SigBlock />

        <Text style={s.p2SubTitle}>ОТДЕЛ ЗАКУПОК:</Text>
        <Text style={s.p2FieldText}>Наличие материалов/комплектующих или сроки поставки: _______________</Text>
        <SigBlock />

        <Text style={s.p2SubTitle}>НАЧАЛЬНИК УЧАСТКА:</Text>
        <Text style={s.p2FieldText}>Планируемая дата выполнения: _______________________________________</Text>
        <SigBlock />

        <Text style={[s.p2SecTitle, { marginTop: 8 }]}>III. Заполняется Начальником производства:</Text>
        <Text style={s.p2FieldText}>12. Номер заказа MOZI: ___________________</Text>
        <Text style={s.p2FieldText}>13. Планируемая дата сдачи заказа на склад: ___________________</Text>
        <SigBlock />

        <Text style={s.p2SecTitle}>IV. Заполняется Службой Качества:</Text>
        <Text style={s.p2FieldText}>14. Информация по объёму контроля:</Text>
        <View style={{ borderBottom: BRD, height: 14, marginBottom: 2 }} />
        <SigBlock />

        <Text style={s.p2SecTitle}>V. Заполняется Ведущим специалистом по сопровождению ПО:</Text>
        <Text style={s.p2FieldText}>15. Цена передачи внесена в счёт: ___________________________________</Text>
        <SigBlock />

        {/* Подвал */}
        <View style={s.footer}>
          <Text>UZTF 42009.1-2 / Редакция 6 / Дата: 09.01.2025</Text>
          <Text>Страница 2 из 2</Text>
        </View>
      </Page>

    </Document>
  );
}
