import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { setPageTitle } from '../../utils/seo';
import { formatDateTime } from '../../utils/format';
import Stars, { StarInput } from '../../components/Stars';
import Spinner, { InlineSpinner } from '../../components/Spinner';
import './admin.css';

const EMPTY_REVIEW = { name: '', location: '', review: '', rating: 5, approved: true, featured: false };

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');

  const [draft, setDraft] = useState(EMPTY_REVIEW);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter) params.set(filter, 'true');
    const qs = params.toString();
    try {
      const data = await api.get(`/api/admin/reviews${qs ? `?${qs}` : ''}`);
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => {
    setPageTitle('Reviews');
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const toggle = async (id, key) => {
    const review = reviews.find((r) => r._id === id);
    if (!review) return;
    try {
      const updated = await api.patch(`/api/admin/reviews/${id}`, { [key]: !review[key] });
      setReviews((list) => list.map((r) => (r._id === id ? updated : r)));
    } catch (err) {
      notify(err.message || 'Update failed');
    }
  };

  const saveReview = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!draft.name.trim() || !draft.review.trim()) {
      setFormError('Name and review text are required.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = { ...draft, name: draft.name.trim(), location: draft.location.trim(), review: draft.review.trim() };
      if (editingId) {
        await api.patch(`/api/admin/reviews/${editingId}`, payload);
        notify('Review updated');
      } else {
        await api.post('/api/admin/reviews', payload);
        notify('Review added');
      }
      setDraft(EMPTY_REVIEW);
      setEditingId(null);
      load();
    } catch (err) {
      setFormError(err.message || 'Could not save review');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (review) => {
    setEditingId(review._id);
    setDraft({
      name: review.name,
      location: review.location || '',
      review: review.review,
      rating: review.rating,
      approved: review.approved,
      featured: review.featured,
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(EMPTY_REVIEW);
    setFormError(null);
  };

  const remove = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await api.del(`/api/admin/reviews/${id}`);
      notify('Review deleted');
      setReviews((list) => list.filter((r) => r._id !== id));
    } catch (err) {
      notify(err.message || 'Could not delete review');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="reveal">
      <div className="page-head flex-between">
        <div>
          <h1>Reviews</h1>
          <div className="sub">
            Manage public testimonials. Only approved reviews appear publicly; only featured ones appear in the featured section.
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h3 style={{ fontSize: 17, marginBottom: 16 }}>
          {editingId ? 'Edit Review' : 'Add Review'}
        </h3>
        {formError && <div className="alert alert-error mb-3">{formError}</div>}
        <form onSubmit={saveReview}>
          <div className="form-row">
            <div>
              <label className="form-label" htmlFor="rv-name">Name</label>
              <input
                id="rv-name"
                className="form-control"
                placeholder="John Doe"
                value={draft.name}
                maxLength={100}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="rv-loc">Location</label>
              <input
                id="rv-loc"
                className="form-control"
                placeholder="Abuja, Nigeria"
                value={draft.location}
                maxLength={100}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rv-text">Review</label>
            <textarea
              id="rv-text"
              className="form-control"
              rows={4}
              placeholder="What did the person say?"
              value={draft.review}
              maxLength={1000}
              onChange={(e) => setDraft((d) => ({ ...d, review: e.target.value }))}
            />
            <div className="form-hint">{draft.review.length}/1000 · Plain text only — HTML is not rendered.</div>
          </div>

          <div className="form-row" style={{ alignItems: 'center' }}>
            <div>
              <div className="form-label">Rating</div>
              <StarInput value={draft.rating} onChange={(n) => setDraft((d) => ({ ...d, rating: n }))} />
            </div>
            <div className="flex" style={{ flexWrap: 'wrap' }}>
              <label className="checkbox" htmlFor="rv-approved" style={{ gap: 8 }}>
                <input
                  id="rv-approved"
                  type="checkbox"
                  checked={draft.approved}
                  onChange={(e) => setDraft((d) => ({ ...d, approved: e.target.checked }))}
                />
                <span>Approved (public)</span>
              </label>
              <label className="checkbox" htmlFor="rv-featured" style={{ gap: 8 }}>
                <input
                  id="rv-featured"
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                />
                <span>Featured</span>
              </label>
              {editingId && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                  Cancel edit
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
            {saving ? <><InlineSpinner /> Saving...</> : editingId ? 'Save Changes' : 'Add Review'}
          </button>
        </form>
      </div>

      <div className="toolbar">
        <input
          className="form-control"
          placeholder="Search reviews..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search reviews"
        />
        <select
          className="form-control"
          style={{ width: 'auto', flex: '0 0 auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter reviews"
        >
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {loading && reviews.length === 0 ? (
        <Spinner label="Loading reviews..." />
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <div className="icon" aria-hidden="true">💬</div>
          <h3>No reviews found</h3>
          <p>Add a review above. No reviews are generated automatically — only genuine ones.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {reviews.map((review) => (
            <div className="card review-row" key={review._id}>
              <div className="review-top">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{review.name}</div>
                  {review.location ? <div className="muted" style={{ fontSize: 13 }}>{review.location}</div> : null}
                </div>
                <Stars rating={review.rating} />
              </div>

              {editingId === review._id ? null : (
                <div className="review-body">"{review.review}"</div>
              )}

              <div className="flex-between" style={{ flexWrap: 'wrap' }}>
                {editingId === review._id ? (
                  <span className="muted" style={{ fontSize: 13 }}>Editing this review — form above.</span>
                ) : (
                  <span className="review-chip">
                    <button className={`btn btn-sm ${review.approved ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggle(review._id, 'approved')}>
                      {review.approved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button className={`btn btn-sm ${review.featured ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => toggle(review._id, 'featured')}>
                      {review.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(review)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(review._id)} disabled={!!deletingId}>
                      {deletingId === review._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </span>
                )}
                <span className="muted" style={{ fontSize: 12.5 }}>
                  Added {formatDateTime(review.createdAt)} · <b>{review.approved ? 'Public' : 'Hidden'}</b>
                  {review.featured ? ' · Featured' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}