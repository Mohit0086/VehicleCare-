import api from './axios';
export const adminApi = {
  dashboard: async () => (await api.get('/admin/dashboard')).data,
  users: async (params) => (await api.get('/admin/users', { params })).data,
  updateUser: async (id, body) => (await api.patch(`/admin/users/${id}`, body)).data,
  centers: async () => (await api.get('/admin/centers')).data,
  createCenter: async (body) => (await api.post('/admin/centers', body)).data,
  updateCenter: async (id, body) => (await api.patch(`/admin/centers/${id}`, body)).data,
  intervals: async () => (await api.get('/admin/intervals')).data,
  updateInterval: async (id, body) => (await api.patch(`/admin/intervals/${id}`, body)).data,
};
