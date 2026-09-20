import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { exportCasesToExcel } from '../../services/export';
import { setPageTitle } from '../../utils/seo';
import { formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import './admin.css';

const STAT_CARDS = [
  { key: 'NEW', label: 'New', ico: '🟥', accent: 'new' },
  { key: 'UNDER_REVIEW', label: 'Under Review', ico: '🟨', accent: 'review' },
  { key: 'INVESTIGATING', label: 'Investigating', ico: '🔎', accent: 'active' },
  { key: 'RECOVERY_IN_PROGRESS', label: 'Recovery in Progress', ico: '↻', accent: 'active' },
  { key: 'RECOVERED', label: 'Recovered', ico: '✅', accent: 'done' },
  { key: 'CLOSED', label: 'Closed', ico: '📁', accent: 'closed' },
  { key: 'ARCHIVED', label: 'Archived', ico: '🗄', accent: 'closed' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Dashboard');
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/reports?limit=8'),
    ])
      .then(([statsData, reportsData]) => {
        setStats(statsData);
        setRecent(reportsData.reports || []);
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  if (error) {
    return (
      <div className="empty-state">
        <div className="icon" aria-hidden="true">⚠️</div>
        <h3>Could not load the dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="reveal">
      <div className="page-head flex-between">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Live counts from the case database.</div>
        </div>
        <Link to="/admin/export" onClick={(e) => { e.preventDefault(); exportCasesToExcel().catch((err) => setError(err.message)); }} className="btn btn-secondary btn-sm">
          ⬇ Export to Excel
        </Link>
      </div>

      <div className="stats-grid mb-4">
        <div className="card stat-card accent-new">
          <div>
            <div className="num">{stats?.total ?? 0}</div>
            <div className="label">Total Cases</div>
          </div>
          <span className="ico" aria-hidden="true">📋</span>
        </div>
        {STAT_CARDS.map((c) => (
          <div className={`card stat-card accent-${c.accent}`} key={c.key}>
            <div>
              <div className="num">{stats?.[c.key] ?? 0}</div>
              <div className="label">{c.label}</div>
            </div>
            <span className="ico" aria-hidden="true">{c.ico}</span>
          </div>
        ))}
      </div>

      <div className="page-head" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Recent Cases</h1>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="icon" aria-hidden="true">🗂</div>
          <h3>No cases yet</h3>
          <p>Reports submitted from the public site will appear here.</p>
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}