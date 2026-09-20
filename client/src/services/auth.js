import { api } from './api';

export async function login(email, password) {
  return api.post('/api/auth/login', { email, password });
}

export async function logout() {
  return api.post('/api/auth/logout');
}

export async function fetchMe() {
  return api.get('/api/auth/me');
}

export async function changeCredentials(payload) {
  return api.patch('/api/auth/credentials', payload);
}

export async function submitReport(payload) {
  return api.post('/api/reports', payload);
}

export async function lookupCaseStatus(caseId) {
  return api.get(`/api/reports/${encodeURIComponent(caseId)}`);
}