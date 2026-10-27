import api from './axios';
export const bookingApi = {
  list: async (params) => (await api.get('/bookings', { params })).data,
  centers: async (params) => (await api.get('/service-centers', { params })).data,
  slots: async (params) => (await api.get('/bookings/slots', { params })).data,
  create: async (body) => (await api.post('/bookings', body)).data,
  updateStatus: async (id, body) => (await api.patch(`/bookings/${id}/status`, body)).data,
};
