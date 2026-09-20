import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { setPageTitle } from '../../utils/seo';
import { formatDateTime } from '../../utils/format';
import StatusBadge, { LABELS } from '../../components/StatusBadge';
import Spinner, { InlineSpinner } from '../../components/Spinner';
import { useAuth } from '../../hooks/useAuth';
import './admin.css';

const STATUS_OPTIONS = Object.keys(LABELS);

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(3,5,8,.8)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="card"
        style={{ maxWidth: 460, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 19, marginBottom: 10 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('');
  const [investigator, setInvestigator] = useState('');
  const [saving, setSaving] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/admin/reports/${encodeURIComponent(caseId)}`);
      setReport(data);
      setStatus(data.status);
      setInvestigator(data.assignedInvestigator || '');
    } catch (err) {
      setError(err.message || 'Case not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle(`Case ${caseId}`);
    load();
  }, [caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveStatusAndInvestigator = async () => {
    setSaving(true);
    try {
      const updated = await api.patch(`/api/admin/reports/${encodeURIComponent(caseId)}`, {
        status,
        assignedInvestigator: investigator,
      });
      setReport(updated);
      notify('Case updated');
    } catch (err) {
      notify(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || addingNote) return;
    setAddingNote(true);
    try {
      await api.post(`/api/admin/reports/${encodeURIComponent(caseId)}/notes`, { text: noteText });
      setNoteText('');
      notify('Note added');
      load();
    } catch (err) {
      notify(err.message || 'Could not add note');
    } finally {
      setAddingNote(false);
    }
  };

  const saveNoteEdit = async () => {
    if (!editingText.trim()) return;
    try {
      await api.patch(
        `/api/admin/reports/${encodeURIComponent(caseId)}/notes/${editingNoteId}`,
        { text: editingText }
      );
      setEditingNoteId(null);
      setEditingText('');
      notify('Note updated');
      load();
    } catch (err) {
      notify(err.message || 'Could not update note');
    }
  };

  const removeNote = async (noteId) => {
    if (deletingNoteId) return;
    setDeletingNoteId(noteId);
    try {
      await api.del(`/api/admin/reports/${encodeURIComponent(caseId)}/notes/${noteId}`);
      notify('Note deleted');
      load();
    } catch (err) {
      notify(err.message || 'Could not delete note');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const archiveCase = async () => {
    if (archiving) return;
    setArchiving(true);
    try {
      const updated = await api.post(`/api/admin/reports/${encodeURIComponent(caseId)}/archive`);
      setReport(updated);
      setStatus(updated.status);
      notify('Case archived');
    } catch (err) {
      notify(err.message || 'Could not archive case');
    } finally {
      setArchiving(false);
    }
  };

  const permanentDelete = async () => {
    if (deleting || deleteConfirm !== caseId) return;
    setDeleting(true);
    try {
      await api.del(`/api/admin/reports/${encodeURIComponent(caseId)}`, { confirmCaseId: deleteConfirm });
      notify('Case permanently deleted');
      setTimeout(() => navigate('/admin/cases'), 600);
    } catch (err) {
      notify(err.message || 'Could not delete case');
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading case..." />;

  if (error) {
    return (
      <div className="empty-state">
        <div className="icon" aria-hidden="true">🔍</div>
        <h3>Case not found</h3>
        <p>{error}</p>
        <Link to="/admin/cases" className="btn btn-primary btn-sm mt-3">Back to Cases</Link>
      </div>
    );
  }

  const v = report.victim || {};
  const i = report.incident || {};
  const s = report.scammer || {};
  const t = report.transaction || {};
  const e = report.evidence || {};
  const notes = report.notes || [];

  return (
    <div className="reveal">
      <div className="page-head flex-between">
        <div>
          <Link to="/admin/cases" className="muted" style={{ fontSize: 13.5 }}>← Back to cases</Link>
          <h1 className="mono" style={{ marginTop: 8, fontSize: 24 }}>{report.caseId}</h1>
          <div className="sub">
            Submitted {formatDateTime(report.createdAt)} · Updated {formatDateTime(report.updatedAt)}
          </div>
        </div>
        <div className="flex">
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Status / assignment */}
      <div className="card mb-4">
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Case Management</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="s-status">Case Status</label>
            <select id="s-status" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{LABELS[st]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-inv">Assigned Investigator</label>
            <input
              id="s-inv"
              className="form-control"
              placeholder="Investigator name"
              value={investigator}
              onChange={(e) => setInvestigator(e.target.value)}
            />
          </div>
        </div>
        <div className="flex" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={saveStatusAndInvestigator} disabled={saving}>
            {saving ? <><InlineSpinner /> Saving...</> : 'Save Changes'}
          </button>
          {report.status !== 'ARCHIVED' && (
            <button className="btn btn-secondary btn-sm" onClick={archiveCase} disabled={archiving}>
              {archiving ? 'Archiving...' : '🗄 Archive'}
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
            🗑 Delete Permanently
          </button>
        </div>
        <div className="mt-2" style={{ fontSize: 13, color: 'var(--muted)' }}>
          Tip: close a case with <b>CLOSED</b>, then archive it. Permanent deletion requires typing the Case ID.
        </div>
      </div>

      <div className="case-grid">
        <div style={{ display: 'grid', gap: 22 }}>
          {/* Victim */}
          <div className="card case-block">
            <h3>Victim Information</h3>
            <div className="kv-list">
              <div className="kv"><span className="k">Full Name</span><span className="v">{v.fullName || '—'}</span></div>
              <div className="kv"><span className="k">Email</span><span className="v">{v.email || '—'}</span></div>
              <div className="kv"><span className="k">Phone</span><span className="v">{v.phone || '—'}</span></div>
              <div className="kv"><span className="k">WhatsApp</span><span className="v">{v.whatsapp || '—'}</span></div>
              <div className="kv"><span className="k">Country</span><span className="v">{v.country || '—'}</span></div>
              <div className="kv"><span className="k">State / Region</span><span className="v">{v.state || '—'}</span></div>
              <div className="kv"><span className="k">Preferred Contact</span><span className="v">{v.preferredContact || '—'}</span></div>
            </div>
          </div>

          {/* Incident */}
          <div className="card case-block">
            <h3>Incident Information</h3>
            <div className="kv-list">
              <div className="kv"><span className="k">Scam Type</span><span className="v">{i.type || '—'}</span></div>
              <div className="kv"><span className="k">Date</span><span className="v">{i.date || '—'}</span></div>
              <div className="kv"><span className="k">Approximate Time</span><span className="v">{i.time || '—'}</span></div>
              <div className="kv"><span className="k">Amount</span><span className="v">{i.amount ? `${i.currency || ''} ${i.amount}` : '—'}</span></div>
              <div className="kv"><span className="k">Country</span><span className="v">{i.country || '—'}</span></div>
              <div className="kv"><span className="k">Description</span><span className="v" style={{ whiteSpace: 'pre-wrap' }}>{i.description || '—'}</span></div>
            </div>
          </div>

          {/* Scammer */}
          <div className="card case-block">
            <h3>Scammer Information</h3>
            <div className="kv-list">
              <div className="kv"><span className="k">Name</span><span className="v">{s.name || '—'}</span></div>
              <div className="kv"><span className="k">Alias / Username</span><span className="v">{s.alias || '—'}</span></div>
              <div className="kv"><span className="k">Phone</span><span className="v">{s.phone || '—'}</span></div>
              <div className="kv"><span className="k">Email</span><span className="v">{s.email || '—'}</span></div>
              <div className="kv"><span className="k">Social Media</span><span className="v">{s.socialMedia || '—'}</span></div>
              <div className="kv"><span className="k">Website</span><span className="v">{s.website || '—'}</span></div>
              <div className="kv"><span className="k">Bank Name</span><span className="v">{s.bankName || '—'}</span></div>
              <div className="kv"><span className="k">Account Name</span><span className="v">{s.accountName || '—'}</span></div>
              <div className="kv"><span className="k">Account Number</span><span className="v">{s.accountNumber || '—'}</span></div>
              <div className="kv"><span className="k">Wallet Address</span><span className="v mono">{s.walletAddress || '—'}</span></div>
              {s.otherInformation ? (
                <div className="kv"><span className="k">Other Info</span><span className="v" style={{ whiteSpace: 'pre-wrap' }}>{s.otherInformation}</span></div>
              ) : null}
            </div>
          </div>

          {/* Transaction */}
          <div className="card case-block">
            <h3>Transaction Information</h3>
            <div className="kv-list">
              <div className="kv"><span className="k">Reference</span><span className="v mono">{t.reference || '—'}</span></div>
              <div className="kv"><span className="k">Transaction ID</span><span className="v mono">{t.transactionId || '—'}</span></div>
              <div className="kv"><span className="k">Crypto Hash</span><span className="v mono">{t.cryptoHash || '—'}</span></div>
              <div className="kv"><span className="k">Sending Platform</span><span className="v">{t.sendingPlatform || '—'}</span></div>
              <div className="kv"><span className="k">Receiving Platform</span><span className="v">{t.receivingPlatform || '—'}</span></div>
              <div className="kv"><span className="k">Payment Method</span><span className="v">{t.paymentMethod || '—'}</span></div>
            </div>
          </div>

          {/* Evidence */}
          <div className="card case-block">
            <h3>Evidence</h3>
            <div className="kv-list">
              <div className="kv"><span className="k">Description</span><span className="v" style={{ whiteSpace: 'pre-wrap' }}>{e.description || '—'}</span></div>
              <div className="kv"><span className="k">Evidence Links</span><span className="v">
                {e.links?.length
                  ? e.links.map((l, idx) => (
                      <div key={idx}>
                        <a href={l} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}>{l}</a>
                      </div>
                    ))
                  : '—'}
              </span></div>
              <div className="kv"><span className="k">Relevant URLs</span><span className="v">
                {e.urls?.length
                  ? e.urls.map((l, idx) => (
                      <div key={idx}>
                        <a href={l} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}>{l}</a>
                      </div>
                    ))
                  : '—'}
              </span></div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="side-stack">
          <div className="card case-block">
            <h3>Status</h3>
            <StatusBadge status={report.status} />
          </div>

          <div className="card case-block">
            <h3>Assigned Investigator</h3>
            <div className="v" style={{ fontSize: 14.5 }}>
              {report.assignedInvestigator || 'Unassigned'}
            </div>
          </div>

          <div className="card case-block">
            <h3>Internal Notes</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Notes are strictly internal and never visible to the public.
            </p>

            {notes.length === 0 && (
              <div className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>No internal notes yet.</div>
            )}

            <div className="notes-list">
              {notes.map((note) => (
                <div className="note-item" key={note._id}>
                  {editingNoteId === note._id ? (
                    <div>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="flex mt-2">
                        <button className="btn btn-primary btn-sm" onClick={saveNoteEdit}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingNoteId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="note-text">{note.text}</div>
                      <div className="note-meta">
                        <span>
                          {note.author || 'Administrator'} · {formatDateTime(note.createdAt)}
                        </span>
                        {admin && (
                          <span className="note-actions">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setEditingNoteId(note._id); setEditingText(note.text); }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeNote(note._id)}
                              disabled={!!deletingNoteId}
                            >
                              {deletingNoteId === note._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3">
              <label className="form-label" htmlFor="new-note">Add a note</label>
              <textarea
                id="new-note"
                className="form-control"
                rows={3}
                placeholder="Internal observation for the investigation team..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button className="btn btn-secondary btn-sm mt-2" onClick={addNote} disabled={addingNote || !noteText.trim()}>
                {addingNote ? 'Adding...' : '+ Add Note'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <Modal title="Permanent Deletion" onClose={() => setShowDelete(false)}>
          <div className="alert alert-warning mb-3">
            <span>This permanently removes the case from the database. This cannot be undone. Type the exact Case ID to confirm.</span>
          </div>
          <label className="form-label" htmlFor="delete-confirm">Type the Case ID</label>
          <input
            id="delete-confirm"
            className="form-control mono"
            placeholder={report.caseId}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <div className="flex mt-3" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDelete(false)}>Cancel</button>
            <button
              className="btn btn-danger btn-sm"
              onClick={permanentDelete}
              disabled={deleting || deleteConfirm !== report.caseId}
            >
              {deleting ? 'Deleting...' : 'Delete forever'}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="toast" role="status">{toast}</div>
      )}
    </div>
  );
}