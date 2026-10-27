import api from './axios';
export const billApi = {
  list: async () => (await api.get('/bills')).data,
  get: async (id) => (await api.get(`/bills/${id}`)).data,
  download: async (id) => (await api.get(`/bills/${id}/pdf`, { responseType: 'blob' })).data,
};
