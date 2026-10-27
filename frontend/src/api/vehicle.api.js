import api from './axios';
export const vehicleApi = {
  list: async () => (await api.get('/vehicles')).data,
  get: async (id) => (await api.get(`/vehicles/${id}`)).data,
  create: async (body) => (await api.post('/vehicles', body)).data,
  update: async (id, body) => (await api.put(`/vehicles/${id}`, body)).data,
  updateOdometer: async (id, current_km) => (await api.patch(`/vehicles/${id}/odometer`, { current_km })).data,
  maintenance: async (id) => (await api.get(`/vehicles/${id}/maintenance`)).data,
  odometerLog: async (id) => (await api.get(`/vehicles/${id}/odometer-logs`)).data,
};
