import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// ── Profiles ───────────────────────────────────────────────
export const getProfiles = () => api.get('/profiles').then(r => r.data);
export const getProfile = (id) => api.get(`/profiles/${id}`).then(r => r.data);
export const createProfile = (data) => api.post('/profiles', data).then(r => r.data);
export const updateProfile = (id, d) => api.put(`/profiles/${id}`, d).then(r => r.data);
export const deleteProfile = (id) => api.delete(`/profiles/${id}`).then(r => r.data);

// ── Templates ─────────────────────────────────────────────
export const getTemplates = () => api.get('/templates').then(r => r.data);
export const createTemplate = (data) => api.post('/templates', data).then(r => r.data);
export const updateTemplate = (id, d) => api.put(`/templates/${id}`, d).then(r => r.data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`).then(r => r.data);

// ── History ───────────────────────────────────────────────
export const getHistory = (p = 1, l = 20) => api.get(`/history?page=${p}&limit=${l}`).then(r => r.data);
export const getStats = () => api.get('/history/stats').then(r => r.data);
export const logHistory = (data) => api.post('/history', data).then(r => r.data);
export const deleteHistory = (id) => api.delete(`/history/${id}`).then(r => r.data);

export default api;
