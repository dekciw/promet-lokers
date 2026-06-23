import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Header from '../../shared/components/Header/Header';
import NonStandardOrderModal from '../../shared/components/NonStandardOrderModal/NonStandardOrderModal.jsx';
import { useHistory } from '../../shared/hooks/useHistory';
import { useCatalog } from '../../shared/hooks/useCatalog';
import { getColorHex } from '../../shared/utils/colors';
import { cx } from '../../shared/utils/cx.js';
import styles from './HistoryPage.module.css';

const RESTORE_KEY = 'promet_restore_snapshot_v1';

function formatDate(ts) {
	if (!ts) return '—';
	const d = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
	return d.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function buildNzSummary(snapshot, catalog, storedPrice) {
	if (!snapshot || !catalog) return null;
	const model = catalog.models?.[snapshot.modelId];
	const defaults = model?.defaultSpecs ?? null;
	if (!model || !defaults) return null;
	const series = (catalog.series ?? []).find(s => s.id === snapshot.seriesId);
	const lock = catalog.locks?.[snapshot.lockId];
	const qty = snapshot.quantity ?? 10;
	const bodyColorName = snapshot.bodyColor?.name ?? defaults.bodyColorName ?? 'RAL 7038';
	const doorColorName = snapshot.doorColor?.name ?? defaults.doorColorName ?? 'RAL 7038';
	const priceDisplay = storedPrice ? `${Number(storedPrice).toLocaleString('ru-RU')} ₽` : '—';
	return {
		model: series && model ? `${series.name} — ${model.name}` : model.name,
		dims: `${snapshot.width || defaults.width} × ${snapshot.height || defaults.height} × ${snapshot.depth || defaults.depth} мм`,
		thickness: `${snapshot.bodyThickness} / ${snapshot.doorThickness} мм`,
		lock: lock?.name ?? '—',
		qty: `${qty} шт.`,
		price: priceDisplay,
		bodyColor: bodyColorName,
		bodyColorHex: snapshot.bodyColor?.color ?? getColorHex(bodyColorName),
		doorColor: doorColorName,
		doorColorHex: snapshot.doorColor?.color ?? getColorHex(doorColorName),
	};
}

export default function HistoryPage({ uid, user, onLogout, username, isAdmin, onLogin }) {
	const { history, isLoading, error, loadHistory, redownloadKP, redownloadNZ, removeEntry } = useHistory(uid);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [nzRedownloadEntry, setNzRedownloadEntry] = useState(null);
	const [nzError, setNzError] = useState(null);
	const { catalog } = useCatalog();
	const navigate = useNavigate();

	useEffect(() => {
		loadHistory();
	}, [loadHistory]);

	function handleRestore(entry) {
		sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ configSnapshot: entry.configSnapshot }));
		navigate('/configurator');
	}

	function handleRestoreNz(entry) {
		sessionStorage.setItem(
			RESTORE_KEY,
			JSON.stringify({
				configSnapshot: entry.configSnapshot,
				openModal: 'nz',
				nzFormData: entry.nzFormData ?? {},
			}),
		);
		navigate('/configurator');
	}

	function handleRedownloadNz(entry) {
		setNzError(null);
		setNzRedownloadEntry(entry);
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

	async function handleDelete() {
		if (!deleteTarget) return;
		try {
			await removeEntry(deleteTarget.id);
			setDeleteTarget(null);
		} catch (err) {
			alert(`Ошибка удаления: ${err?.message ?? err}`);
		}
	}

	async function handleNzRedownloadSubmit({ managerName, clientName, nzNumber, calcNumber }) {
		if (!catalog || !nzRedownloadEntry) return;
		try {
			const { generateNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
			const priceObj = nzRedownloadEntry.price ? { clientPrice: Number(nzRedownloadEntry.price), manual: false } : null;
			await generateNonStandardOrder({
				config: nzRedownloadEntry.configSnapshot,
				catalog,
				managerName,
				clientName,
				price: priceObj,
				nzNumber,
				calcNumber,
			});
			setNzRedownloadEntry(null);
		} catch (err) {
			setNzError(err?.message ?? String(err));
		}
	}

	async function handleNzRedownloadPrint({ managerName, clientName, nzNumber, calcNumber }) {
		if (!catalog || !nzRedownloadEntry) return;
		try {
			const { printNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
			const priceObj = nzRedownloadEntry.price ? { clientPrice: Number(nzRedownloadEntry.price), manual: false } : null;
			await printNonStandardOrder({
				config: nzRedownloadEntry.configSnapshot,
				catalog,
				managerName,
				clientName,
				price: priceObj,
				nzNumber,
				calcNumber,
			});
		} catch (err) {
			setNzError(err?.message ?? String(err));
		}
	}

	const nzSummary = nzRedownloadEntry
		? buildNzSummary(nzRedownloadEntry.configSnapshot, catalog, nzRedownloadEntry.price)
		: null;

	return (
		<div className='app-wrapper'>
			<Header onLogout={onLogout} username={username} isAdmin={isAdmin} user={user} onLogin={onLogin} />
			<div className='main-scroll'>
				<div className={styles.page}>
					<main className={styles.main}>
						<div className={styles.toolbar}>
							<h1 className={styles.title}>История</h1>
							<Link to='/configurator' className={styles.backLink}>
								← Конфигуратор
							</Link>
						</div>

						{isLoading && <div className={styles.state}>Загрузка истории…</div>}

						{!isLoading && error && (
							<div className={cx(styles.state, styles.stateError)}>
								Не удалось загрузить историю: {error}
								<div>
									<button type='button' className={styles.retryBtn} onClick={loadHistory}>
										Повторить
									</button>
								</div>
							</div>
						)}

						{!isLoading && !error && history.length === 0 && (
							<div className={styles.state}>История пуста — скачайте КП или бланк НЗ на странице конфигуратора.</div>
						)}

						{!isLoading && !error && history.length > 0 && (
							<div className={styles.tableWrap}>
								<table className={styles.table}>
									<thead>
										<tr>
											<th>Тип</th>
											<th>Дата</th>
											<th>Модель</th>
											<th>Артикул</th>
											<th>Цена за 1 шт.</th>
											<th>Действия</th>
										</tr>
									</thead>
									<tbody>
										{history.map(e => {
											const isNz = e.type === 'nz';
											return (
												<tr key={e.id}>
													<td>
														<span className={cx(styles.typeBadge, isNz ? styles.typeBadgeNz : styles.typeBadgeKp)}>
															{isNz ? 'НЗ' : 'КП'}
														</span>
													</td>
													<td>{formatDate(e.downloadedAt)}</td>
													<td>{e.modelName}</td>
													<td>{e.article}</td>
													<td>{Number(e.price ?? 0).toLocaleString('ru-RU')} ₽</td>
													<td className={styles.actions}>
														<button
															type='button'
															className={cx(styles.actionBtn, styles.actionBtnSecondary)}
															onClick={() => (isNz ? handleRestoreNz(e) : handleRestore(e))}
															aria-label={`Восстановить конфигурацию ${e.modelName}`}
														>
															Восстановить
														</button>
														<button
															type='button'
															className={cx(styles.actionBtn, styles.actionBtnPrimary)}
															onClick={() => (isNz ? handleRedownloadNz(e) : handleRedownload(e))}
															aria-label={`Скачать заново ${e.modelName}`}
														>
															Скачать заново
														</button>
														<button
															type='button'
															className={cx(styles.actionBtn, styles.actionBtnDanger)}
															onClick={() => setDeleteTarget(e)}
															aria-label={`Удалить запись ${e.modelName}`}
														>
															Удалить
														</button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}

						{deleteTarget && (
							<div
								className={styles.overlay}
								onMouseDown={e => {
									if (e.target === e.currentTarget) setDeleteTarget(null);
								}}
							>
								<div
									className={styles.modal}
									onMouseDown={e => e.stopPropagation()}
									onClick={e => e.stopPropagation()}
									role='dialog'
									aria-modal='true'
								>
									<h3 className={styles.modalTitle}>Удалить запись из истории?</h3>
									<p className={styles.modalText}>
										Запись <strong>{deleteTarget.modelName}</strong> от {formatDate(deleteTarget.downloadedAt)} будет
										удалена без возможности восстановления.
									</p>
									<div className={styles.modalActions}>
										<button
											type='button'
											className={cx(styles.actionBtn, styles.actionBtnSecondary)}
											onClick={() => setDeleteTarget(null)}
										>
											Отмена
										</button>
										<button
											type='button'
											className={cx(styles.actionBtn, styles.actionBtnDanger)}
											onClick={handleDelete}
										>
											Удалить
										</button>
									</div>
								</div>
							</div>
						)}

						<NonStandardOrderModal
							isOpen={!!nzRedownloadEntry}
							onClose={() => {
								setNzRedownloadEntry(null);
								setNzError(null);
							}}
							onSubmit={handleNzRedownloadSubmit}
							onPrint={handleNzRedownloadPrint}
							summary={nzSummary}
							initialValues={nzRedownloadEntry?.nzFormData ?? null}
						/>

						{nzError && <div className={styles.nzError}>Ошибка: {nzError}</div>}
					</main>
				</div>
			</div>
		</div>
	);
}
