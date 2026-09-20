import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { setPageTitle } from '../../utils/seo';
import { formatDate } from '../../utils/format';
import StatusBadge, { LABELS } from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { exportCasesToExcel } from '../../services/export';
import './admin.css';

const STATUS_OPTIONS = Object.keys(LABELS);

export default function Cases() {
  const [data, setData] = useState({ reports: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [scamType, setScamType] = useState('ALL');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      sort,
      ...(q ? { q } : {}),
      ...(status !== 'ALL' ? { status } : {}),
      ...(scamType !== 'ALL' ? { scamType } : {}),
    });
    try {
      const res = await api.get(`/api/admin/reports?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [page, sort, q, status, scamType]);

  useEffect(() => {
    setPageTitle('Cases');
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchCases, 250);
    return () => clearTimeout(timer);
  }, [fetchCases]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCasesToExcel();
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="reveal">
      <div className="page-head flex-between">
        <div>
          <h1>Case Management</h1>
          <div className="sub">{data.total} case{data.total === 1 ? '' : 's'} total</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : '⬇ Export to Excel'}
        </button>
      </div>

      <div className="toolbar">
        <input
          className="form-control"
          placeholder="Search case ID, victim, scammer, email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          aria-label="Search cases"
        />
        <select className="form-control" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="ALL">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{LABELS[s]}</option>
          ))}
        </select>
        <select className="form-control" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort cases" style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="updated">Recently updated</option>
          <option value="caseId">Case ID</option>
        </select>
        <select className="form-control" value={scamType} onChange={(e) => { setScamType(e.target.value); setPage(1); }} aria-label="Filter by scam type" style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="ALL">All Scam Types</option>
          {['Bank Transfer','Cryptocurrency','Investment','Fake Store','Phishing','Social Media','Romance Scam','Impersonation','Account Takeover','Other'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error mb-3">{error}</div>}

      {loading && data.reports.length === 0 ? (
        <Spinner label="Loading cases..." />
      ) : data.reports.length === 0 ? (
        <div className="empty-state">
          <div className="icon" aria-hidden="true">🗂</div>
          <h3>No cases match your criteria</h3>
          <p>Try adjusting the search or filters.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Victim</th>
                  <th>Scam Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((r) => (
                  <tr key={r.caseId}>
                    <td>
                      <Link to={`/admin/cases/${r.caseId}`} className="mono" style={{ color: 'var(--primary-color)' }}>
                        {r.caseId}
                      </Link>
                    </td>
                    <td>{r.victim?.fullName || '—'}</td>
                    <td>{r.incident?.type || '—'}</td>
                    <td className="amount">
                      {r.incident?.amount ? `${r.incident?.currency || ''} ${r.incident.amount}` : '—'}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>
                      <Link to={`/admin/cases/${r.caseId}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-between mt-3">
            <span className="muted" style={{ fontSize: 13.5 }}>
              Page {data.page} of {data.pages}
            </span>
            <div className="flex">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <button className="btn btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}