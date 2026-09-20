import { API_URL } from './api';

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export async function uploadImage(file, fieldName = '') {
  const form = new FormData();
  form.append('file', file);
  if (fieldName) form.append('fieldName', fieldName);

  const res = await fetch(`${API_URL}/api/admin/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const error = new Error(data?.message || `Upload failed (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return data;
}