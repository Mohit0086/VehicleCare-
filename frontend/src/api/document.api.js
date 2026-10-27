import api from './axios';
export const documentApi = {
  list: async (vehicleId) => (await api.get(`/vehicles/${vehicleId}/documents`)).data,
  upload: async (vehicleId, body) => (await api.post(`/vehicles/${vehicleId}/documents`, body, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  download: async (id) => (await api.get(`/documents/${id}/download`, { responseType: 'blob' })).data,
};
