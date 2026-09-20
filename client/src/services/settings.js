import { api } from './api';

export async function fetchPublicSettings() {
  return api.get('/api/settings/public');
}

export async function fetchAdminSettings() {
  return api.get('/api/admin/settings');
}

export async function updateAdminSettings(payload) {
  return api.patch('/api/admin/settings', payload);
}

export async function fetchPublicReviews() {
  return api.get('/api/reviews');
}

export async function fetchAdminReviews(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.set(k, v);
  });
  const qs = query.toString();
  return api.get(`/api/admin/reviews${qs ? `?${qs}` : ''}`);
}

export async function createReview(payload) {
  return api.post('/api/admin/reviews', payload);
}

export async function updateReview(id, payload) {
  return api.patch(`/api/admin/reviews/${id}`, payload);
}

export async function deleteReview(id) {
  return api.del(`/api/admin/reviews/${id}`);
}